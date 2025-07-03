
import React from 'react';
import { MaintenanceRecord, CmmsSyncStatus } from '../types';
import { CalendarDaysIcon, WrenchScrewdriverIcon, PencilIcon, TrashIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from './Icons'; // Assuming WrenchScrewdriverIcon is added to Icons.tsx
import { Loader } from './Loader';

interface MaintenanceRecordItemProps {
  record: MaintenanceRecord;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (recordId: string) => void;
  onSync: (recordId: string) => Promise<void>;
  isSyncing: boolean;
}

export const MaintenanceRecordItem: React.FC<MaintenanceRecordItemProps> = ({ record, onEdit, onDelete, onSync, isSyncing }) => {
  const formattedServiceDate = new Date(record.serviceDate).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const getSyncStatusIndicator = () => {
    switch (record.cmmsSyncStatus) {
      case CmmsSyncStatus.Synced:
        return <CheckCircleIcon className="w-4 h-4 text-green-400" title="Synced with CMMS"/>;
      case CmmsSyncStatus.Pending:
        return <ArrowPathIcon className="w-4 h-4 text-yellow-400 animate-spin" title="Sync Pending"/>;
      case CmmsSyncStatus.Failed:
        return <ExclamationCircleIcon className="w-4 h-4 text-red-400" title="Sync Failed"/>;
      case CmmsSyncStatus.NotSynced:
      default:
        return <CloudArrowUpIcon className="w-4 h-4 text-neutral-500" title="Not Synced"/>;
    }
  };

  const syncButtonText = () => {
    if (record.cmmsSyncStatus === CmmsSyncStatus.Synced) return "Synced";
    if (record.cmmsSyncStatus === CmmsSyncStatus.Pending) return "Syncing...";
    // If actively syncing (button for this item was clicked) and it's not yet Synced or Pending (already handled)
    if (isSyncing) return "Processing..."; 
    // Default state for NotSynced or Failed, and not currently being processed by a click on this item
    return "Sync to CMMS";
  };
  
  const syncButtonDisabled = isSyncing || record.cmmsSyncStatus === CmmsSyncStatus.Pending || record.cmmsSyncStatus === CmmsSyncStatus.Synced;


  return (
    <div className="bg-[#252525] p-4 rounded-lg border border-[#383838] shadow-md hover:border-red-500/50 transition-colors group">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
        <div className="flex-grow">
          <div className="flex items-center text-sm text-neutral-400 mb-1">
            <CalendarDaysIcon className="w-4 h-4 mr-2 text-sky-400" title="Service Date"/>
            <span>Service Date: {formattedServiceDate}</span>
          </div>
          <h4 className="text-md font-semibold text-neutral-100 mb-1 break-words">Issue: {record.issueDescription}</h4>
          {record.repairActions && <p className="text-sm text-neutral-300 mb-1 break-words">Repairs: {record.repairActions}</p>}
          {record.partsUsed && <p className="text-xs text-neutral-400 italic mb-1">Parts: {record.partsUsed}</p>}
          {record.technician && <p className="text-xs text-neutral-400">Technician: {record.technician}</p>}
        </div>

        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 sm:mt-0">
          <div className="flex items-center gap-1 text-xs text-neutral-400 mr-2" title={`CMMS Status: ${record.cmmsSyncStatus}`}>
            {getSyncStatusIndicator()}
             <span className="hidden sm:inline">{record.cmmsSyncStatus.charAt(0).toUpperCase() + record.cmmsSyncStatus.slice(1)}</span>
          </div>
          <button
            onClick={() => onSync(record.id)}
            disabled={syncButtonDisabled}
            className="flex items-center justify-center text-xs px-2.5 py-1.5 rounded-md bg-sky-700 hover:bg-sky-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={record.cmmsSyncStatus === CmmsSyncStatus.Synced ? "Already synced" : "Sync this record to CMMS"}
          >
            {(isSyncing && record.cmmsSyncStatus !== CmmsSyncStatus.Synced) || record.cmmsSyncStatus === CmmsSyncStatus.Pending ? <Loader size="sm" className="w-3 h-3 mr-1.5" /> : null}
            {syncButtonText()}
          </button>
          <button
            onClick={() => onEdit(record)}
            disabled={isSyncing}
            className="text-xs px-2.5 py-1.5 rounded-md bg-neutral-600 hover:bg-neutral-500 text-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Edit Record"
          >
            <PencilIcon className="w-3.5 h-3.5 mr-1 sm:mr-0" title="Edit Record"/> <span className="sm:hidden ml-1">Edit</span>
          </button>
          <button
            onClick={() => onDelete(record.id)}
            disabled={isSyncing}
            className="text-xs px-2.5 py-1.5 rounded-md bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Delete Record"
          >
            <TrashIcon className="w-3.5 h-3.5 mr-1 sm:mr-0" title="Delete Record"/> <span className="sm:hidden ml-1">Delete</span>
          </button>
        </div>
      </div>
        {record.cmmsRecordId && (
            <p className="text-xs text-neutral-500 mt-1.5 pt-1.5 border-t border-[#383838]/50">CMMS ID: {record.cmmsRecordId}</p>
        )}
    </div>
  );
};

export default MaintenanceRecordItem;
