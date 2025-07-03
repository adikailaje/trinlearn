import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { myWorkService } from '../services/myWorkService';
import { WorkItem, WorkItemPriority } from '../types';
import WorkItemCard from '../components/WorkItemCard';
import { Loader } from '../components/Loader';
import { ExclamationTriangleIcon } from '../components/Icons'; 

interface MyWorkPageProps {
  onNavigateToWorkOrderDetail: (item: WorkItem) => void;
}

const MyWorkPage: React.FC<MyWorkPageProps> = ({ onNavigateToWorkOrderDetail }) => {
  const { currentUser } = useAuth();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkItems = async () => {
      if (!currentUser) {
        setIsLoading(false);
        setError("Please log in to view your work items.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const items = await myWorkService.getWorkItemsForUser(currentUser.id);
        setWorkItems(Array.isArray(items) ? items : []);
      } catch (e: any) {
        console.error("Failed to load work items:", e);
        setError(e.message || "Could not load your work items.");
        setWorkItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkItems();
  }, [currentUser]);

  const sortedWorkItems = useMemo(() => {
    return Array.isArray(workItems) ? [...workItems].sort((a, b) => {
      // Sort by priority first (High > Medium > Low)
      const priorityOrder = { [WorkItemPriority.High]: 1, [WorkItemPriority.Medium]: 2, [WorkItemPriority.Low]: 3 };
      if (priorityOrder[a.priority] < priorityOrder[b.priority]) return -1;
      if (priorityOrder[a.priority] > priorityOrder[b.priority]) return 1;

      // Then sort by due date (earlier due dates first)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }) : [];
  }, [workItems]);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 bg-[#0D0D0D] pb-20">
        <Loader size="lg" />
        <p className="ml-4 text-neutral-400">Loading Your Work Items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-red-400 bg-[#0D0D0D] pb-20">
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <p className="text-xl">Error Loading Work Items</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 md:p-6 space-y-6 bg-[#0D0D0D] text-neutral-200 pb-24"> {/* Increased pb for nav bar */}
      {/* Title is now handled by PageHeader via MainWrapper */}
      
      {sortedWorkItems.length === 0 ? (
        <div className="text-center py-10 bg-[#1A1A1A] rounded-lg shadow-xl border border-[#2C2C2C] p-6">
          
          <ExclamationTriangleIcon className="w-16 h-16 text-neutral-700 mx-auto mb-4" /> 
          <p className="text-neutral-500 text-lg">You have no assigned work items at the moment.</p>
          <p className="text-neutral-600 text-sm mt-2">
            New tasks and inspections will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedWorkItems.map(item => (
            <WorkItemCard 
              key={item.id} 
              item={item} 
              onClick={onNavigateToWorkOrderDetail} // Pass the navigation handler
            />
          ))}
        </div>
      )}
      {/* DEMO_MARKER: This page uses demo data from myWorkService.ts */}
    </div>
  );
};

export default MyWorkPage;
