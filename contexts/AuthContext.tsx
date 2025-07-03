
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Role, AuthContextType } from '../types';
import { authService } from '../services/authService';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const verifyUserSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser(); 
      if (user) {
        setCurrentUser(user); // User from authService.getCurrentUser now includes PFP
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Session verification error:", e);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyUserSession();
  }, [verifyUserSession]);

  const login = async (username: string, password_raw: string) => {
    clearError();
    setIsLoading(true);
    try {
      const user = await authService.login(username, password_raw); // User from login includes PFP
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (e: any) {
      setError(e.message || "Login failed");
      setIsAuthenticated(false);
      setCurrentUser(null);
      throw e; 
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, password_raw: string) => {
    clearError();
    setIsLoading(true);
    try {
      const user = await authService.signup(username, password_raw); // User from signup includes PFP
      setCurrentUser(user);
      setIsAuthenticated(true); 
    } catch (e: any) {
      setError(e.message || "Signup failed");
      setIsAuthenticated(false);
      setCurrentUser(null);
      throw e; 
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    clearError();
    setIsLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (e: any) {
        setError(e.message || "Logout failed");
    } finally {
        setIsLoading(false);
    }
  };

  const updateUserProfile = async (userId: string, newUsername: string): Promise<User> => {
    clearError();
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateUser(userId, newUsername); // User from updateUser includes PFP
      setCurrentUser(updatedUser); 
      return updatedUser;
    } catch (e: any) {
      setError(e.message || "Profile update failed");
      throw e; 
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPfp = async (userId: string, profilePictureUrl: string): Promise<User> => {
    clearError();
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateUserProfilePicture(userId, profilePictureUrl);
      setCurrentUser(updatedUser); // Update context state with new PFP
      return updatedUser;
    } catch (e: any) {
      setError(e.message || "Profile picture update failed");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isLoading, login, signup, logout, error, clearError, updateUserProfile, updateUserPfp }}>
      {children}
    </AuthContext.Provider>
  );
};
