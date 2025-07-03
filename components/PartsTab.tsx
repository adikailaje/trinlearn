
import React from 'react';
import { Part } from '../types';
import { WrenchScrewdriverIcon } from './Icons'; 

interface PartsTabProps {
  parts: Part[];
}

const PartsTab: React.FC<PartsTabProps> = ({ parts }) => {
  if (!parts || parts.length === 0) {
    return <p className="text-neutral-500 italic">No specific parts listed for this work item.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-neutral-100 mb-2 flex items-center">
        <WrenchScrewdriverIcon className="w-5 h-5 mr-2 text-sky-400"/>
        Required Parts
      </h3>
      <ul className="divide-y divide-[#383838] border border-[#383838] rounded-md">
        {parts.map((part) => (
          <li key={part.id} className="p-3 bg-[#252525] first:rounded-t-md last:rounded-b-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-neutral-200">{part.name}</p>
                {part.partNumber && <p className="text-xs text-neutral-400">Part #: {part.partNumber}</p>}
                {part.notes && <p className="text-xs text-neutral-500 italic mt-0.5">Note: {part.notes}</p>}
              </div>
              <p className="text-sm text-neutral-300 whitespace-nowrap">
                Qty: <span className="font-semibold text-red-400">{part.quantityRequired}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      {/* DEMO_MARKER: This component uses demo data from myWorkService.ts via WorkOrderDetailPage. */}
    </div>
  );
};

export default PartsTab;
