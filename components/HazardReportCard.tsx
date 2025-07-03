
import React from 'react';
import { WorkRequest, WorkItemPriority } from '../types';
import { CalendarDaysIcon, UserCircleIcon, BriefcaseIcon } from './Icons';

interface HazardReportCardProps {
  report: WorkRequest;
  highlightOverdue?: boolean;
}

const HazardReportCard: React.FC<HazardReportCardProps> = ({ report, highlightOverdue }) => {

  const isOverdue = highlightOverdue && (new Date().getTime() - new Date(report.createdDate).getTime()) > 24 * 60 * 60 * 1000;

  const getPriorityClasses = (priority: WorkItemPriority): string => {
    switch (priority) {
      case WorkItemPriority.High:
      case 'Critical' as any: // Handle 'Critical' from form
        return 'bg-red-600 text-red-100';
      case WorkItemPriority.Medium:
        return 'bg-yellow-600 text-yellow-100';
      case WorkItemPriority.Low:
        return 'bg-sky-600 text-sky-100';
      default:
        return 'bg-neutral-600 text-neutral-100';
    }
  };

  return (
    <div 
      className={`p-3 bg-[#252525] rounded-lg border shadow-sm transition-all ${
        isOverdue ? 'border-red-500 ring-2 ring-red-500/50' : 'border-[#383838]'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-semibold text-neutral-100 break-words flex-grow">{report.title}</h4>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getPriorityClasses(report.priority)}`}>
          {report.priority}
        </span>
      </div>
      
      {report.description && (
        <p className="text-sm text-neutral-300 mt-1 mb-2 break-words">
          {report.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-2 pt-2 border-t border-neutral-600/50">
        <div className="flex items-center" title="Machine">
          <BriefcaseIcon className="w-3.5 h-3.5 mr-1 text-neutral-500"/>
          <span>{report.machine?.make} {report.machine?.modelName}</span>
        </div>
        <div className="flex items-center" title="Reported by">
          <UserCircleIcon className="w-3.5 h-3.5 mr-1 text-neutral-500"/>
          <span>{report.reportedByUsername || 'Unknown'}</span>
        </div>
        <div className="flex items-center" title={`Reported on ${new Date(report.createdDate).toLocaleString()}`}>
          <CalendarDaysIcon className="w-3.5 h-3.5 mr-1 text-neutral-500"/>
          <span>{new Date(report.createdDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default HazardReportCard;
