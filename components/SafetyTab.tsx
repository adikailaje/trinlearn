
import React from 'react';
import { WorkItem } from '../types';
import { ShieldCheckIcon, ExclamationTriangleIcon } from './Icons'; 

interface SafetyTabProps {
  workItem: WorkItem;
}

const SafetySection: React.FC<{ title: string; items: string[] | undefined; icon: React.ElementType; iconColorClass?: string }> = ({ title, items, icon: Icon, iconColorClass = 'text-red-400' }) => {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <div className="mb-4">
      <h4 className="text-md font-semibold text-neutral-200 mb-1.5 flex items-center">
        <Icon className={`w-5 h-5 mr-2 ${iconColorClass}`} />
        {title}
      </h4>
      <ul className="list-disc list-inside space-y-1 pl-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-neutral-300 bg-[#252525] p-2 rounded-md border border-[#383838]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const SafetyTab: React.FC<SafetyTabProps> = ({ workItem }) => {
  const hasSafetyInfo = 
    (workItem.safetyProcedures && workItem.safetyProcedures.length > 0) ||
    (workItem.hazards && workItem.hazards.length > 0) ||
    (workItem.requiredPPE && workItem.requiredPPE.length > 0);

  if (!hasSafetyInfo) {
    return <p className="text-neutral-500 italic">No specific safety information provided for this work item.</p>;
  }

  return (
    <div className="space-y-4">
      <SafetySection title="Safety Procedures" items={workItem.safetyProcedures} icon={ShieldCheckIcon} iconColorClass="text-green-400"/>
      <SafetySection title="Potential Hazards" items={workItem.hazards} icon={ExclamationTriangleIcon} iconColorClass="text-yellow-400"/>
      <SafetySection title="Required PPE" items={workItem.requiredPPE} icon={ShieldCheckIcon} iconColorClass="text-sky-400"/> 
      {/* DEMO_MARKER: This component uses demo data from myWorkService.ts via WorkOrderDetailPage. */}
    </div>
  );
};

export default SafetyTab;
