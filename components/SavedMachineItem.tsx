
import React from 'react';
import { UserMachineData } from '../types';
import { SparklesIcon, TrashIcon, ChevronRightIcon, CameraIcon } from './Icons'; // Using SparklesIcon for consistency, CameraIcon for placeholder

interface SavedMachineItemProps {
  machine: UserMachineData;
  onRemove: () => void;
  onClick: () => void;
}

export const SavedMachineItem: React.FC<SavedMachineItemProps> = ({ machine, onRemove, onClick }) => {
  const formattedTimestamp = machine.lastUpdated 
    ? new Date(machine.lastUpdated).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
      new Date(machine.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to the parent
    onRemove();
  };

  const displayDescription = machine.userDisplayDescription || `Make: ${machine.make}, Model: ${machine.modelName}${machine.machineNumber ? ', Identifier: ' + machine.machineNumber : ''}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg shadow-lg flex flex-col sm:flex-row gap-4 transition-all duration-150 ease-in-out bg-[#202020] border border-[#333333] hover:border-red-500/80 hover:shadow-xl hover:ring-1 hover:ring-red-500/50 group cursor-pointer"
      aria-label={`View details for ${machine.make} ${machine.modelName}`}
    >
      <div className="flex-shrink-0 text-center sm:text-left">
        {machine.frameDataUrl ? (
          <img 
            src={machine.frameDataUrl} 
            alt={`Captured frame of ${machine.make} ${machine.modelName}`}
            className="w-28 h-28 object-cover rounded-md border border-[#404040] shadow-sm mx-auto sm:mx-0"
          />
        ) : (
          <div className="w-28 h-28 bg-[#2d2d2d] rounded-md border border-[#404040] flex items-center justify-center mx-auto sm:mx-0">
            <CameraIcon className="w-12 h-12 text-neutral-600" />
          </div>
        )}
        <p className="text-xs text-neutral-500 mt-1.5">Last Updated: {formattedTimestamp}</p>
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-red-400 flex-shrink-0" />
            <p className="text-sm font-bold truncate text-neutral-100">
              {machine.make} - {machine.modelName}
            </p>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-neutral-500 group-hover:text-red-400 transition-colors" />
        </div>
        
        <p className="text-sm text-neutral-200 whitespace-pre-wrap break-words">
          {displayDescription}
        </p>

        {machine.machineNumber && (
            <p className="text-xs text-neutral-400 mt-1">
                <span className="font-semibold text-neutral-500">Current Identifier:</span> {machine.machineNumber}
            </p>
        )}
        {!machine.machineNumber && (
             <p className="text-xs text-neutral-500 mt-1 italic">No identifier saved.</p>
        )}
      </div>

      <div className="flex-shrink-0 flex flex-col items-center sm:items-end justify-start pt-1 sm:pt-0">
        <button
          onClick={handleRemoveClick}
          className="text-neutral-500 hover:text-red-400 p-1.5 rounded-full hover:bg-neutral-700/50 transition-colors"
          title={`Remove ${machine.make} ${machine.modelName}`}
          aria-label={`Remove ${machine.make} ${machine.modelName}`}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </button>
  );
};
