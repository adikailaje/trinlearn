

import React, { useState, useRef } from 'react';
import { WorkItem, WorkItemStatus } from '../types';
import { myWorkService } from '../services/myWorkService';
import { useAuth } from '../hooks/useAuth';
import SignatureCanvas, { SignatureCanvasRef } from '../components/SignatureCanvas';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, CheckCircleIcon, PencilIcon } from '../components/Icons';

interface WorkOrderCompletionPageProps {
  workItem: WorkItem;
  onNavigateBack: () => void; 
  onComplete: () => void; 
}

const WorkOrderCompletionPage: React.FC<WorkOrderCompletionPageProps> = ({ workItem, onNavigateBack, onComplete }) => {
  const { currentUser } = useAuth();
  const [completionNotes, setCompletionNotes] = useState(workItem.completionNotes || '');
  const signatureCanvasRef = useRef<SignatureCanvasRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitCompletion = async () => {
    if (!currentUser) {
      setError("User not authenticated.");
      return;
    }
    const signatureDataUrl = signatureCanvasRef.current?.getSignature();
    if (signatureCanvasRef.current?.isEmpty()) { // Check if canvas is empty
      setError("Signature is required to complete the work order.");
      return;
    }
    if (!signatureDataUrl) { // Fallback, should be covered by isEmpty
      setError("Failed to capture signature. Please try again.");
      return;
    }


    setIsLoading(true);
    setError(null);
    try {
      const updatedItem = await myWorkService.completeWorkItem(currentUser.id, workItem.id, completionNotes, signatureDataUrl);
      if (updatedItem && updatedItem.status === WorkItemStatus.Completed) {
        onComplete(); 
      } else {
        setError("Failed to complete work order. Item may not have been updated correctly.");
      }
    } catch (e: any) {
      setError(e.message || "Could not submit completion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200 pb-20">
      {/* Header is now handled by PageHeader via MainWrapper */}
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-start">
            <button
                onClick={onNavigateBack}
                className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50 -ml-2"
                aria-label="Back to Work Order Details"
            >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Details
            </button>
        </div>
        <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-2">{workItem.title}</h2>
          <p className="text-sm text-neutral-400 mb-6">Asset: {workItem.assetName || 'N/A'} {workItem.assetId && `(${workItem.assetId})`}</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="completionNotes" className="block text-sm font-medium text-neutral-300 mb-1">
                Completion Notes
              </label>
              <textarea
                id="completionNotes"
                rows={4}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Enter any notes about the work performed, issues encountered, or follow-up actions..."
                className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Digital Signature <span className="text-red-500">*</span>
              </label>
              <SignatureCanvas ref={signatureCanvasRef} width={400} height={150} />
            </div>

            {error && (
              <div className="p-3 bg-red-700/20 border border-red-600 rounded-md text-red-300">
                Error: {error}
              </div>
            )}

            <button
              onClick={handleSubmitCompletion}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader size="sm" className="mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
              Submit Completion
            </button>
          </div>
        </div>
         {/* DEMO_MARKER: This component uses demo data from myWorkService.ts via WorkOrderDetailPage. */}
      </main>
    </div>
  );
};

export default WorkOrderCompletionPage;
