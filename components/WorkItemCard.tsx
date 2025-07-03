
import React from 'react';
import { WorkItem, WorkItemPriority, WorkItemType, WorkItemStatus } from '../types';
import { BriefcaseIcon, CalendarDaysIcon, CheckCircleIcon, InformationCircleIcon } from './Icons'; 

interface WorkItemCardProps {
  item: WorkItem;
  onClick?: (item: WorkItem) => void; 
}

export const WorkItemCard: React.FC<WorkItemCardProps> = ({ item, onClick }) => {
  const getPriorityClasses = (priority: WorkItemPriority): string => {
    switch (priority) {
      case WorkItemPriority.High:
        return 'bg-red-600 text-red-100 border-red-500';
      case WorkItemPriority.Medium:
        return 'bg-yellow-600 text-yellow-100 border-yellow-500';
      case WorkItemPriority.Low:
        return 'bg-sky-600 text-sky-100 border-sky-500';
      default:
        return 'bg-neutral-600 text-neutral-100 border-neutral-500';
    }
  };

  const getIconForItemType = (type: WorkItemType) => {
    switch (type) {
      case WorkItemType.WorkOrder:
        return <BriefcaseIcon className="w-5 h-5 mr-2 text-sky-400" title="Work Order"/>;
      case WorkItemType.Inspection:
        return <InformationCircleIcon className="w-5 h-5 mr-2 text-teal-400" title="Inspection"/>; 
      default:
        return <BriefcaseIcon className="w-5 h-5 mr-2 text-neutral-400" title="Task"/>;
    }
  };

  const formattedDueDate = new Date(item.dueDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  // Corrected isOverdue logic
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today for accurate date-only comparison
  const dueDate = new Date(item.dueDate);
  dueDate.setHours(0,0,0,0); // Also set to start of day

  const isOverdue = dueDate < today && item.status !== WorkItemStatus.Completed;


  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(item) : undefined}
      disabled={!onClick}
      className={`w-full text-left bg-[#202020] p-4 rounded-lg shadow-lg border border-[#333333] transition-all duration-150 ease-in-out group
                  ${onClick ? 'hover:border-red-500/80 hover:shadow-xl hover:ring-1 hover:ring-red-500/50 cursor-pointer' : 'cursor-default'}
                  `} 
                  // Removed overdue border: ${isOverdue ? 'border-l-4 border-l-orange-500' : ''}
      aria-label={`View details for ${item.title}`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
        <div className="flex items-center min-w-0">
          {getIconForItemType(item.type)}
          <h3 className="text-md font-semibold text-neutral-100 truncate" title={item.title}>
            {item.title}
          </h3>
        </div>
        <span 
          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getPriorityClasses(item.priority)} flex-shrink-0`}
        >
          {item.priority}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center text-neutral-400">
          <span className="font-semibold text-neutral-500 w-24 inline-block flex-shrink-0">ID:</span>
          <span className="truncate">{item.id}</span>
        </div>
        {item.assetName && (
          <div className="flex items-center text-neutral-400">
            <span className="font-semibold text-neutral-500 w-24 inline-block flex-shrink-0">Asset:</span>
            <span className="truncate">{item.assetName} {item.assetId && `(${item.assetId})`}</span>
          </div>
        )}
        <div className="flex items-center text-neutral-400">
          <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-neutral-500 flex-shrink-0" title="Due Date"/>
          <span className="font-semibold text-neutral-500 w-[88px] inline-block flex-shrink-0">Due Date:</span> 
          {/* Changed text color for overdue items to orange */}
          <span className={`${isOverdue ? 'text-orange-400 font-semibold' : ''}`}>{formattedDueDate} {isOverdue && '(Overdue)'}</span>
        </div>
         {item.status === WorkItemStatus.Completed && (
          <div className="flex items-center text-green-400">
            <CheckCircleIcon className="w-4 h-4 mr-1.5 flex-shrink-0" title="Completed"/>
            <span className="font-semibold">Status:</span>
            <span className="ml-1">Completed</span>
          </div>
        )}
        {item.status !== WorkItemStatus.Completed && (
             <div className="flex items-center text-neutral-400">
                <span className="font-semibold text-neutral-500 w-24 inline-block flex-shrink-0">Status:</span>
                <span>{item.status}</span>
            </div>
        )}
        {item.description && item.type === WorkItemType.WorkOrder && ( 
            <p className="text-xs text-neutral-500 pt-1 italic truncate" title={item.description}>
                Note: {item.description}
            </p>
        )}
      </div>
      {/* DEMO_MARKER: This component is for demo purposes for the My Work section. */}
    </button>
  );
};

export default WorkItemCard;
