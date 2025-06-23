import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, UserCircleIcon, PencilIcon } from '../components/Icons';
import { Role } from '../types';
import { ImageCropModal } from '../components/ImageCropModal'; // New import

interface UserProfilePageProps {
  onNavigateBack: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigateBack }) => {
  const { currentUser, updateUserProfile, updateUserPfp, isLoading: authLoading, error: authError, clearError } = useAuth();
  
  const [username, setUsername] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState<boolean>(false);

  // Profile Picture State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCropSrc, setImageToCropSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [isUpdatingPfp, setIsUpdatingPfp] = useState<boolean>(false);


  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
    }
    clearError(); 
  }, [currentUser, clearError]);

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setFormError(null);
    setSuccessMessage(null);
    clearError();
    setIsSubmittingUsername(true);

    if (username.trim() === currentUser.username) {
      setFormError("No changes detected in username.");
      setIsSubmittingUsername(false);
      return;
    }
     if (username.trim().length < 3) {
      setFormError("Username must be at least 3 characters.");
      setIsSubmittingUsername(false);
      return;
    }

    try {
      await updateUserProfile(currentUser.id, username.trim());
      setSuccessMessage("Username updated successfully!");
    } catch (err: any) {
      setFormError(err.message || "Failed to update username.");
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const handlePfpEditClick = () => {
    fileInputRef.current?.click();
  };

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
    event.target.value = ''; // Reset file input
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    if (!currentUser) return;
    setIsUpdatingPfp(true);
    setFormError(null);
    setSuccessMessage(null);
    clearError();
    try {
      await updateUserPfp(currentUser.id, croppedImageUrl);
      setSuccessMessage("Profile picture updated successfully!");
    } catch (err: any) {
      setFormError(err.message || "Failed to update profile picture.");
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


  if (authLoading && !currentUser) { 
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] text-neutral-200">
        <Loader size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] p-4 text-neutral-200">
             <p>User not found. Please try logging in again.</p>
             <button
                onClick={onNavigateBack}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
                Go Back
            </button>
        </div>
    );
  }
  
  const displayError = formError || authError;

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200">
        <header className="bg-[#1A1A1A] p-4 shadow-xl sticky top-0 z-50 border-b border-[#2C2C2C]">
          <div className="container mx-auto flex items-center justify-between">
            <button
              onClick={onNavigateBack}
              className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50"
              aria-label="Go back to main application"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-xl font-bold text-red-500">
              User Profile
            </h1>
            <div className="w-20"></div> 
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 md:p-6 flex justify-center">
          <div className="w-full max-w-lg bg-[#1A1A1A] p-6 sm:p-8 rounded-lg shadow-xl border border-[#2C2C2C]">
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative group mb-3">
                {currentUser.profilePictureUrl ? (
                  <img 
                    src={currentUser.profilePictureUrl} 
                    alt="Profile" 
                    className="w-28 h-28 rounded-full object-cover border-2 border-neutral-700 shadow-md"
                  />
                ) : (
                  <UserCircleIcon className="w-28 h-28 text-neutral-500" />
                )}
                <button
                  onClick={handlePfpEditClick}
                  disabled={isUpdatingPfp}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  title="Change profile picture"
                >
                  {isUpdatingPfp ? <Loader size="sm" /> : <PencilIcon className="w-8 h-8 text-white" />}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelected} 
                  accept="image/png, image/jpeg, image/webp" 
                  style={{ display: 'none' }}
                  disabled={isUpdatingPfp}
                />
              </div>
              <p className="text-lg text-neutral-300">Role: <span className="font-semibold capitalize text-neutral-100">{currentUser.role}</span></p>
            </div>
            
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-neutral-300">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if(formError) setFormError(null); 
                        if(successMessage) setSuccessMessage(null);
                        clearError();
                    }}
                    className={`block w-full appearance-none rounded-md border bg-[#222222] px-3 py-2 text-neutral-100 placeholder-neutral-500 shadow-sm focus:outline-none sm:text-sm
                      ${displayError && !isUpdatingPfp ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-[#333333] focus:border-red-500 focus:ring-red-500'}`}
                    disabled={isSubmittingUsername || authLoading || (currentUser.role === Role.SuperAdmin && currentUser.username === 'superadmin') || isUpdatingPfp}
                  />
                  {currentUser.role === Role.SuperAdmin && currentUser.username === 'superadmin' && (
                      <p className="mt-1 text-xs text-neutral-500">The 'superadmin' username cannot be changed.</p>
                  )}
                </div>
              </div>

              {displayError && (
                <div className="rounded-md bg-red-700/30 p-3">
                  <p className="text-sm text-red-300">{displayError}</p>
                </div>
              )}
              {successMessage && (
                <div className="rounded-md bg-green-700/30 p-3 border border-green-600">
                  <p className="text-sm text-green-300">{successMessage}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmittingUsername || authLoading || (currentUser.role === Role.SuperAdmin && currentUser.username === 'superadmin') || isUpdatingPfp}
                  className="flex w-full justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isSubmittingUsername || (authLoading && !isUpdatingPfp)) ? <Loader size="sm" className="text-white" /> : 'Save Username Changes'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      <ImageCropModal 
        isOpen={isCropModalOpen}
        imageSrc={imageToCropSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    </>
  );
};

export default UserProfilePage;