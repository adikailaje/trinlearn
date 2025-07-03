
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { safetyService } from '../services/safetyService';
import { SafetyPermit, SafetyPermitStatus } from '../types';
import SignatureCanvas, { SignatureCanvasRef } from '../components/SignatureCanvas';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, CalendarDaysIcon, UserCircleIcon, PencilIcon, ShieldCheckIcon } from '../components/Icons';

interface PermitDetailPageProps {
  permitId: string;
  userId: string;
  onNavigateBack: () => void;
}

const PermitDetailPage: React.FC<PermitDetailPageProps> = ({ permitId, userId, onNavigateBack }) => {
  const [permit, setPermit] = useState<SafetyPermit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const signatureCanvasRef = useRef<SignatureCanvasRef>(null);

  const fetchPermitDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const details = await safetyService.getPermitDetails(permitId, userId);
      if (details) {
        setPermit(details);
      } else {
        setError("Permit not found or not assigned to you.");
      }
    } catch (e: any) {
      setError(e.message || "Could not load permit details.");
    } finally {
      setIsLoading(false);
    }
  }, [permitId, userId]);

  useEffect(() => {
    fetchPermitDetails();
  }, [fetchPermitDetails]);

  const handleAcknowledge = async () => {
    if (!permit || !signatureCanvasRef.current) return;

    if (signatureCanvasRef.current.isEmpty()) {
      setError("Signature is required to acknowledge the permit.");
      return;
    }
    const signatureDataUrl = signatureCanvasRef.current.getSignature();
    if (!signatureDataUrl) {
      setError("Failed to capture signature. Please try again.");
      return;
    }

    setIsAcknowledging(true);
    setError(null);
    try {
      const updatedPermit = await safetyService.acknowledgePermit(userId, permit.id, signatureDataUrl);
      setPermit(updatedPermit);
      // Optionally, show a success message or automatically navigate back after a delay
    } catch (e: any) {
      setError(e.message || "Failed to acknowledge permit.");
    } finally {
      setIsAcknowledging(false);
    }
  };
  
  const DetailItem: React.FC<{label: string; value?: string | string[]; Icon?: React.ElementType; valueClassName?: string}> = ({ label, value, Icon, valueClassName }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
      <div className="py-2">
        <dt className="text-xs font-medium text-neutral-500 flex items-center mb-0.5">
          {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />}
          {label}
        </dt>
        {Array.isArray(value) ? (
          <dd className={`text-sm text-neutral-200 ${valueClassName || ''}`}>
            <ul className="list-disc list-inside pl-1 space-y-1">
              {value.map((item, index) => <li key={index} className="whitespace-pre-wrap">{item}</li>)}
            </ul>
          </dd>
        ) : (
          <dd className={`text-sm text-neutral-200 whitespace-pre-wrap ${valueClassName || ''}`}>{value}</dd>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex-grow flex items-center justify-center p-6 bg-[#0D0D0D]"><Loader size="lg" /><p className="ml-3 text-neutral-400">Loading Permit...</p></div>;
  }
  if (error && !permit) { // Show full page error if permit couldn't be loaded at all
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-red-400 bg-[#0D0D0D]">
        <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
        <p className="text-xl">Error Loading Permit</p>
        <p>{error}</p>
        <button onClick={onNavigateBack} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Go Back</button>
      </div>
    );
  }
  if (!permit) { // Should be caught by error, but as a fallback
    return <div className="flex-grow flex items-center justify-center p-6 text-neutral-500 bg-[#0D0D0D]"><p>Permit details not available.</p></div>;
  }

  const isPermitActionable = (permit.status === SafetyPermitStatus.Active || permit.status === SafetyPermitStatus.PendingAcknowledgement) && new Date(permit.expiryDate) > new Date();
  const isAcknowledged = permit.status === SafetyPermitStatus.Acknowledged;
  const isPastInteractable = permit.status === SafetyPermitStatus.Expired || permit.status === SafetyPermitStatus.Closed || permit.status === SafetyPermitStatus.Cancelled || new Date(permit.expiryDate) <= new Date();


  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200 pb-20">
      {/* Header is now handled by PageHeader via MainWrapper */}
      <main className="flex-grow container mx-auto p-4 md:p-6">
         <div className="mb-4 flex items-center justify-start">
            <button
                onClick={onNavigateBack}
                className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50 -ml-2"
                aria-label="Back to Safety Center"
            >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back
            </button>
        </div>
        <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] max-w-3xl mx-auto">
          <div className="mb-4 pb-4 border-b border-[#2C2C2C]">
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-1">{permit.title}</h2>
            <p className="text-sm text-sky-400 font-medium">{permit.type}</p>
          </div>

          <dl className="divide-y divide-[#2C2C2C]">
            <DetailItem label="Status" value={permit.status} Icon={InformationCircleIcon} valueClassName={`font-semibold ${
                isAcknowledged ? 'text-green-400' : isPermitActionable ? (permit.status === SafetyPermitStatus.PendingAcknowledgement ? 'text-yellow-400' : 'text-sky-400') : 'text-neutral-400'
            }`} />
            <DetailItem label="Asset" value={permit.assetName ? `${permit.assetName} (${permit.assetId || 'N/A'})` : 'N/A'} Icon={ShieldCheckIcon} />
            <DetailItem label="Description/Scope" value={permit.description} Icon={InformationCircleIcon} />
            <DetailItem label="Issued Date" value={new Date(permit.issuedDate).toLocaleString()} Icon={CalendarDaysIcon} />
            <DetailItem label="Expiry Date" value={new Date(permit.expiryDate).toLocaleString()} Icon={CalendarDaysIcon} valueClassName={new Date(permit.expiryDate) < new Date() ? 'text-orange-400' : ''}/>
            <DetailItem label="Responsible Person" value={permit.responsiblePerson} Icon={UserCircleIcon} />
            {permit.specificInstructions && <DetailItem label="Specific Instructions" value={permit.specificInstructions} Icon={ExclamationTriangleIcon}/>}
            {permit.detailedProcedures && permit.detailedProcedures.length > 0 && <DetailItem label="Detailed Procedures" value={permit.detailedProcedures} Icon={InformationCircleIcon} />}
          </dl>

          {/* Acknowledgement Section */}
          {isPermitActionable && !isAcknowledged && (
            <div className="mt-6 pt-6 border-t border-[#2C2C2C]">
              <h3 className="text-lg font-semibold text-yellow-300 mb-2 flex items-center">
                <PencilIcon className="w-5 h-5 mr-2" /> Acknowledge Permit
              </h3>
              <p className="text-sm text-neutral-400 mb-3">
                By signing below, you acknowledge that you have read, understood, and agree to comply with all terms, conditions, and safety procedures outlined in this permit.
              </p>
              <SignatureCanvas ref={signatureCanvasRef} width={400} height={150} />
              {error && <p className="text-red-400 text-sm mt-2 mb-1">{error}</p>}
              <button
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
                className="mt-3 w-full flex items-center justify-center px-6 py-2.5 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isAcknowledging ? <Loader size="sm" className="mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                Sign & Acknowledge
              </button>
            </div>
          )}

          {isAcknowledged && (
            <div className="mt-6 pt-6 border-t border-[#2C2C2C]">
              <h3 className="text-lg font-semibold text-green-400 mb-2 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" /> Permit Acknowledged
              </h3>
              {permit.acknowledgedDate && <p className="text-sm text-neutral-400 mb-2">Acknowledged on: {new Date(permit.acknowledgedDate).toLocaleString()}</p>}
              {permit.acknowledgementSignatureDataUrl && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Your Signature:</p>
                  <img src={permit.acknowledgementSignatureDataUrl} alt="Acknowledged Signature" className="border border-neutral-600 rounded-md bg-neutral-700 max-w-xs" />
                </div>
              )}
            </div>
          )}
          
          {isPastInteractable && !isAcknowledged && (
             <div className="mt-6 pt-6 border-t border-[#2C2C2C]">
                 <p className="text-sm text-neutral-500 italic text-center">This permit is {permit.status.toLowerCase()} and can no longer be acknowledged.</p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PermitDetailPage;
