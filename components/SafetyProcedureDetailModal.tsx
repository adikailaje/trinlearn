
import React from 'react';
import { SafetyProcedureDocument } from '../types';
import { BookOpenIcon, InformationCircleIcon } from './Icons'; // Assuming BookOpenIcon is available

interface SafetyProcedureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: SafetyProcedureDocument | null;
}

const SafetyProcedureDetailModal: React.FC<SafetyProcedureDetailModalProps> = ({
  isOpen,
  onClose,
  procedure
}) => {
  if (!isOpen || !procedure) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
        onClick={onClose} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="procedureModalTitle"
    >
      <div 
        className="bg-[#1A1A1A] p-5 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-2xl text-neutral-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-[#2C2C2C]">
            <div className="flex items-center">
                <BookOpenIcon className="w-6 h-6 mr-2.5 text-teal-400 flex-shrink-0" />
                <h3 id="procedureModalTitle" className="text-lg sm:text-xl font-semibold text-neutral-100 leading-tight">
                {procedure.title}
                </h3>
            </div>
            <button
                onClick={onClose}
                className="p-1 text-neutral-500 hover:text-neutral-200 transition-colors rounded-full hover:bg-neutral-700/50 -mt-1 -mr-1"
                aria-label="Close procedure details"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
               </svg>
            </button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-3 text-sm">
            {procedure.documentNumber && <p className="text-xs text-neutral-500">Document #: {procedure.documentNumber}</p>}
            <p className="text-xs text-neutral-400">Category: <span className="font-medium text-neutral-300">{procedure.category}</span></p>
            {procedure.version && <p className="text-xs text-neutral-400">Version: <span className="font-medium text-neutral-300">{procedure.version}</span></p>}
            {procedure.lastReviewedDate && <p className="text-xs text-neutral-400">Last Reviewed: <span className="font-medium text-neutral-300">{new Date(procedure.lastReviewedDate).toLocaleDateString()}</span></p>}
            

            {procedure.content ? (
                <div className="mt-3 prose prose-sm prose-invert max-w-none prose-headings:text-neutral-100 prose-p:text-neutral-300 prose-ul:text-neutral-300 prose-li:text-neutral-300 prose-strong:text-neutral-200 whitespace-pre-wrap">
                    <div dangerouslySetInnerHTML={{ __html: procedure.content.replace(/### (.*)/g, '<h3 class="text-md font-semibold text-neutral-100 mt-2 mb-1">$1</h3>').replace(/(\r\n|\n|\r)/gm, "<br />") }} />
                </div>
            ) : procedure.summary ? (
                 <div className="mt-3">
                    <h4 className="text-md font-semibold text-neutral-100 mb-1 flex items-center"><InformationCircleIcon className="w-4 h-4 mr-1.5 text-sky-400"/>Summary</h4>
                    <p className="text-neutral-300 whitespace-pre-wrap">{procedure.summary}</p>
                </div>
            ) : (
                <p className="text-neutral-500 italic mt-4">No detailed content or summary available for inline view.</p>
            )}
        </div>

        <div className="mt-5 pt-4 border-t border-[#2C2C2C] flex justify-end">
            <button
            onClick={onClose}
            className="px-5 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A]"
            >
            Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyProcedureDetailModal;

