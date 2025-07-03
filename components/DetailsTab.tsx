

import React from 'react';
import { WorkItem } from '../types';
import { CalendarDaysIcon, MapPinIcon, TagIcon, InformationCircleIcon } from './Icons';

interface DetailsTabProps {
  workItem: WorkItem;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ workItem }) => {
  const formattedDueDate = new Date(workItem.dueDate).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="space-y-4 text-neutral-300">
      <div>
        <h3 className="text-lg font-semibold text-neutral-100 mb-2">Full Description</h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap bg-[#252525] p-3 rounded-md border border-[#383838]">
          {workItem.description || 'No detailed description provided.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-md font-medium text-neutral-200 mb-1 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2 text-sky-400" title="Location"/>
            Location
          </h4>
          <p className="text-sm p-2 bg-[#252525] rounded border border-[#383838]">{workItem.location || 'N/A'}</p>
        </div>
        <div>
          <h4 className="text-md font-medium text-neutral-200 mb-1 flex items-center">
            <TagIcon className="w-5 h-5 mr-2 text-sky-400" title="Asset"/>
            Asset
          </h4>
          <p className="text-sm p-2 bg-[#252525] rounded border border-[#383838]">
            {workItem.assetName || 'N/A'} {workItem.assetId && `(${workItem.assetId})`}
          </p>
        </div>
         <div>
          <h4 className="text-md font-medium text-neutral-200 mb-1 flex items-center">
            <CalendarDaysIcon className="w-5 h-5 mr-2 text-sky-400" title="Due Date"/>
            Due Date
          </h4>
          <p className="text-sm p-2 bg-[#252525] rounded border border-[#383838]">{formattedDueDate}</p>
        </div>
         <div>
          <h4 className="text-md font-medium text-neutral-200 mb-1 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-sky-400" title="Priority"/>
            Priority
          </h4>
          <p className={`text-sm p-2 bg-[#252525] rounded border border-[#383838] font-semibold ${
            workItem.priority === 'High' ? 'text-red-400' : 
            workItem.priority === 'Medium' ? 'text-yellow-400' : 'text-sky-400'
          }`}>{workItem.priority}</p>
        </div>
      </div>
       {/* DEMO_MARKER: This component uses demo data from myWorkService.ts via WorkOrderDetailPage. */}
    </div>
  );
};

export default DetailsTab;
