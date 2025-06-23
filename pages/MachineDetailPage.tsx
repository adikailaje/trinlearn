import React, { useState, useEffect, useCallback } from 'react';
import { MachineDetailData, User } from '../types';
import { generateDescriptionFromFrame } from '../services/geminiService';
import { PROMPT_MACHINE_NUMBER } from '../constants';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, MagnifyingGlassIcon, CheckCircleIcon, PencilIcon, SparklesIcon, InformationCircleIcon } from '../components/Icons';
import { useAuth } from '../hooks/useAuth'; // To get currentUser for potential future use (e.g. saving to user's profile)

interface MachineDetailPageProps {
  machineData: MachineDetailData;
  onNavigateBack: () => void;
}

const MachineDetailPage: React.FC<MachineDetailPageProps> = ({ machineData, onNavigateBack }) => {
  const { currentUser } = useAuth(); // For potential future personalized actions
  const [editableMachineNumber, setEditableMachineNumber] = useState<string>(machineData.machineNumber || '');
  const [isDetectingNumber, setIsDetectingNumber] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showFullOriginalOutput, setShowFullOriginalOutput] = useState<boolean>(false);


  useEffect(() => {
    setEditableMachineNumber(machineData.machineNumber || '');
  }, [machineData.machineNumber]);

  const getBase64FromDataUrl = (dataUrl: string): string => {
    return dataUrl.substring(dataUrl.indexOf(',') + 1);
  };

  const handleDetectNumber = async () => {
    setIsDetectingNumber(true);
    setDetectionError(null);
    setSaveStatus('idle');
    try {
      const base64ImageData = getBase64FromDataUrl(machineData.frameDataUrl);
      const result = await generateDescriptionFromFrame(base64ImageData, PROMPT_MACHINE_NUMBER);
      
      if (result && result.toLowerCase() !== 'no number visible' && !result.toLowerCase().includes('error')) {
        // Clean up potential markdown fences if Gemini wraps output
        let detectedNumber = result.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = detectedNumber.match(fenceRegex);
        if (match && match[2]) {
            detectedNumber = match[2].trim();
        }
        setEditableMachineNumber(detectedNumber);
      } else if (result.toLowerCase() === 'no number visible') {
        setDetectionError("AI could not find a visible number. You can enter it manually.");
      } else {
        setEditableMachineNumber(''); // Clear if previous detection failed or was unsure
        setDetectionError(result || "AI could not determine a number. Please try again or enter manually.");
      }
    } catch (error: any) {
      console.error("Error detecting machine number:", error);
      setDetectionError(error.message || "Failed to detect number from image. Check console for details.");
    } finally {
      setIsDetectingNumber(false);
    }
  };
  
  const handleSaveNumber = async () => {
    if (!currentUser) {
      setSaveStatus('error');
      setDetectionError("You must be logged in to save changes."); // Using detectionError state for general messages here
      return;
    }
    setSaveStatus('saving');
    setDetectionError(null);
    console.log("Saving machine number:", editableMachineNumber, "for Make:", machineData.make, "Model:", machineData.modelName, "User:", currentUser.id);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, you would save this to your backend here:
    // e.g., await machineService.updateMachineIdentifier(currentUser.id, machineData.originalGeminiOutput (or a unique ID), editableMachineNumber);
    
    // For now, just update the status
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
    
    // Potentially update the originalGeminiOutput if we were to re-save the whole record
    // This is more complex and depends on how data is structured/saved.
    // For now, this save action is mostly local to this conceptual "detail".
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200">
      <header className="bg-[#1A1A1A] p-4 shadow-xl sticky top-0 z-50 border-b border-[#2C2C2C]">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50"
            aria-label="Go back to main application"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-xl font-bold text-red-500 text-center truncate px-2">
            Machine Details
          </h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] flex flex-col lg:flex-row gap-6">
          {/* Image Column */}
          <div className="lg:w-2/5 flex flex-col items-center">
            <img 
              src={machineData.frameDataUrl} 
              alt={`${machineData.make || ''} ${machineData.modelName || ''}`}
              className="w-full max-w-sm h-auto object-contain rounded-md border border-[#333333] shadow-lg mb-4"
            />
             <div className="text-xs text-neutral-500 text-center px-2 w-full max-w-sm">
                This is the captured image used for identification.
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:w-3/5 flex flex-col space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-100 mb-1">
                {machineData.make || 'Unknown Make'} - {machineData.modelName || 'Unknown Model'}
              </h2>
              {machineData.description && machineData.description.includes('Identifier:') && (
                <p className="text-sm text-neutral-400">{machineData.description.split(', Identifier:')[0]}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="machineNumber" className="block text-sm font-medium text-neutral-300 mb-1">
                  Machine/Serial Number
                </label>
                <input
                  type="text"
                  id="machineNumber"
                  value={editableMachineNumber}
                  onChange={(e) => {
                    setEditableMachineNumber(e.target.value);
                    setSaveStatus('idle'); // Reset save status if user edits
                    setDetectionError(null);
                  }}
                  placeholder="Enter or detect number"
                  className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                  aria-describedby="machine-number-status"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDetectNumber}
                  disabled={isDetectingNumber || saveStatus === 'saving'}
                  className="flex-1 flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm bg-sky-600 hover:bg-sky-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-colors duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDetectingNumber ? <Loader size="sm" className="mr-2" /> : <MagnifyingGlassIcon className="w-5 h-5 mr-2" />}
                  {isDetectingNumber ? 'Detecting...' : 'Detect Number from Image'}
                </button>
                <button
                  onClick={handleSaveNumber}
                  disabled={isDetectingNumber || saveStatus === 'saving' || saveStatus === 'saved' || !currentUser}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed
                    ${saveStatus === 'saved' ? 'bg-green-600 text-white focus:ring-green-500' :
                    (saveStatus === 'error' ? 'bg-orange-600 text-white focus:ring-orange-500' :
                    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500')}
                  `}
                >
                  {saveStatus === 'saving' && <Loader size="sm" className="mr-2" />}
                  {saveStatus === 'saved' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
                  {saveStatus !== 'saving' && saveStatus !== 'saved' && <PencilIcon className="w-5 h-5 mr-2" />}
                  {saveStatus === 'saving' ? 'Saving...' : (saveStatus === 'saved' ? 'Number Saved!' : (saveStatus === 'error' ? 'Save Error' : 'Save Number'))}
                </button>
              </div>
              
              {(detectionError || (saveStatus === 'error' && !detectionError)) && (
                 <div id="machine-number-status" className="mt-2 text-xs p-2.5 rounded-md bg-red-700/20 border border-red-600/50 text-red-300 flex items-center gap-2">
                    <InformationCircleIcon className="w-4 h-4 flex-shrink-0"/>
                    <span>{detectionError || "An error occurred while saving."}</span>
                </div>
              )}
              {!currentUser && saveStatus !== 'error' && (
                 <div className="mt-2 text-xs p-2.5 rounded-md bg-yellow-700/20 border border-yellow-600/50 text-yellow-300 flex items-center gap-2">
                    <InformationCircleIcon className="w-4 h-4 flex-shrink-0"/>
                    <span>You need to be logged in to save changes.</span>
                </div>
              )}
            </div>

            {machineData.originalGeminiOutput && (
              <div className="pt-3 border-t border-[#2C2C2C]">
                <button 
                  onClick={() => setShowFullOriginalOutput(!showFullOriginalOutput)}
                  className="text-sm text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                >
                  <SparklesIcon className="w-4 h-4"/>
                  {showFullOriginalOutput ? 'Hide' : 'Show'} Full AI Response
                  <ChevronLeftIcon className={`w-4 h-4 transform transition-transform ${showFullOriginalOutput ? '-rotate-90' : 'rotate-0'}`} />

                </button>
                {showFullOriginalOutput && (
                  <div className="mt-2 p-3 bg-[#222222] rounded-md border border-[#333333]">
                    <p className="text-xs text-neutral-300 whitespace-pre-wrap break-words font-mono">
                      {machineData.originalGeminiOutput}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MachineDetailPage;
