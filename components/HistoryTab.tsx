
import React from 'react';
import { AssetMaintenanceActivity } from '../types';
import { DocumentTextIcon, UserCircleIcon, CalendarDaysIcon } from './Icons';

interface HistoryTabProps {
  history: AssetMaintenanceActivity[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-neutral-500 italic">No maintenance history available for this asset.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-neutral-100 mb-2 flex items-center">
        <DocumentTextIcon className="w-5 h-5 mr-2 text-sky-400"/>
        Asset Maintenance History (Last 5)
      </h3>
      <ul className="divide-y divide-[#383838] border border-[#383838] rounded-md">
        {history.slice(0, 5).map((activity) => (
          <li key={activity.id} className="p-3 bg-[#252525] first:rounded-t-md last:rounded-b-md">
            <div className="flex items-center text-xs text-neutral-400 mb-1">
              <CalendarDaysIcon className="w-3.5 h-3.5 mr-1.5 text-sky-500" title="Activity Date"/>
              <span>{new Date(activity.date).toLocaleDateString()}</span>
              {activity.technician && (
                <>
                  <span className="mx-1.5">|</span>
                  <UserCircleIcon className="w-3.5 h-3.5 mr-1 text-sky-500" title="Technician"/>
                  <span>{activity.technician}</span>
                </>
              )}
               {activity.workOrderId && (
                <>
                  <span className="mx-1.5">|</span>
                  <span className="text-neutral-500" title="Work Order ID">WO: {activity.workOrderId}</span>
                </>
              )}
            </div>
            <p className="text-sm text-neutral-200 break-words">{activity.activityDescription}</p>
          </li>
        ))}
      </ul>
      {/* DEMO_MARKER: This component uses demo data from myWorkService.ts via WorkOrderDetailPage. */}
    </div>
  );
};

export default HistoryTab;
