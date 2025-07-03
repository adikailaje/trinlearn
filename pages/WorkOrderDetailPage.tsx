

import React, { useState, useEffect, useCallback } from 'react';
import { WorkItem, WorkItemStatus, Task, ReportIssuePageProps } from '../types';
import { myWorkService } from '../services/myWorkService';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, CheckCircleIcon, InformationCircleIcon, WrenchScrewdriverIcon, ShieldCheckIcon, DocumentTextIcon, PlayIcon, PauseIcon, ListBulletIcon, LockClosedIcon } from '../components/Icons';
import DetailsTab from '../components/DetailsTab';
import TasksTab from '../components/TasksTab';
import PartsTab from '../components/PartsTab';
import SafetyTab from '../components/SafetyTab';
import HistoryTab from '../components/HistoryTab';

interface WorkOrderDetailPageProps {
  workItem: WorkItem;
  onNavigateBack: () => void;
  onNavigateToCompletion: (item: WorkItem) => void;
  onWorkItemUpdate: (updatedItem: WorkItem) => void; 
  onNavigateToReportIssue?: (prefillData?: ReportIssuePageProps['prefillData']) => void; // Added this line
}

const WorkOrderDetailPage: React.FC<WorkOrderDetailPageProps> = ({ 
    workItem: initialWorkItem, 
    onNavigateBack, 
    onNavigateToCompletion,
    onWorkItemUpdate,
    onNavigateToReportIssue // Consumed here, though not directly used in this component's logic, it's passed down
}) => {
  const { currentUser } = useAuth();
  const [workItem, setWorkItem] = useState<WorkItem>(initialWorkItem);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'parts' | 'safety' | 'history'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWorkItem(initialWorkItem);
    setError(null); 
  }, [initialWorkItem]);

  const handleStartWork = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const updatedItem = await myWorkService.startWorkItem(currentUser.id, workItem.id);
      if (updatedItem) {
        setWorkItem(updatedItem);
        onWorkItemUpdate(updatedItem);
      } else {
        setError("Failed to start work item: Not found or an error occurred.");
      }
    } catch (e: any) {
      setError(e.message || "Could not start work.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseResumeWork = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    const shouldPause = workItem.status === WorkItemStatus.InProgress;
    try {
      const updatedItem = await myWorkService.pauseWorkItem(currentUser.id, workItem.id, shouldPause);
      if (updatedItem) {
        setWorkItem(updatedItem);
        onWorkItemUpdate(updatedItem);
      } else {
        setError("Failed to update work status: Not found or an error occurred.");
      }
    } catch (e: any) {
      setError(e.message || "Could not update work status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!currentUser || workItem.status === WorkItemStatus.Completed) return; 
    
    const originalTasks = workItem.tasks ? [...workItem.tasks.map(t => ({...t}))] : []; // Deep copy for rollback
    
    const updatedTasksOptimistic = workItem.tasks?.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ) || [];
    setWorkItem(prev => ({ ...prev, tasks: updatedTasksOptimistic }));

    try {
      const updatedItem = await myWorkService.updateTaskStatus(currentUser.id, workItem.id, taskId, completed);
      if (updatedItem) {
        setWorkItem(updatedItem); 
        onWorkItemUpdate(updatedItem);
      } else {
        setWorkItem(prev => ({ ...prev, tasks: originalTasks }));
        setError("Failed to update task: Not found or an error occurred.");
      }
    } catch (e: any) {
      setWorkItem(prev => ({ ...prev, tasks: originalTasks }));
      setError(e.message || "Could not update task status.");
    }
  };

  const allTasksCompleted = workItem.tasks ? workItem.tasks.every(task => task.completed) : true;

  const renderWorkButtons = () => {
    if (workItem.status === WorkItemStatus.Completed) {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-700/20 border border-green-600 rounded-md text-green-300">
          <CheckCircleIcon className="w-5 h-5" />
          <span>Work Order Completed on {workItem.completionTime ? new Date(workItem.completionTime).toLocaleDateString() : ''}</span>
        </div>
      );
    }

    if (workItem.status === WorkItemStatus.Open) {
      return (
        <button
          onClick={handleStartWork}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader size="sm" className="mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
          Start Work
        </button>
      );
    }

    if (workItem.status === WorkItemStatus.InProgress || workItem.status === WorkItemStatus.Paused) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handlePauseResumeWork}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-3 rounded-md font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {isLoading && (workItem.status === WorkItemStatus.InProgress || workItem.status === WorkItemStatus.Paused) ? <Loader size="sm" className="mr-2" /> : 
             (workItem.status === WorkItemStatus.Paused ? <PlayIcon className="w-5 h-5 mr-2"/> : <PauseIcon className="w-5 h-5 mr-2" />)
            }
            {workItem.status === WorkItemStatus.Paused ? 'Resume Work' : 'Pause Work'}
          </button>
          <button
            onClick={() => onNavigateToCompletion(workItem)}
            disabled={isLoading || !allTasksCompleted}
            className="flex items-center justify-center px-4 py-3 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            title={!allTasksCompleted ? "All tasks must be completed first" : "Complete Work Order"}
          >
            {isLoading ? <Loader size="sm" className="mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
            Complete Work
          </button>
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { name: 'Details', id: 'details', icon: InformationCircleIcon },
    { name: 'Tasks', id: 'tasks', icon: ListBulletIcon },
    { name: 'Parts', id: 'parts', icon: WrenchScrewdriverIcon },
    { name: 'Safety', id: 'safety', icon: ShieldCheckIcon },
    { name: 'History', id: 'history', icon: DocumentTextIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200 pb-20">
      {/* Header is now handled by PageHeader via MainWrapper */}
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-6">
         <div className="mb-4 flex items-center justify-start">
            <button
                onClick={onNavigateBack}
                className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50 -ml-2"
                aria-label="Back to My Work"
            >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back
            </button>
        </div>
        <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-1">{workItem.title}</h2>
          <p className="text-sm text-neutral-400 mb-4">Asset: {workItem.assetName || 'N/A'} {workItem.assetId && `(${workItem.assetId})`}</p>

          <div className="mb-6">{renderWorkButtons()}</div>
           {!allTasksCompleted && workItem.status !== WorkItemStatus.Open && workItem.status !== WorkItemStatus.Completed && (
             <p className="text-xs text-yellow-400 mb-4 flex items-center gap-1.5"><LockClosedIcon className="w-3.5 h-3.5"/> Please complete all tasks before marking work order as complete.</p>
           )}

          {error && (
            <div className="mb-4 p-3 bg-red-700/20 border border-red-600 rounded-md text-red-300">
              Error: {error}
            </div>
          )}

          <div className="border-b border-[#333333] mb-4">
            <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap flex items-center py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-red-500 text-red-400'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'
                    }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 ${activeTab === tab.id ? 'text-red-500' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-4 min-h-[200px]"> {/* Added min-height to prevent content jump */}
            {activeTab === 'details' && <DetailsTab workItem={workItem} />}
            {activeTab === 'tasks' && <TasksTab tasks={workItem.tasks || []} onTaskToggle={handleTaskToggle} disabled={workItem.status === WorkItemStatus.Completed} />}
            {activeTab === 'parts' && <PartsTab parts={workItem.parts || []} />}
            {activeTab === 'safety' && <SafetyTab workItem={workItem} />}
            {activeTab === 'history' && <HistoryTab history={workItem.assetHistory || []} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkOrderDetailPage;
