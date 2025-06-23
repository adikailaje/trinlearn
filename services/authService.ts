// Mock authentication service
// In a real app, this would interact with a backend.
// For simplicity, we use localStorage for persistence.
import { User, Role } from '../types';

const USERS_STORAGE_KEY = 'gemini_live_app_users';
const SESSION_STORAGE_KEY = 'gemini_live_app_session';
const PFP_STORAGE_KEY_PREFIX = 'user_pfp_';

// Simulate password hashing (DO NOT USE IN PRODUCTION)
const simpleHash = (password: string): string => {
  return `hashed_${password}_${password.split("").reverse().join("")}`;
};

const getStoredUsersRaw = (): Omit<User, 'profilePictureUrl'>[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  if (usersJson) {
    return JSON.parse(usersJson);
  }
  const superAdmin: Omit<User, 'profilePictureUrl'> = {
    id: 'superadmin-001',
    username: 'superadmin',
    role: Role.SuperAdmin,
  };
  const initialUsers = [superAdmin];
  if (!localStorage.getItem(`user_pwd_superadmin`)) {
     localStorage.setItem(`user_pwd_superadmin`, simpleHash('Ay+1d@@2004'));
  }
  localStorage.setItem(PFP_STORAGE_KEY_PREFIX + superAdmin.id, ''); // Init PFP for superadmin
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  return initialUsers;
};

const saveUsersRaw = (users: Omit<User, 'profilePictureUrl'>[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const getUserWithPfp = (user: Omit<User, 'profilePictureUrl'> | null): User | null => {
  if (!user) return null;
  const pfpUrl = localStorage.getItem(PFP_STORAGE_KEY_PREFIX + user.id);
  return { ...user, profilePictureUrl: pfpUrl || undefined };
};

const storeSession = (user: User) => { // Expects User with PFP
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const authService = {
  checkUsernameExists: async (username: string, excludeUserId?: string): Promise<{ exists: boolean, isSuperAdminConflict: boolean, message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300)); 
    const users = getStoredUsersRaw();
    const normalizedUsername = username.toLowerCase();

    if (normalizedUsername === 'superadmin') {
      const superadminUser = users.find(u => u.username.toLowerCase() === 'superadmin');
      if (superadminUser && excludeUserId && superadminUser.id === excludeUserId) {
        return { exists: false, isSuperAdminConflict: false };
      }
      return { exists: true, isSuperAdminConflict: true, message: "Admin privileges are already reserved for this account." };
    }
    const userExists = users.some(u => u.username.toLowerCase() === normalizedUsername && u.id !== excludeUserId);
    if (userExists) {
      return { exists: true, isSuperAdminConflict: false, message: "Username already taken." };
    }
    return { exists: false, isSuperAdminConflict: false };
  },

  login: async (username: string, password_raw: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const usersRaw = getStoredUsersRaw();
    const userRaw = usersRaw.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!userRaw) {
      throw new Error("Invalid username or password.");
    }
    
    const passwordToCheck = userRaw.username === 'superadmin' ? 'Ay+1d@@2004' : password_raw;
    const expectedHash = localStorage.getItem(`user_pwd_${userRaw.username}`);

    if (expectedHash && simpleHash(passwordToCheck) === expectedHash) {
        if (userRaw.username === 'superadmin' && password_raw !== 'Ay+1d@@2004') {
             throw new Error("Invalid username or password.");
        }
        const userWithPfp = getUserWithPfp(userRaw);
        if (!userWithPfp) throw new Error("User data inconsistent."); // Should not happen
        storeSession(userWithPfp);
        return userWithPfp;
    }
    
    throw new Error("Invalid username or password.");
  },

  signup: async (username: string, password_raw: string, role: Role): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    if (!username || username.trim().length < 3) throw new Error("Username must be at least 3 characters.");
    if (!password_raw || password_raw.length < 6) throw new Error("Password must be at least 6 characters.");

    const usernameCheck = await authService.checkUsernameExists(username.trim());
    if (usernameCheck.exists) {
        throw new Error(usernameCheck.message);
    }

    const usersRaw = getStoredUsersRaw();
    const newUserRaw: Omit<User, 'profilePictureUrl'> = {
      id: `user-${Date.now()}`,
      username: username.trim(), 
      role,
    };
    
    usersRaw.push(newUserRaw);
    saveUsersRaw(usersRaw);
    localStorage.setItem(`user_pwd_${newUserRaw.username}`, simpleHash(password_raw));
    localStorage.setItem(PFP_STORAGE_KEY_PREFIX + newUserRaw.id, ''); // Initialize PFP storage

    const newUserWithPfp = getUserWithPfp(newUserRaw);
    if (!newUserWithPfp) throw new Error("User data inconsistent after signup."); // Should not happen
    storeSession(newUserWithPfp); 
    return newUserWithPfp;
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    clearSession();
  },

  getCurrentUser: async (): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 100)); 
    const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionJson) {
      // Session already stores user with PFP
      return JSON.parse(sessionJson) as User;
    }
    return null;
  },
  
  updateUser: async (userId: string, newUsername: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const normalizedNewUsername = newUsername.trim();

    if (!normalizedNewUsername || normalizedNewUsername.length < 3) {
      throw new Error("Username must be at least 3 characters.");
    }

    const usersRaw = getStoredUsersRaw();
    const userIndex = usersRaw.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error("User not found.");
    }

    const currentUserRaw = usersRaw[userIndex];
    const oldUsername = currentUserRaw.username;

    if (currentUserRaw.role === Role.SuperAdmin && currentUserRaw.username === 'superadmin' && normalizedNewUsername.toLowerCase() !== 'superadmin') {
      throw new Error("The 'superadmin' username cannot be changed.");
    }
    if (normalizedNewUsername.toLowerCase() === 'superadmin' && currentUserRaw.username.toLowerCase() !== 'superadmin') {
         throw new Error("Cannot change username to 'superadmin'. This name is reserved.");
    }

    if (oldUsername.toLowerCase() !== normalizedNewUsername.toLowerCase()) {
      const usernameCheck = await authService.checkUsernameExists(normalizedNewUsername, userId);
      if (usernameCheck.exists) {
        throw new Error(usernameCheck.message);
      }
    }
    
    usersRaw[userIndex].username = normalizedNewUsername;
    saveUsersRaw(usersRaw);

    if (oldUsername !== normalizedNewUsername) {
      const passwordHash = localStorage.getItem(`user_pwd_${oldUsername}`);
      if (passwordHash) {
        localStorage.removeItem(`user_pwd_${oldUsername}`);
        localStorage.setItem(`user_pwd_${normalizedNewUsername}`, passwordHash);
      }
    }
    
    const updatedUserWithPfp = getUserWithPfp(usersRaw[userIndex]);
    if (!updatedUserWithPfp) throw new Error("User data inconsistent after update.");

    const sessionUser = await authService.getCurrentUser();
    if (sessionUser && sessionUser.id === userId) {
      storeSession(updatedUserWithPfp);
    }
    
    return updatedUserWithPfp;
  },

  updateUserProfilePicture: async (userId: string, profilePictureUrl: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const usersRaw = getStoredUsersRaw();
    const userRaw = usersRaw.find(u => u.id === userId);

    if (!userRaw) {
      throw new Error("User not found for PFP update.");
    }

    localStorage.setItem(PFP_STORAGE_KEY_PREFIX + userId, profilePictureUrl);
    
    const updatedUserWithPfp = { ...userRaw, profilePictureUrl };

    const sessionUser = await authService.getCurrentUser();
    if (sessionUser && sessionUser.id === userId) {
      storeSession(updatedUserWithPfp); // Update session with new PFP
    }

    return updatedUserWithPfp;
  }
};

// Initialize by ensuring raw users are loaded at least once.
getStoredUsersRaw();
