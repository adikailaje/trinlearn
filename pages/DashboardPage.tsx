

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import { myWorkService } from '../services/myWorkService';
import { authService } from '../services/authService';
import { getPredictiveMaintenanceInsights, getWorkRequestAnalysis } from '../services/geminiService';
import { rememberedMachinesService } from '../services/rememberedMachinesService';
import { DashboardData, SystemAlert, Role, WorkItem, WorkItemStatus, WorkItemPriority, EmployeeDashboardStats, ManagerDashboardStats, OwnerDashboardStats, RoleSpecificDashboardData, User as AppUser, UserMachineData, PredictiveMaintenanceResult, WorkRequestAnalysisResult } from '../types';
import { Loader } from '../components/Loader';
import { BriefcaseIcon, ShieldCheckIcon, ExclamationTriangleIcon, InformationCircleIcon, UserGroupIcon, ChartBarIcon, ListBulletIcon, CalendarDaysIcon, CheckCircleIcon, UserCircleIcon, SparklesIcon, ChevronDownIcon } from '../components/Icons';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import HazardReportFeed from '../components/HazardReportFeed';

const isSameDay = (date1Input: Date | string, date2Input: Date | string): boolean => {
  const date1 = new Date(date1Input);
  const date2 = new Date(date2Input);
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// --- Predictive Maintenance Widget ---
const PredictiveMaintenanceWidget: React.FC = () => {
    const [allMachines, setAllMachines] = useState<(UserMachineData & { userId: string, username: string })[]>([]);
    const [selectedMachineId, setSelectedMachineId] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<PredictiveMaintenanceResult | null>(null);
    const [isLoadingMachines, setIsLoadingMachines] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllMachines = async () => {
            try {
                const machines = await rememberedMachinesService.getAllMachinesForAllUsers();
                setAllMachines(machines);
            } catch (e) {
                console.error("Failed to load all machines for predictive widget:", e);
                setAnalysisError("Could not load machine list.");
            } finally {
                setIsLoadingMachines(false);
            }
        };
        fetchAllMachines();
    }, []);

    const handleAnalyze = async () => {
        if (!selectedMachineId) {
            setAnalysisError("Please select a machine to analyze.");
            return;
        }
        const selectedMachine = allMachines.find(m => `${m.make}-${m.modelName}-${m.userId}` === selectedMachineId);
        if (!selectedMachine || !selectedMachine.workHistory || selectedMachine.workHistory.length === 0) {
            setAnalysisError("Selected machine has no work history to analyze.");
            setAnalysisResult(null);
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisResult(null);
        try {
            const result = await getPredictiveMaintenanceInsights(selectedMachine.workHistory);
            setAnalysisResult(result);
        } catch (e: any) {
            setAnalysisError(e.message || "An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
            <div className="flex items-center text-purple-400 mb-3">
                <SparklesIcon className="w-7 h-7 mr-3" />
                <h2 className="text-xl font-semibold">Predictive Maintenance</h2>
            </div>
            <div className="space-y-3">
                <div className="relative">
                    <label htmlFor="machineSelect" className="text-xs text-neutral-400 mb-1 block">Select Machine to Analyze</label>
                    <select
                        id="machineSelect"
                        value={selectedMachineId}
                        onChange={(e) => setSelectedMachineId(e.target.value)}
                        disabled={isLoadingMachines || isAnalyzing}
                        className="w-full pl-3 pr-10 py-2.5 text-sm rounded-md bg-[#222222] border border-[#333333] text-neutral-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none disabled:opacity-50"
                    >
                        <option value="">-- Select a Machine --</option>
                        {allMachines.map(m => (
                            <option key={`${m.make}-${m.modelName}-${m.userId}`} value={`${m.make}-${m.modelName}-${m.userId}`}>
                                {m.make} {m.modelName} (User: {m.username})
                            </option>
                        ))}
                    </select>
                     <ChevronDownIcon className="w-5 h-5 text-neutral-400 absolute right-3 bottom-3 pointer-events-none"/>
                </div>
                <button onClick={handleAnalyze} disabled={isAnalyzing || !selectedMachineId} className="w-full flex items-center justify-center p-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50">
                    {isAnalyzing ? <><Loader size="sm" className="mr-2"/>Analyzing...</> : 'Analyze History'}
                </button>

                {analysisError && <p className="text-sm text-red-400 p-2 bg-red-900/30 rounded-md">{analysisError}</p>}
                
                {analysisResult && (
                    <div className="mt-4 p-3 bg-purple-900/20 border border-purple-700 rounded-md space-y-2 animate-fadeIn">
                        <h4 className="font-semibold text-purple-300">Analysis Result:</h4>
                        <p className="text-sm"><strong className="text-neutral-400">Predicted Failure:</strong> {analysisResult.component}</p>
                        <p className="text-sm"><strong className="text-neutral-400">Est. Failure Date:</strong> {analysisResult.predicted_failure_date}</p>
                        <p className="text-sm"><strong className="text-neutral-400">Recommendation:</strong> {analysisResult.recommendation}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

// --- Work Request Analysis Widget ---
const WorkRequestAnalysisWidget: React.FC = () => {
    const [allMachines, setAllMachines] = useState<(UserMachineData & { userId: string, username: string })[]>([]);
    const [selectedMachineId, setSelectedMachineId] = useState<string>('');
    const [selectedWorkRequestId, setSelectedWorkRequestId] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<WorkRequestAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllMachinesWithRequests = async () => {
            try {
                const machines = await rememberedMachinesService.getAllMachinesForAllUsers();
                const machinesWithRequests = machines.filter(m => m.workRequests && m.workRequests.length > 0);
                setAllMachines(machinesWithRequests);
            } catch (e) {
                console.error("Failed to load machines for analysis widget:", e);
                setError("Could not load machine list.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllMachinesWithRequests();
    }, []);

    const selectedMachine = allMachines.find(m => `${m.make}-${m.modelName}-${m.userId}` === selectedMachineId);
    const availableWorkRequests = selectedMachine?.workRequests || [];
    const selectedWorkRequest = availableWorkRequests.find(wr => wr.id === selectedWorkRequestId);

    const handleMachineChange = (machineId: string) => {
        setSelectedMachineId(machineId);
        setSelectedWorkRequestId(''); // Reset work request selection
        setAnalysisResult(null);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (!selectedMachine || !selectedWorkRequest) {
            setError("Please select a machine and a work request.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const machineInfo = { make: selectedMachine.make, modelName: selectedMachine.modelName };
            const requestInfo = { title: selectedWorkRequest.title, description: selectedWorkRequest.description };
            const result = await getWorkRequestAnalysis(machineInfo, requestInfo);
            setAnalysisResult(result);
        } catch (e: any) {
            setError(e.message || "An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
            <div className="flex items-center text-teal-400 mb-3">
                <BriefcaseIcon className="w-7 h-7 mr-3" />
                <h2 className="text-xl font-semibold">Work Request Analysis</h2>
            </div>
            <div className="space-y-3">
                {isLoading && <div className="flex items-center text-sm text-neutral-400"><Loader size="sm" className="mr-2"/> Loading machines...</div>}
                {!isLoading && allMachines.length === 0 && <p className="text-sm text-neutral-500 italic">No machines with open work requests found.</p>}
                {!isLoading && allMachines.length > 0 && (
                    <>
                        <div className="relative">
                            <label htmlFor="machineSelectAnalysis" className="text-xs text-neutral-400 mb-1 block">Select Machine with Work Requests</label>
                            <select
                                id="machineSelectAnalysis"
                                value={selectedMachineId}
                                onChange={(e) => handleMachineChange(e.target.value)}
                                disabled={isAnalyzing}
                                className="w-full pl-3 pr-10 py-2.5 text-sm rounded-md bg-[#222222] border border-[#333333] text-neutral-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none disabled:opacity-50"
                            >
                                <option value="">-- Select a Machine --</option>
                                {allMachines.map(m => (
                                    <option key={`${m.make}-${m.modelName}-${m.userId}`} value={`${m.make}-${m.modelName}-${m.userId}`}>
                                        {m.make} {m.modelName} (User: {m.username})
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon className="w-5 h-5 text-neutral-400 absolute right-3 bottom-3 pointer-events-none"/>
                        </div>
                        {selectedMachineId && (
                            <div className="relative">
                                <label htmlFor="workRequestSelect" className="text-xs text-neutral-400 mb-1 block">Select Work Request</label>
                                <select
                                    id="workRequestSelect"
                                    value={selectedWorkRequestId}
                                    onChange={(e) => setSelectedWorkRequestId(e.target.value)}
                                    disabled={isAnalyzing || availableWorkRequests.length === 0}
                                    className="w-full pl-3 pr-10 py-2.5 text-sm rounded-md bg-[#222222] border border-[#333333] text-neutral-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none disabled:opacity-50"
                                >
                                    <option value="">-- Select a Request --</option>
                                    {availableWorkRequests.map(wr => (
                                        <option key={wr.id} value={wr.id}>{wr.title}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="w-5 h-5 text-neutral-400 absolute right-3 bottom-3 pointer-events-none"/>
                            </div>
                        )}
                        <button onClick={handleAnalyze} disabled={isAnalyzing || !selectedWorkRequestId} className="w-full flex items-center justify-center p-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50">
                            {isAnalyzing ? <><Loader size="sm" className="mr-2"/>Analyzing...</> : 'Generate Repair Plan'}
                        </button>
                    </>
                )}

                {error && <p className="text-sm text-red-400 p-2 bg-red-900/30 rounded-md">{error}</p>}
                
                {analysisResult && (
                    <div className="mt-4 p-3 bg-teal-900/20 border border-teal-700 rounded-md space-y-3 animate-fadeIn">
                        <h4 className="font-semibold text-teal-300">AI-Generated Repair Plan:</h4>
                        <div>
                            <p className="text-xs font-bold uppercase text-neutral-400">Likely Cause</p>
                            <p className="text-sm">{analysisResult.likelyCause}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-neutral-400">Suggested Steps</p>
                            <ul className="list-decimal list-inside space-y-1 text-sm pl-2 mt-1">
                                {analysisResult.suggestedSteps.map((step, index) => <li key={index}>{step}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};


const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [generalDashboardData, setGeneralDashboardData] = useState<Omit<DashboardData, 'roleSpecificData'> | null>(null);
  const [roleSpecificData, setRoleSpecificData] = useState<RoleSpecificDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      setError("User not authenticated.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const data = await dashboardService.getDashboardData(currentUser);
      setGeneralDashboardData({
        activeWorkOrdersSummary: data.activeWorkOrdersSummary,
        recentAlerts: data.recentAlerts,
      });
      if (data.roleSpecificData) {
        setRoleSpecificData(data.roleSpecificData);
      }

    } catch (e: any) {
      console.error("Failed to load dashboard data:", e);
      setError(e.message || "Could not load dashboard information.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const formatAlertTimestamp = (timestamp: string): string => {
    const alertDate = new Date(timestamp);
    const today = new Date(); 
    const yesterday = new Date(today); 
    yesterday.setDate(today.getDate() - 1); 
    const timeStringVal = alertDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
    if (isSameDay(alertDate, today)) return `Today, ${timeStringVal}`; 
    if (isSameDay(alertDate, yesterday)) return `Yesterday, ${timeStringVal}`; 
    return `${alertDate.toLocaleDateString()}, ${timeStringVal}`;
  };
  
  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'safety': return <ShieldCheckIcon className="w-5 h-5 text-yellow-400" />;
      case 'equipment': return <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />;
      case 'info': return <InformationCircleIcon className="w-5 h-5 text-sky-400" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-neutral-400" />;
    }
  };

  const renderEmployeeDashboard = (stats: EmployeeDashboardStats) => (
    <>
        {stats.teamReports.length > 0 && <HazardReportFeed title="Recent Team Reports" reports={stats.teamReports} />}
        <section className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
            <div className="flex items-center mb-3">
                <ListBulletIcon className="w-8 h-8 text-red-400"/>
            </div>
            <ProgressBar value={(stats.workItemsDueToday.length + stats.workItemsCompletedToday.length) > 0 ? (stats.workItemsCompletedToday.length / (stats.tasksDueToday + stats.workItemsCompletedToday.length)) * 100 : 0} label={`${stats.tasksCompletedToday} / ${stats.tasksDueToday + stats.workItemsCompletedToday.length} Tasks Completed`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <StatCard title="Tasks Due Today" value={stats.tasksDueToday} icon={CalendarDaysIcon} />
                <StatCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon={CheckCircleIcon} iconColorClass="text-green-400"/>
            </div>
        </section>
    </>
  );

  const renderManagerDashboard = (stats: ManagerDashboardStats) => (
    <>
      {stats.newWorkRequests.length > 0 && <HazardReportFeed title="New Reports from Your Team" reports={stats.newWorkRequests} />}
      <section className="space-y-6">
        <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="w-8 h-8 text-red-400"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Employee Tasks Completed" value={stats.employeeTasksCompletedTodayCount} icon={CheckCircleIcon} iconColorClass="text-green-400"/>
            <StatCard title="Open Employee Tasks" value={stats.employeeOpenTasksCount} icon={BriefcaseIcon} />
             <StatCard title="High Priority Open" value={stats.employeeOpenTasksByPriority.High} icon={ExclamationTriangleIcon} iconColorClass="text-orange-400"/>
          </div>
           {stats.topPerformingEmployees.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-neutral-200 mb-2">Top Performers Today:</h3>
              <ul className="space-y-1.5 text-sm">
                {stats.topPerformingEmployees.map(emp => (
                  <li key={emp.id} className="flex items-center justify-between p-1.5 bg-[#252525] rounded-md border border-[#383838]">
                    <div className="flex items-center">
                      {emp.profilePictureUrl ? <img src={emp.profilePictureUrl} alt={emp.username} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <UserCircleIcon className="w-6 h-6 text-neutral-500 mr-2"/>}
                      <span className="text-neutral-300">{emp.username}</span>
                    </div>
                    <span className="font-semibold text-green-400">{emp.completedCount} tasks</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
           <h3 className="text-md font-semibold text-neutral-200 mb-3">Open Employee Tasks by Priority:</h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-red-700/20 rounded-md"><span className="font-bold text-red-300">{stats.employeeOpenTasksByPriority.High}</span> High</div>
              <div className="p-3 bg-yellow-700/20 rounded-md"><span className="font-bold text-yellow-300">{stats.employeeOpenTasksByPriority.Medium}</span> Medium</div>
              <div className="p-3 bg-sky-700/20 rounded-md"><span className="font-bold text-sky-300">{stats.employeeOpenTasksByPriority.Low}</span> Low</div>
           </div>
        </div>
      </section>
    </>
  );

  const renderOwnerDashboard = (stats: OwnerDashboardStats) => (
     <>
        {stats.allOpenWorkRequests.length > 0 && <HazardReportFeed title="All Open Reports" reports={stats.allOpenWorkRequests} highlightOverdue={true} />}
        <section className="space-y-6">
            <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
                <div className="flex items-center mb-4">
                    <ChartBarIcon className="w-8 h-8 text-red-400"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard title="Total Tasks Completed" value={stats.orgTasksCompletedTodayCount} icon={CheckCircleIcon} iconColorClass="text-green-400"/>
                    <StatCard title="Total Open Tasks" value={stats.orgOpenTasksCount} icon={BriefcaseIcon} />
                    <StatCard title="Open High Priority" value={stats.orgOpenHighPriorityTasksCount} icon={ExclamationTriangleIcon} iconColorClass="text-orange-400"/>
                </div>
            </div>
            <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
                <h3 className="text-md font-semibold text-neutral-200 mb-3">Tasks Completed Today by Role:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard title="Employee Completions" value={stats.tasksCompletedByRole.employee} icon={UserGroupIcon} iconColorClass="text-sky-400"/>
                    <StatCard title="Manager Completions" value={stats.tasksCompletedByRole.manager} icon={UserGroupIcon} iconColorClass="text-teal-400"/>
                </div>
            </div>
        </section>
     </>
  );

  if (isLoading) {
    return <div className="flex-grow flex items-center justify-center p-6 bg-[#0D0D0D]"><Loader size="lg" /><p className="ml-4 text-neutral-400">Loading Dashboard...</p></div>;
  }
  if (error) {
    return <div className="flex-grow flex flex-col items-center justify-center p-6 text-red-400 bg-[#0D0D0D]"><ExclamationTriangleIcon className="w-12 h-12 mb-4" /><p className="text-xl">Error Loading Dashboard</p><p>{error}</p></div>;
  }
  if (!generalDashboardData && !roleSpecificData) {
    return <div className="flex-grow flex items-center justify-center p-6 text-neutral-500 bg-[#0D0D0D]}"><p>No dashboard data available.</p></div>;
  }

  const isManagerOrAdmin = currentUser?.role === Role.Manager || currentUser?.role === Role.Admin || currentUser?.role === Role.SuperAdmin;

  return (
    <div className="flex-grow p-4 md:p-6 space-y-6 bg-[#0D0D0D] text-neutral-200 pb-20">
      {currentUser && (
        <div className="mb-6">
          <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-100 tracking-tight">
            {currentUser.username.toLowerCase() === 'superadmin' ? (
              <>
                Welcome back,
                <br />
                <span className="text-red-400">{currentUser.username}</span>
              </>
            ) : (
              <>
                Welcome back, <span className="text-red-400">{currentUser.username}</span>
              </>
            )}
          </h2>
           <p className="text-sm text-neutral-500 capitalize">{currentUser.role} Dashboard</p>
        </div>
      )}

      {/* Role-Specific Dashboards */}
      {roleSpecificData?.role === Role.User && renderEmployeeDashboard(roleSpecificData.stats as EmployeeDashboardStats)}
      {roleSpecificData?.role === Role.Manager && renderManagerDashboard(roleSpecificData.stats as ManagerDashboardStats)}
      {(roleSpecificData?.role === Role.Admin || roleSpecificData?.role === Role.SuperAdmin) && renderOwnerDashboard(roleSpecificData.stats as OwnerDashboardStats)}
      
      {/* General Alerts - Can be shown to all roles */}
      {generalDashboardData && generalDashboardData.recentAlerts.length > 0 && (
        <section className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] mt-6">
          <div className="flex items-center text-orange-400 mb-3">
            <ExclamationTriangleIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {generalDashboardData.recentAlerts.map(alert => (
              <div key={alert.id} className="text-sm p-2.5 rounded-md bg-[#252525] border border-[#383838]">
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert.type)}
                  <p className="text-neutral-300 leading-tight flex-grow">{alert.message}</p>
                </div>
                <p className="text-xs text-neutral-500 mt-1 text-right">{formatAlertTimestamp(alert.timestamp)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Predictive Maintenance Widget - For Admin/Manager */}
      {isManagerOrAdmin && <PredictiveMaintenanceWidget />}
      
      {/* Work Request Analysis Widget - For Admin/Manager */}
      {isManagerOrAdmin && <WorkRequestAnalysisWidget />}

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;