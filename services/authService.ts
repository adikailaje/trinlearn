

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

// Helper to simulate async operations (can be moved to a utility file if used widely)
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  checkUsernameExists: async (username: string, excludeUserId?: string): Promise<{ exists: boolean, isSuperAdminConflict: boolean, message?: string }> => {
    await simulateDelay(300); 
    const users = getStoredUsersRaw();
    const normalizedUsername = username.toLowerCase();

    if (normalizedUsername === 'superadmin') {
      const superadminUser = users.find(u => u.username.toLowerCase() === 'superadmin');
      if (superadminUser && excludeUserId && superadminUser.id === excludeUserId) {
        // This case means superadmin is trying to change their own username *to* 'superadmin', which is fine.
        return { exists: false, isSuperAdminConflict: false };
      }
      // If someone else tries to take 'superadmin', or superadmin tries to create another 'superadmin'.
      return { exists: true, isSuperAdminConflict: true, message: "Username 'superadmin' is reserved." };
    }
    const userExists = users.some(u => u.username.toLowerCase() === normalizedUsername && u.id !== excludeUserId);
    if (userExists) {
      return { exists: true, isSuperAdminConflict: false, message: "Username already taken." };
    }
    return { exists: false, isSuperAdminConflict: false };
  },

  login: async (username: string, password_raw: string): Promise<User> => {
    await simulateDelay(500); 
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
        if (!userWithPfp) throw new Error("User data inconsistent."); 
        storeSession(userWithPfp);
        return userWithPfp;
    }
    
    throw new Error("Invalid username or password.");
  },

  signup: async (username: string, password_raw: string): Promise<User> => {
    // Public signup always creates a Role.User (Worker/Employee)
    await simulateDelay(500); 
    
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
      role: Role.User, // Default role for public sign-up
      managerId: null,
    };
    
    usersRaw.push(newUserRaw);
    saveUsersRaw(usersRaw);
    localStorage.setItem(`user_pwd_${newUserRaw.username}`, simpleHash(password_raw));
    localStorage.setItem(PFP_STORAGE_KEY_PREFIX + newUserRaw.id, ''); 

    const newUserWithPfp = getUserWithPfp(newUserRaw);
    if (!newUserWithPfp) throw new Error("User data inconsistent after signup."); 
    storeSession(newUserWithPfp); 
    return newUserWithPfp;
  },

  logout: async (): Promise<void> => {
    await simulateDelay(200);
    clearSession();
  },

  getCurrentUser: async (): Promise<User | null> => {
    await simulateDelay(100); 
    const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionJson) {
      return JSON.parse(sessionJson) as User;
    }
    return null;
  },
  
  getAllUsersRaw: async (): Promise<Omit<User, 'profilePictureUrl'>[]> => {
    await simulateDelay(50);
    return getStoredUsersRaw();
  },

  createManagedUser: async (
    creator: User,
    newUserDetails: {
      username: string;
      password_raw: string;
      roleToAssign: Role;
      managerId?: string | null;
    }
  ): Promise<User> => {
    await simulateDelay(500);
    // Role-based permission check
    const creatableRoles = {
      [Role.SuperAdmin]: [Role.Admin, Role.Manager, Role.User],
      [Role.Admin]: [Role.Manager, Role.User],
      [Role.Manager]: [Role.User],
      [Role.User]: [],
    };
    if (!creatableRoles[creator.role].includes(newUserDetails.roleToAssign)) {
      throw new Error(`A ${creator.role} cannot create a ${newUserDetails.roleToAssign}.`);
    }

    if (!newUserDetails.username || newUserDetails.username.trim().length < 3) throw new Error("Username must be at least 3 characters.");
    if (!newUserDetails.password_raw || newUserDetails.password_raw.length < 6) throw new Error("Password must be at least 6 characters.");

    const usernameCheck = await authService.checkUsernameExists(newUserDetails.username.trim());
    if (usernameCheck.exists) {
      throw new Error(usernameCheck.message);
    }
    
    if (newUserDetails.roleToAssign === Role.User && !newUserDetails.managerId) {
      console.warn(`Creating a User role without a managerId.`);
    }

    const usersRaw = getStoredUsersRaw();
    const newUserRaw: Omit<User, 'profilePictureUrl'> = {
      id: `user-${Date.now()}`,
      username: newUserDetails.username.trim(),
      role: newUserDetails.roleToAssign,
      managerId: newUserDetails.managerId || null,
    };
    
    usersRaw.push(newUserRaw);
    saveUsersRaw(usersRaw);
    localStorage.setItem(`user_pwd_${newUserRaw.username}`, simpleHash(newUserDetails.password_raw));
    localStorage.setItem(PFP_STORAGE_KEY_PREFIX + newUserRaw.id, '');

    const newUserWithPfp = getUserWithPfp(newUserRaw);
    if (!newUserWithPfp) throw new Error("User data inconsistent after creation.");
    
    return newUserWithPfp;
  },

  assignManager: async (employeeId: string, managerId: string | null): Promise<User> => {
    await simulateDelay(200);
    const usersRaw = getStoredUsersRaw();
    const userIndex = usersRaw.findIndex(u => u.id === employeeId);

    if (userIndex === -1) {
      throw new Error("Employee not found.");
    }
    
    const employee = usersRaw[userIndex];
    if (employee.role !== Role.User) {
      throw new Error("Only users with the 'Employee/Worker' role can be assigned a manager.");
    }

    if (managerId) {
      const managerExists = usersRaw.some(u => u.id === managerId && u.role === Role.Manager);
      if (!managerExists) {
        throw new Error("Manager not found.");
      }
    }
    
    (employee as User).managerId = managerId;
    saveUsersRaw(usersRaw);
    
    const updatedUserWithPfp = getUserWithPfp(employee);
    if (!updatedUserWithPfp) throw new Error("User data inconsistent after manager assignment.");

    return updatedUserWithPfp;
  },

  updateUser: async (userId: string, newUsername: string): Promise<User> => {
    await simulateDelay(500);
    const normalizedNewUsername = newUsername.trim();

    if (!normalizedNewUsername || normalizedNewUsername.length < 3) {
      throw new Error("Username must be at least 3 characters.");
    }

    const usersRaw = getStoredUsersRaw();
    const userIndex = usersRaw.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error("User not found.");
    }

    const currentUserRaw = usersRaw[userIndex] as User;
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
    
    currentUserRaw.username = normalizedNewUsername;
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
    await simulateDelay(300);
    const usersRaw = getStoredUsersRaw();
    const userRaw = usersRaw.find(u => u.id === userId);

    if (!userRaw) {
      throw new Error("User not found for PFP update.");
    }

    localStorage.setItem(PFP_STORAGE_KEY_PREFIX + userId, profilePictureUrl);
    
    const updatedUserWithPfp = { ...(userRaw as User), profilePictureUrl };

    const sessionUser = await authService.getCurrentUser();
    if (sessionUser && sessionUser.id === userId) {
      storeSession(updatedUserWithPfp); 
    }

    return updatedUserWithPfp;
  },
};

// Initialize by ensuring raw users are loaded at least once.
getStoredUsersRaw();
