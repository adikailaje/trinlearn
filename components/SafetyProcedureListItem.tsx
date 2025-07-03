
import React from 'react';
import { SafetyProcedureDocument } from '../types';
import { BookOpenIcon, CalendarDaysIcon, TagIcon } from './Icons';

interface SafetyProcedureListItemProps {
  procedure: SafetyProcedureDocument;
  onClick: () => void;
}

const SafetyProcedureListItem: React.FC<SafetyProcedureListItemProps> = ({ procedure, onClick }) => {
  const formattedLastReviewedDate = procedure.lastReviewedDate 
    ? new Date(procedure.lastReviewedDate).toLocaleDateString() 
    : 'N/A';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 sm:p-4 rounded-lg shadow-md flex gap-3 items-start transition-all duration-150 ease-in-out bg-[#252525] border border-[#383838] hover:border-red-500/70 group cursor-pointer"
      aria-label={`View details for procedure: ${procedure.title}`}
    >
      <div className="flex-shrink-0 pt-0.5">
        <BookOpenIcon className="w-6 h-6 text-teal-400" />
      </div>

      <div className="flex-grow min-w-0">
        <h3 className="text-sm sm:text-md font-semibold text-neutral-100 group-hover:text-red-300 transition-colors" title={procedure.title}>
          {procedure.title}
        </h3>
        
        <p className="text-xs text-neutral-400 mb-1">
          <TagIcon className="w-3 h-3 mr-1 inline-block text-neutral-500" />
          Category: {procedure.category}
          {procedure.documentNumber && ` | Doc #: ${procedure.documentNumber}`}
          {procedure.version && ` | Ver: ${procedure.version}`}
        </p>
        
        {procedure.summary && (
          <p className="text-xs text-neutral-500 italic truncate mb-1" title={procedure.summary}>
            Summary: {procedure.summary}
          </p>
        )}

        <div className="flex items-center text-xs text-neutral-500 mt-1.5">
          <CalendarDaysIcon className="w-3.5 h-3.5 mr-1 text-neutral-500" title="Last Reviewed Date"/>
          <span>Last Reviewed: {formattedLastReviewedDate}</span>
        </div>
      </div>
    </button>
  );
};

export default SafetyProcedureListItem;
