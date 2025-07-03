
import React from 'react';
import { SafetyPermit, SafetyPermitStatus, SafetyPermitType } from '../types';
import { ClipboardDocumentCheckIcon, CalendarDaysIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './Icons'; // Assuming ClipboardDocumentCheckIcon is for permits

interface PermitListItemProps {
  permit: SafetyPermit;
  onClick: () => void;
}

const PermitListItem: React.FC<PermitListItemProps> = ({ permit, onClick }) => {
  const formattedExpiryDate = new Date(permit.expiryDate).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isExpired = new Date(permit.expiryDate) < new Date();
  const requiresAction = permit.status === SafetyPermitStatus.PendingAcknowledgement && !isExpired;

  const getStatusIndicator = () => {
    if (isExpired && permit.status !== SafetyPermitStatus.Closed && permit.status !== SafetyPermitStatus.Cancelled) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-orange-400" title="Expired" />;
    }
    switch (permit.status) {
      case SafetyPermitStatus.Acknowledged:
        return <CheckCircleIcon className="w-4 h-4 text-green-400" title="Acknowledged" />;
      case SafetyPermitStatus.PendingAcknowledgement:
        return <InformationCircleIcon className="w-4 h-4 text-yellow-400" title="Pending Acknowledgement" />;
      case SafetyPermitStatus.Active:
         return <InformationCircleIcon className="w-4 h-4 text-sky-400" title="Active" />; // If active but not pending user ack
      case SafetyPermitStatus.Closed:
      case SafetyPermitStatus.Cancelled:
        return <InformationCircleIcon className="w-4 h-4 text-neutral-500" title={permit.status} />;
      default:
        return null;
    }
  };
  
  const getStatusText = () => {
     if (isExpired && permit.status !== SafetyPermitStatus.Closed && permit.status !== SafetyPermitStatus.Cancelled) return "Expired";
     return permit.status;
  };


  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 sm:p-4 rounded-lg shadow-md flex flex-col sm:flex-row gap-3 transition-all duration-150 ease-in-out border
                  ${requiresAction ? 'bg-yellow-700/20 border-yellow-600 hover:border-yellow-500' : 'bg-[#252525] border-[#383838] hover:border-red-500/70'}
                  group cursor-pointer`}
      aria-label={`View details for permit ${permit.permitNumber}: ${permit.title}`}
    >
      <div className="flex-shrink-0 sm:self-center">
        <ClipboardDocumentCheckIcon className={`w-8 h-8 ${requiresAction ? 'text-yellow-400' : 'text-sky-400'}`} />
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
          <h3 className="text-sm sm:text-md font-semibold text-neutral-100 group-hover:text-red-300 transition-colors truncate" title={permit.title}>
            {permit.title}
          </h3>
          <span className={`mt-1 sm:mt-0 text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1
            ${isExpired ? 'bg-orange-600 text-orange-100' : 
             permit.status === SafetyPermitStatus.Acknowledged ? 'bg-green-600 text-green-100' :
             permit.status === SafetyPermitStatus.PendingAcknowledgement ? 'bg-yellow-600 text-yellow-100' :
             permit.status === SafetyPermitStatus.Active ? 'bg-sky-600 text-sky-100' :
             'bg-neutral-600 text-neutral-100'}`}
          >
            {getStatusIndicator()}
            {getStatusText()}
          </span>
        </div>
        
        <p className="text-xs text-neutral-400 mb-0.5">Permit #: {permit.permitNumber} ({permit.type})</p>
        {permit.assetName && <p className="text-xs text-neutral-400 mb-0.5">Asset: {permit.assetName}</p>}
        
        <div className="flex items-center text-xs text-neutral-500 mt-1.5">
          <CalendarDaysIcon className="w-3.5 h-3.5 mr-1 text-neutral-500" title="Expiry Date"/>
          <span>Expires: {formattedExpiryDate}</span>
          {requiresAction && <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded bg-red-500 text-white animate-pulse">ACTION REQUIRED</span>}
        </div>
      </div>
    </button>
  );
};

export default PermitListItem;
