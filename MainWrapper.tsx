import React, { useState, useEffect } from 'react';
import App from './App';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import UserProfilePage from './pages/UserProfilePage';
import SavedMachinesPage from './pages/SavedMachinesPage';
import MachineDetailPage from './pages/MachineDetailPage';
import { useAuth } from './hooks/useAuth';
import { Loader } from './components/Loader';
import { MachineDetailData, AppProps } from './types';

export enum AuthView {
  SignIn,
  SignUp,
  App,
  UserProfile,
  SavedMachines,
  MachineDetail
}

const MainWrapper: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>(AuthView.SignIn);
  const [machineDetailData, setMachineDetailData] = useState<MachineDetailData | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (currentView === AuthView.SignIn || currentView === AuthView.SignUp) {
          setCurrentView(AuthView.App);
        } else if (![AuthView.App, AuthView.UserProfile, AuthView.SavedMachines, AuthView.MachineDetail].includes(currentView)) {
          // If authenticated but currentView is an unexpected value, default to App view.
          // This could happen if currentView was persisted and is no longer valid or during development.
          setCurrentView(AuthView.App);
        }
      } else {
        if (currentView !== AuthView.SignUp) {
            setCurrentView(AuthView.SignIn);
        }
      }
    }
  }, [isAuthenticated, isLoading, currentView]);

  const navigateToApp = () => {
    setMachineDetailData(null); 
    setCurrentView(AuthView.App);
  }
  const navigateToUserProfile = () => {
    if (isAuthenticated) {
      setCurrentView(AuthView.UserProfile);
    }
  };
  const navigateToSavedMachines = () => {
    if (isAuthenticated) {
      setCurrentView(AuthView.SavedMachines);
    }
  };
  const navigateToMachineDetail = (data: MachineDetailData) => {
    if (isAuthenticated) {
      setMachineDetailData(data);
      setCurrentView(AuthView.MachineDetail);
    }
  };
  const navigateToSignIn = () => setCurrentView(AuthView.SignIn);
  const navigateToSignUp = () => setCurrentView(AuthView.SignUp);

  const appProps: AppProps = {
    onNavigateToProfile: navigateToUserProfile,
    onNavigateToSavedMachines: navigateToSavedMachines,
    onNavigateToMachineDetail: navigateToMachineDetail,
    currentUser: currentUser,
  };

  if (isLoading && !isAuthenticated) { // Show loader only during initial auth check
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] text-neutral-200">
        <Loader size="lg" />
        <p className="mt-4 text-neutral-400">Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === AuthView.SignUp) {
      return <SignUpPage onSwitchToSignIn={navigateToSignIn} />;
    }
    return <SignInPage onSwitchToSignUp={navigateToSignUp} />;
  }

  // Authenticated views
  return (
    <>
      {/* App component is always mounted when authenticated; visibility controlled by CSS */}
      <div style={{ display: currentView === AuthView.App ? 'block' : 'none' }}>
        <App {...appProps} />
      </div>

      {/* Other authenticated views are rendered on top / instead */}
      {currentView === AuthView.UserProfile && (
        <UserProfilePage onNavigateBack={navigateToApp} />
      )}
      {currentView === AuthView.SavedMachines && (
        <SavedMachinesPage onNavigateBack={navigateToApp} />
      )}
      {currentView === AuthView.MachineDetail && machineDetailData && (
        <MachineDetailPage machineData={machineDetailData} onNavigateBack={navigateToApp} />
      )}
      
      {/* Fallback for an unexpected authenticated view state, though useEffect should prevent this */}
      {isLoading && isAuthenticated && ![AuthView.App, AuthView.UserProfile, AuthView.SavedMachines, AuthView.MachineDetail].includes(currentView) && (
           <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] text-neutral-200">
             <Loader size="lg" />
             <p className="mt-4 text-neutral-400">Loading view...</p>
           </div>
      )}
    </>
  );
};

export default MainWrapper;