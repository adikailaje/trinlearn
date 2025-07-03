import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Loader } from './Loader';
import { EyeIcon, EyeSlashIcon, InformationCircleIcon } from './Icons';
import { Role, User } from '../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserAdded: () => void;
  preselectedManagerId?: string | null;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, currentUser, onUserAdded, preselectedManagerId }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getCreatableRoles = (creatorRole: Role): { value: Role, label: string }[] => {
    switch (creatorRole) {
      case Role.SuperAdmin:
        return [
          { value: Role.Admin, label: 'Owner/Administrator' },
          { value: Role.Manager, label: 'Manager' },
          { value: Role.User, label: 'Employee/Worker' },
        ];
      case Role.Admin:
        return [
          { value: Role.Manager, label: 'Manager' },
          { value: Role.User, label: 'Employee/Worker' },
        ];
      case Role.Manager:
        return [{ value: Role.User, label: 'Employee/Worker' }];
      default:
        return [];
    }
  };

  const creatableRoles = getCreatableRoles(currentUser.role);

  useEffect(() => {
    // Reset form when modal opens or props change
    if (isOpen) {
      setUsername('');
      setPassword('');
      setFormError(null);
      setUsernameError(null);
      setRole(preselectedManagerId ? Role.User : (creatableRoles.length > 0 ? creatableRoles[0].value : ''));
    }
  }, [isOpen, currentUser.role, preselectedManagerId]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameError) setUsernameError(null);
    if (formError) setFormError(null);
  };

  const validateUsername = useCallback(async (currentUsername: string) => {
    if (!currentUsername || currentUsername.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return false;
    }
    setIsCheckingUsername(true);
    setUsernameError(null);
    try {
      const result = await authService.checkUsernameExists(currentUsername);
      if (result.exists) {
        setUsernameError(result.message || "Username not available.");
        return false;
      }
      return true;
    } catch (e: any) {
      setUsernameError(e.message || "Failed to check username.");
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  const handleUsernameBlur = async () => {
    if (username.trim()) await validateUsername(username.trim());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setUsernameError(null);

    if (!username.trim() || !password || !role) {
      setFormError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    const isUsernameValid = await validateUsername(username.trim());
    if (!isUsernameValid) return;

    setIsLoading(true);
    try {
      await authService.createManagedUser(currentUser, {
        username: username.trim(),
        password_raw: password,
        roleToAssign: role as Role,
        managerId: preselectedManagerId,
      });
      onUserAdded(); // Callback to refresh user list in parent
    } catch (err: any) {
      setFormError(err.message || "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayError = formError || usernameError;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-neutral-100">Add New User</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-username" className="block text-sm font-medium text-neutral-300">Username</label>
            <div className="mt-1 relative">
              <input
                id="new-username"
                type="text"
                autoComplete="off"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onBlur={handleUsernameBlur}
                className={`block w-full appearance-none rounded-md border bg-[#222222] px-3 py-2 text-neutral-100 placeholder-neutral-500 shadow-sm focus:outline-none sm:text-sm ${usernameError ? 'border-red-500' : 'border-neutral-600 focus:border-red-500 focus:ring-red-500'}`}
              />
              {isCheckingUsername && <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><Loader size="sm"/></div>}
            </div>
            {usernameError && <p className="mt-1 text-xs text-red-400">{usernameError}</p>}
          </div>

          <div>
            <label htmlFor="new-password"className="block text-sm font-medium text-neutral-300">Password</label>
            <div className="mt-1 relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full appearance-none rounded-md border border-neutral-600 bg-[#222222] px-3 py-2 text-neutral-100 placeholder-neutral-500 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300">
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="new-role" className="block text-sm font-medium text-neutral-300">Role</label>
            <select
                id="new-role"
                value={role}
                onChange={(e) => !preselectedManagerId && setRole(e.target.value as Role)}
                disabled={!!preselectedManagerId}
                className="mt-1 block w-full appearance-none rounded-md border border-neutral-600 bg-[#222222] px-3 py-2 text-neutral-100 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {preselectedManagerId && <option value={Role.User}>Employee/Worker</option>}

                {!preselectedManagerId && creatableRoles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                ))}
            </select>
          </div>

          {formError && !usernameError && (
             <div className="mt-2 text-xs p-2.5 rounded-md bg-red-700/20 border border-red-600/50 text-red-300 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 flex-shrink-0"/>
                <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-md text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isLoading || isCheckingUsername} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center">
              {(isLoading || isCheckingUsername) && <Loader size="sm" className="mr-2" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
