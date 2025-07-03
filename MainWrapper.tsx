



import React, { useState, useEffect, useRef, useCallback } from 'react';
import App from '@/App';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import UserProfilePage from './pages/UserProfilePage';
import SavedMachinesPage from './pages/SavedMachinesPage';
import MachineDetailPage, { MachineDetailPageProps as InternalMachineDetailPageProps } from './pages/MachineDetailPage';
import DashboardPage from './pages/DashboardPage';
import MyWorkPage from './pages/MyWorkPage';
import ReportIssuePage from './pages/ReportIssuePage';
import SafetyPage from './pages/SafetyPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import WorkOrderCompletionPage from './pages/WorkOrderCompletionPage';
import PermitDetailPage from './pages/PermitDetailPage';
import ChatListPage from './pages/ChatListPage';
import ChatConversationPage from './pages/ChatConversationPage';
import FloorPlanPage from '@/pages/FloorPlanPage';
import FloorPlanEditPage from '@/pages/FloorPlanEditPage';
import ManualAddMachinePage from '@/pages/ManualAddMachinePage';
import BottomNavBar from './components/BottomNavBar';
import PageHeader from './components/PageHeader'; // Import PageHeader
import { useAuth } from './hooks/useAuth';
import { Loader } from './components/Loader';
import { AuthView, MachineDetailData, ScanViewAppProps, MachineNumberUpdatePayload, SavedMachinesPageProps, WorkItem, ReportIssuePageProps, UserMachineData, SafetyPermit, User, VoiceCommandStatus, Role, LiveInteractionStatus, ManualAddMachinePageProps } from './types';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { useLiveInteraction } from './hooks/useLiveInteraction';
import { MicrophoneIcon, MicrophoneSlashIcon, ExclamationTriangleIcon, SpeakerWaveIcon, SparklesIcon } from './components/Icons';
import { rememberedMachinesService } from './services/rememberedMachinesService';
import { useTranslation } from './hooks/useTranslation';

const MainWrapper: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const { registerNavigationAction } = useVoiceCommands(); // Keep for background/keyword navigation
  
  const {
      status: liveStatus,
      userTranscript,
      aiResponseText,
      error: liveError,
      isAvailable: isLiveAvailable,
      startInteraction,
      stopInteraction,
  } = useLiveInteraction();

  const [currentView, setCurrentView] = useState<AuthView>(AuthView.SignIn);
  const [machineDetailNavData, setMachineDetailNavData] = useState<MachineDetailData | null>(null);
  const machineNumberUpdateCallbackRef = useRef<((payload: MachineNumberUpdatePayload) => void) | null>(null);
  
  const [userRememberedMachinesCount, setUserRememberedMachinesCount] = useState<number>(0);
  const childDataChangeCallbackRef = useRef<(() => void) | null>(null);

  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [reportIssuePrefillData, setReportIssuePrefillData] = useState<ReportIssuePageProps['prefillData']>(undefined);
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] = useState<User | null>(null);

  const fetchUserMachineCount = useCallback(async () => {
    if (currentUser) {
      try {
        const machines = await rememberedMachinesService.getUserMachineDataList(currentUser.id);
        setUserRememberedMachinesCount(machines.length);
      } catch (e) {
        console.error("MainWrapper: Failed to load remembered machines count:", e);
        setUserRememberedMachinesCount(0);
      }
    } else {
      setUserRememberedMachinesCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserMachineCount();
  }, [fetchUserMachineCount]);

  const registerChildDataChangeCallback = useCallback((childCallback: () => void) => {
    childDataChangeCallbackRef.current = () => {
      childCallback();
      fetchUserMachineCount();
    };
  }, [fetchUserMachineCount]);


  const handleBottomNav = useCallback((view: AuthView) => {
    setMachineDetailNavData(null);
    machineNumberUpdateCallbackRef.current = null;
    setSelectedWorkItem(null);
    setReportIssuePrefillData(undefined);
    setSelectedPermitId(null);
    setSelectedChatPartner(null);
    setCurrentView(view);
  }, []);

  const navigateToUserProfile = useCallback(() => {
    if (isAuthenticated) setCurrentView(AuthView.UserProfile);
  }, [isAuthenticated]);
  
  const navigateToSavedMachinesView = useCallback(() => {
    if (isAuthenticated) setCurrentView(AuthView.SavedMachines);
  }, [isAuthenticated]);

  useEffect(() => {
    if (registerNavigationAction) {
      registerNavigationAction("NAVIGATE_DASHBOARD", () => handleBottomNav(AuthView.Dashboard));
      registerNavigationAction("NAVIGATE_MY_WORK", () => handleBottomNav(AuthView.MyWork));
      registerNavigationAction("NAVIGATE_SCAN", () => handleBottomNav(AuthView.Scan));
      registerNavigationAction("NAVIGATE_CHAT", () => handleBottomNav(AuthView.ChatList));
      registerNavigationAction("NAVIGATE_REPORT_ISSUE", () => handleBottomNav(AuthView.ReportIssue));
      registerNavigationAction("NAVIGATE_SAFETY", () => handleBottomNav(AuthView.Safety));
      registerNavigationAction("NAVIGATE_FLOOR_PLAN", () => handleBottomNav(AuthView.FloorPlanView));
      registerNavigationAction("NAVIGATE_PROFILE", navigateToUserProfile);
      registerNavigationAction("NAVIGATE_SAVED_MACHINES", navigateToSavedMachinesView);
    }
  }, [registerNavigationAction, handleBottomNav, navigateToUserProfile, navigateToSavedMachinesView]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (currentView === AuthView.SignIn || currentView === AuthView.SignUp) {
          setCurrentView(AuthView.Dashboard);
        } else if (!Object.values(AuthView).includes(currentView as any)) {
           setCurrentView(AuthView.Dashboard);
        }
      } else {
        if (currentView !== AuthView.SignUp) {
            setCurrentView(AuthView.SignIn);
        }
      }
    }
  }, [isAuthenticated, isLoading, currentView]);
  
  const navigateToMachineDetailView = (data: MachineDetailData, onUpdateMachineNumberCallback: (payload: MachineNumberUpdatePayload) => void) => {
    if (isAuthenticated) {
      setMachineDetailNavData(data);
      machineNumberUpdateCallbackRef.current = onUpdateMachineNumberCallback;
      setCurrentView(AuthView.MachineDetail);
    }
  };
  
  const handleMachineDataUpdateFromDetailPage = (updatedData: UserMachineData) => {
    if (machineDetailNavData && machineDetailNavData.make === updatedData.make && machineDetailNavData.modelName === updatedData.modelName) {
        const navId = machineDetailNavData.id;
        const navUserId = machineDetailNavData.userId;
        setMachineDetailNavData({
            ...updatedData,
            id: navId,
            userId: navUserId
        });
    }
    fetchUserMachineCount(); 
  };

  const navigateToReportIssue = (prefillData?: ReportIssuePageProps['prefillData']) => {
    if (isAuthenticated) {
        setReportIssuePrefillData(prefillData || undefined);
        setCurrentView(AuthView.ReportIssue);
    }
  };

  const navigateToScanView = () => setCurrentView(AuthView.Scan); 
  const navigateToMyWorkView = () => setCurrentView(AuthView.MyWork); 
  const navigateToSafetyView = () => setCurrentView(AuthView.Safety);
  const navigateToChatListView = () => setCurrentView(AuthView.ChatList);
  const navigateToFloorPlanView = () => setCurrentView(AuthView.FloorPlanView);
  const navigateToManualAdd = () => setCurrentView(AuthView.ManualAddMachine);
  const navigateToFloorPlanEdit = () => {
    if (currentUser && (currentUser.role === Role.SuperAdmin || currentUser.role === Role.Admin)) {
      setCurrentView(AuthView.FloorPlanEdit);
    } else {
      console.warn("User does not have permission to edit floor plan. Navigating to Floor Plan View.");
      setCurrentView(AuthView.FloorPlanView); 
    }
  };

  const navigateToSignIn = () => setCurrentView(AuthView.SignIn);
  const navigateToSignUp = () => setCurrentView(AuthView.SignUp);


  const navigateToWorkOrderDetail = (item: WorkItem) => {
    setSelectedWorkItem(item);
    setCurrentView(AuthView.WorkOrderDetail);
  };

  const navigateToWorkOrderCompletion = (item: WorkItem) => {
    setSelectedWorkItem(item); 
    setCurrentView(AuthView.WorkOrderCompletion);
  };

  const handleWorkItemUpdate = (updatedItem: WorkItem) => {
    setSelectedWorkItem(updatedItem); 
  };

  const navigateToPermitDetail = (permitId: string) => {
    setSelectedPermitId(permitId);
    setCurrentView(AuthView.PermitDetail);
  };

  const navigateToChatConversation = (partner: User) => {
    setSelectedChatPartner(partner);
    setCurrentView(AuthView.ChatConversation);
  };

  const scanViewAppProps: ScanViewAppProps = {
    onNavigateToProfile: navigateToUserProfile,
    onNavigateToSavedMachinesView: navigateToSavedMachinesView,
    onNavigateToMachineDetailView: navigateToMachineDetailView,
    onNavigateToManualAdd: navigateToManualAdd,
    currentUser: currentUser,
    isActiveScanView: currentView === AuthView.Scan,
    registerDataChangeCallback: registerChildDataChangeCallback, 
  };
  
  const savedMachinesPageProps: SavedMachinesPageProps = {
    onNavigateBackToScanView: navigateToScanView,
    onNavigateToMachineDetail: navigateToMachineDetailView,
    onSavedDataChange: () => { 
        if (childDataChangeCallbackRef.current) {
            childDataChangeCallbackRef.current(); 
        } else {
            fetchUserMachineCount();
        }
    },
  };

  const machineDetailPageInternalProps: InternalMachineDetailPageProps | null = machineDetailNavData && machineNumberUpdateCallbackRef.current
    ? {
        machineInitialData: machineDetailNavData,
        onNavigateBackToScanView: navigateToScanView,
        onMachineNumberUpdate: machineNumberUpdateCallbackRef.current,
        onMachineDataUpdate: handleMachineDataUpdateFromDetailPage,
        onNavigateToReportIssue: navigateToReportIssue,
      }
    : null;
    
  const manualAddMachinePageProps: ManualAddMachinePageProps = {
    onNavigateBack: navigateToScanView,
    onMachineAdded: navigateToMachineDetailView,
  };

  const reportIssuePageProps: ReportIssuePageProps = {
    prefillData: reportIssuePrefillData,
  };

  if (isLoading && (!isAuthenticated || currentView === AuthView.SignIn)) { 
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] text-neutral-200">
        <Loader size="lg" />
        <p className="mt-4 text-neutral-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === AuthView.SignUp) {
      return <SignUpPage onSwitchToSignIn={navigateToSignIn} />;
    }
    return <SignInPage onSwitchToSignUp={navigateToSignUp} />;
  }
  
  const mainAppScreenViews = [
    AuthView.Dashboard, AuthView.MyWork, AuthView.Scan, 
    AuthView.ReportIssue, AuthView.Safety, AuthView.ChatList, AuthView.FloorPlanView
  ];

  const renderLiveStatusMessage = () => {
    let message = '';
    switch (liveStatus) {
      case LiveInteractionStatus.CONNECTING: message = 'Connecting...'; break;
      case LiveInteractionStatus.LISTENING: message = 'Listening...'; break;
      case LiveInteractionStatus.PROCESSING: message = userTranscript ? `You: "${userTranscript}" | AI is thinking...` : 'Processing...'; break;
      case LiveInteractionStatus.SPEAKING: message = aiResponseText ? `AI: ${aiResponseText}`: '...'; break;
      case LiveInteractionStatus.ERROR: message = `Error: ${liveError || 'An unknown error occurred.'}`; break;
      default: return null;
    }
    const bgColor = liveStatus === LiveInteractionStatus.ERROR ? 'bg-red-600' : 'bg-sky-600';
    return (
      <div className={`p-2 text-center text-xs text-white sticky top-[65px] z-[25] transition-all duration-300 ${bgColor}`}>
        {message}
      </div>
    );
  };
  
  const renderLiveInteractionButton = () => {
    let icon;
    let buttonClasses = 'fixed bottom-20 right-5 sm:bottom-24 sm:right-8 z-[60] p-3.5 rounded-full shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D0D0D]';
    let title = '';

    switch (liveStatus) {
      case LiveInteractionStatus.CONNECTING:
      case LiveInteractionStatus.PROCESSING:
        icon = <Loader size="sm" />;
        buttonClasses += ' bg-neutral-500 cursor-wait';
        title = 'Processing...';
        break;
      case LiveInteractionStatus.LISTENING:
        icon = <MicrophoneIcon className="w-6 h-6 text-white" />;
        buttonClasses += ' bg-sky-500 animate-pulse focus:ring-sky-400';
        title = 'Listening... Release to send.';
        break;
      case LiveInteractionStatus.SPEAKING:
        icon = <SpeakerWaveIcon className="w-6 h-6 text-white" />;
        buttonClasses += ' bg-blue-500';
        title = 'AI is speaking...';
        break;
      case LiveInteractionStatus.ERROR:
        icon = <ExclamationTriangleIcon className="w-6 h-6 text-white" />;
        buttonClasses += ' bg-orange-600 focus:ring-orange-400';
        title = `Error: ${liveError}`;
        break;
      case LiveInteractionStatus.IDLE:
      default:
        icon = <MicrophoneIcon className="w-6 h-6 text-white" />;
        buttonClasses += ' bg-red-500 hover:bg-red-600 focus:ring-red-400';
        title = 'Press and hold to talk to AI';
        break;
    }

    return (
      <button
        onMouseDown={startInteraction}
        onMouseUp={stopInteraction}
        onTouchStart={startInteraction}
        onTouchEnd={stopInteraction}
        title={title}
        disabled={liveStatus === LiveInteractionStatus.CONNECTING || liveStatus === LiveInteractionStatus.PROCESSING || liveStatus === LiveInteractionStatus.SPEAKING}
        className={buttonClasses}
      >
        {icon}
      </button>
    );
  };


  const getPageTitle = (view: AuthView): string => {
    switch (view) {
      case AuthView.Dashboard: return t('nav.dashboard');
      case AuthView.MyWork: return t('nav.myWork');
      case AuthView.Scan: return t('nav.lens');
      case AuthView.ReportIssue: return t('nav.raiseIssue');
      case AuthView.Safety: return t('nav.safetyCenter');
      case AuthView.UserProfile: return t('nav.userProfile');
      case AuthView.SavedMachines: return t('nav.savedMachines');
      case AuthView.MachineDetail: return machineDetailNavData ? `${machineDetailNavData.make} ${machineDetailNavData.modelName}` : t('nav.machineDetails');
      case AuthView.WorkOrderDetail: return selectedWorkItem ? t('nav.workOrderDetail', { id: selectedWorkItem.id }) : t('nav.workOrderDetail', { id: '...' });
      case AuthView.WorkOrderCompletion: return selectedWorkItem ? t('nav.completeWorkOrder', { id: selectedWorkItem.id }) : t('nav.completeWorkOrder', { id: '...' });
      case AuthView.PermitDetail: return selectedPermitId ? t('nav.permitDetail', { id: selectedPermitId.substring(0,10) }) : t('nav.permitDetail', { id: '...' });
      case AuthView.ChatList: return t('nav.chats');
      case AuthView.ChatConversation: return selectedChatPartner ? t('nav.conversationWith', { user: selectedChatPartner.username }) : t('nav.conversation');
      case AuthView.FloorPlanView: return t('nav.floorPlan');
      case AuthView.FloorPlanEdit: return t('nav.editFloorPlan');
      default: return "TRIN";
    }
  };
  
  const pageTitle = getPageTitle(currentView);
  const liveStatusMessage = renderLiveStatusMessage();

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      {isAuthenticated && (
        <PageHeader
          title={pageTitle}
          currentUser={currentUser}
          logout={logout}
          onNavigateToProfile={navigateToUserProfile}
          onNavigateToSavedMachinesView={navigateToSavedMachinesView}
          userRememberedMachinesCount={userRememberedMachinesCount}
          onNavigateToFloorPlan={navigateToFloorPlanView}
          onNavigateToChat={navigateToChatListView}
          onNavigateToReportIssue={navigateToReportIssue}
        />
      )}

      {isAuthenticated && liveStatusMessage}

      <div className={`flex-grow ${isAuthenticated && liveStatusMessage ? 'pt-0' : 'pt-0'}`}> 
        {currentView === AuthView.Dashboard && <DashboardPage />}
        {currentView === AuthView.MyWork && <MyWorkPage onNavigateToWorkOrderDetail={navigateToWorkOrderDetail}/>}
        {currentView === AuthView.Scan && <App {...scanViewAppProps} />}
        {currentView === AuthView.ReportIssue && <ReportIssuePage {...reportIssuePageProps} />}
        {currentView === AuthView.Safety && <SafetyPage onNavigateToPermitDetail={navigateToPermitDetail} />}
        {currentView === AuthView.ChatList && currentUser && <ChatListPage currentUser={currentUser} onNavigateToConversation={navigateToChatConversation} />}
        {currentView === AuthView.FloorPlanView && currentUser && <FloorPlanPage currentUser={currentUser} onNavigateToEdit={navigateToFloorPlanEdit} />}
        {currentView === AuthView.FloorPlanEdit && currentUser && <FloorPlanEditPage currentUser={currentUser} onNavigateBack={navigateToFloorPlanView} />}
        {currentView === AuthView.ManualAddMachine && <ManualAddMachinePage {...manualAddMachinePageProps} />}
        
        {currentView === AuthView.UserProfile && (
          <UserProfilePage onNavigateBack={() => handleBottomNav(AuthView.Dashboard)} /> 
        )}
        {currentView === AuthView.SavedMachines && (
          <SavedMachinesPage {...savedMachinesPageProps} />
        )}
        {currentView === AuthView.MachineDetail && machineDetailPageInternalProps && (
          <MachineDetailPage {...machineDetailPageInternalProps} />
        )}
        {currentView === AuthView.WorkOrderDetail && selectedWorkItem && (
          <WorkOrderDetailPage 
            workItem={selectedWorkItem} 
            onNavigateBack={navigateToMyWorkView} 
            onNavigateToCompletion={navigateToWorkOrderCompletion}
            onWorkItemUpdate={handleWorkItemUpdate} 
            onNavigateToReportIssue={navigateToReportIssue}
          />
        )}
        {currentView === AuthView.WorkOrderCompletion && selectedWorkItem && (
          <WorkOrderCompletionPage 
            workItem={selectedWorkItem}
            onNavigateBack={() => navigateToWorkOrderDetail(selectedWorkItem)} 
            onComplete={navigateToMyWorkView} 
          />
        )}
        {currentView === AuthView.PermitDetail && selectedPermitId && currentUser && (
          <PermitDetailPage
            permitId={selectedPermitId}
            userId={currentUser.id}
            onNavigateBack={navigateToSafetyView}
          />
        )}
        {currentView === AuthView.ChatConversation && currentUser && selectedChatPartner && (
          <ChatConversationPage
            currentUser={currentUser}
            chatPartner={selectedChatPartner}
            onNavigateBack={navigateToChatListView}
          />
        )}
      </div>

      {isAuthenticated && isLiveAvailable && mainAppScreenViews.includes(currentView) && renderLiveInteractionButton()}

      {mainAppScreenViews.includes(currentView) && (
         <BottomNavBar currentView={currentView} onNavigate={handleBottomNav} />
      )}
    </div>
  );
};

export default MainWrapper;