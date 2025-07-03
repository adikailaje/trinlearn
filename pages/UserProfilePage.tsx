

import React, { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, UserCircleIcon, PencilIcon, SitemapIcon, UserPlusIcon } from '../components/Icons';
import { Role, User } from '../types';
import { ImageCropModal } from '../components/ImageCropModal';
import { useTranslation } from '../hooks/useTranslation';
import AddUserModal from '../components/AddUserModal';
import UserHierarchy from '../components/UserHierarchy';

interface UserProfilePageProps {
  onNavigateBack: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigateBack }) => {
  const { currentUser, updateUserProfile, updateUserPfp, isLoading: authLoading, error: authError, clearError } = useAuth();
  const { language, changeLanguage, t } = useTranslation();
  
  const [username, setUsername] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCropSrc, setImageToCropSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [isUpdatingPfp, setIsUpdatingPfp] = useState<boolean>(false);

  // State for user management
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isUserMgmtLoading, setIsUserMgmtLoading] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [preselectedManagerId, setPreselectedManagerId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === Role.SuperAdmin;

  const fetchAllUsers = useCallback(async () => {
    setIsUserMgmtLoading(true);
    try {
      const usersRaw = await authService.getAllUsersRaw();
      const usersWithPfp = await Promise.all(
        usersRaw.map(async (rawUser) => {
          const pfp = localStorage.getItem(`user_pfp_${rawUser.id}`);
          return { ...rawUser, profilePictureUrl: pfp || undefined };
        })
      );
      setAllUsers(usersWithPfp);
    } catch (e: any) {
      setFormError("Failed to load user list for management.");
    } finally {
      setIsUserMgmtLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
    }
    if (isSuperAdmin) {
      fetchAllUsers();
    }
    clearError(); 
  }, [currentUser, clearError, isSuperAdmin, fetchAllUsers]);

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    setSuccessMessage(null);
    clearError();
    setIsSubmittingUsername(true);

    if (username.trim() === currentUser.username) {
      setFormError(t('userProfile.username_no_change'));
      setIsSubmittingUsername(false);
      return;
    }
     if (username.trim().length < 3) {
      setFormError(t('signUp.error_username_length'));
      setIsSubmittingUsername(false);
      return;
    }

    try {
      await updateUserProfile(currentUser.id, username.trim());
      setSuccessMessage(t('userProfile.username_updated_success'));
    } catch (err: any) {
      setFormError(err.message || t('userProfile.username_update_fail'));
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const handlePfpEditClick = () => fileInputRef.current?.click();

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageToCropSrc(e.target?.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; 
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    if (!currentUser) return;
    setIsUpdatingPfp(true);
    setFormError(null);
    setSuccessMessage(null);
    clearError();
    try {
      await updateUserPfp(currentUser.id, croppedImageUrl);
      setSuccessMessage(t('userProfile.pfp_updated_success'));
    } catch (err: any) {
      setFormError(err.message || t('userProfile.pfp_update_fail'));
    } finally {
      setIsCropModalOpen(false);
      setImageToCropSrc(null);
      setIsUpdatingPfp(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setImageToCropSrc(null);
  };
  
  const getRoleDisplayName = (role: Role) => {
    switch(role) {
        case Role.SuperAdmin: return t('userProfile.role_superadmin');
        case Role.Admin: return t('userProfile.role_admin');
        case Role.Manager: return t('userProfile.role_manager');
        case Role.User: return t('userProfile.role_user');
        default: return t('userProfile.role_not_found');
    }
  };

  // --- User Management Handlers ---
  const handleOpenAddUserModal = (managerId: string | null = null) => {
    setPreselectedManagerId(managerId);
    setIsAddUserModalOpen(true);
  };
  
  const handleUserAdded = () => {
    setIsAddUserModalOpen(false);
    setSuccessMessage("User added successfully!");
    fetchAllUsers();
  };

  const handleAssignManager = async (employeeId: string, newManagerId: string | null) => {
    try {
        await authService.assignManager(employeeId, newManagerId);
        setSuccessMessage("Employee's manager updated.");
        fetchAllUsers();
    } catch (e: any) {
        setFormError(e.message || "Failed to assign manager.");
    }
  };
  
  const isLoading = authLoading || isSubmittingUsername || isUpdatingPfp || isUserMgmtLoading;
  const displayError = authError || formError;

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200 pb-20">
        <main className="flex-grow container mx-auto p-4 md:p-6 space-y-6">
          <div className="max-w-xl mx-auto">
              <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                        {currentUser?.profilePictureUrl ? (
                        <img src={currentUser.profilePictureUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover border-2 border-red-500 shadow-md"/>
                        ) : (
                        <UserCircleIcon className="w-28 h-28 text-neutral-500" />
                        )}
                        <button onClick={handlePfpEditClick} disabled={isLoading} className="absolute bottom-0 right-0 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50" title={t('userProfile.edit_pfp')}>
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept="image/png, image/jpeg" className="hidden" />
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-neutral-100">{currentUser?.username || 'User'}</h2>
                    <p className="text-sm text-neutral-400">{currentUser ? getRoleDisplayName(currentUser.role) : t('userProfile.role_not_found')}</p>
                </div>

                <form onSubmit={handleUsernameSubmit} className="space-y-4">
                  <div>
                      <label htmlFor="username" className="block text-sm font-medium text-neutral-300 mb-1">{t('userProfile.usernameLabel')}</label>
                      <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading || (currentUser?.username === 'superadmin' && isSuperAdmin)} className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed" />
                      {currentUser?.username === 'superadmin' && isSuperAdmin && <p className="text-xs text-neutral-500 mt-1">{t('userProfile.username_superadmin_no_change')}</p>}
                  </div>
                  <button type="submit" disabled={isLoading || (currentUser?.username === 'superadmin' && isSuperAdmin) || username === currentUser?.username} className="w-full flex items-center justify-center px-4 py-2.5 rounded-md font-semibold text-sm bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSubmittingUsername ? <Loader size="sm" className="mr-2" /> : <PencilIcon className="w-4 h-4 mr-2" />}
                      {t('userProfile.updateUsernameButton')}
                  </button>
                </form>
                
                <div className="mt-4 pt-4 border-t border-neutral-700">
                  <label htmlFor="language-select" className="block text-sm font-medium text-neutral-300 mb-1">{t('userProfile.language')}</label>
                  <select id="language-select" value={language} onChange={(e) => changeLanguage(e.target.value as any)} className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="hi">हिन्दी</option>
                      <option value="mr">मराठी</option>
                  </select>
                </div>

                {displayError && <p className="text-sm text-red-400 bg-red-700/20 border border-red-600/50 p-2.5 rounded-md mt-4">{displayError}</p>}
                {successMessage && <p className="text-sm text-green-400 bg-green-700/20 border border-green-600/50 p-2.5 rounded-md mt-4">{successMessage}</p>}

                <button onClick={onNavigateBack} className="mt-6 w-full flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm bg-neutral-600 hover:bg-neutral-500 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 mr-1.5" /> {t('userProfile.go_back_dashboard')}
                </button>
            </div>
          </div>
          
          {isSuperAdmin && (
            <div className="max-w-4xl mx-auto mt-8">
              <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-neutral-700">
                  <h3 className="text-xl font-semibold flex items-center text-neutral-100">
                      <SitemapIcon className="w-6 h-6 mr-3 text-sky-400"/>
                      User Hierarchy Management
                  </h3>
                  <button onClick={() => handleOpenAddUserModal(null)} className="mt-2 sm:mt-0 flex items-center justify-center px-3 py-2 rounded-md font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white transition-colors">
                      <UserPlusIcon className="w-4 h-4 mr-1.5"/> Add User
                  </button>
                </div>
                <div className="overflow-x-auto p-2">
                    {isUserMgmtLoading ? (
                        <div className="flex justify-center items-center py-10"><Loader size="md" /></div>
                    ) : (
                        <UserHierarchy users={allUsers} currentUser={currentUser} onAddWorker={handleOpenAddUserModal} onAssignManager={handleAssignManager} />
                    )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {imageToCropSrc && (
        <ImageCropModal isOpen={isCropModalOpen} imageSrc={imageToCropSrc} onCropComplete={handleCropComplete} onCancel={handleCropCancel} />
      )}

      {isSuperAdmin && currentUser && (
        <AddUserModal 
          isOpen={isAddUserModalOpen} 
          onClose={() => setIsAddUserModalOpen(false)}
          currentUser={currentUser}
          onUserAdded={handleUserAdded}
          preselectedManagerId={preselectedManagerId}
        />
      )}
    </>
  );
};

export default UserProfilePage;
