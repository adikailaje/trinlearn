

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MachineDetailData, UserMachineData, MachineNumberUpdatePayload, MaintenanceRecord, DocumentLink, WorkRequest, WorkRequestStatus, WorkItemPriority, TrinMachineQrPayload, User, FloorSectionDefinition, Role, DraftedWorkOrder, ReportIssuePageProps, ManualsModalState } from '../types';
import { draftWorkOrderFromReport, scrapeManualLinks } from '../services/geminiService';
import { rememberedMachinesService } from '../services/rememberedMachinesService';
import { floorPlanService } from '../services/floorPlanService';
import { myWorkService } from '../services/myWorkService';
import { authService } from '../services/authService';
import { TRIN_MACHINE_QR_TYPE, TRIN_MACHINE_QR_VERSION } from '../constants';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, SparklesIcon, DocumentTextIcon, QrCodeIcon, CameraIcon, ExclamationTriangleIcon, XMarkIcon, MagnifyingGlassIcon } from '../components/Icons'; 
import { useAuth } from '../hooks/useAuth';
import { QrDisplayModal } from '../components/QrDisplayModal';

export interface MachineDetailPageProps {
    machineInitialData: MachineDetailData; 
    onNavigateBackToScanView: () => void; 
    onMachineNumberUpdate: (payload: MachineNumberUpdatePayload) => void; 
    onMachineDataUpdate: (updatedMachineData: UserMachineData) => void;
    onNavigateToReportIssue: (prefillData?: ReportIssuePageProps['prefillData']) => void;
}

// --- Draft Modal Component ---
const DraftWorkOrderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    draft: DraftedWorkOrder | null;
    isCreating: boolean;
    onCreate: (draft: DraftedWorkOrder) => void;
    machineName: string;
    error: string | null;
}> = ({ isOpen, onClose, draft, isCreating, onCreate, machineName, error }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-lg max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-semibold text-neutral-100 mb-2">AI-Drafted Work Order</h3>
                <p className="text-sm text-neutral-400 mb-4">Review the draft for <strong className="text-neutral-200">{machineName}</strong>. You can assign it to a user after creation.</p>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {!draft && !error && (
                        <div className="flex items-center justify-center h-full">
                            <Loader size="md"/>
                            <p className="ml-3">Drafting with AI...</p>
                        </div>
                    )}
                    {error && (
                         <div className="p-3 bg-red-800/30 border border-red-700/50 text-red-300 text-sm">
                            <p className="font-semibold">Drafting Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {draft && (
                        <>
                            <div>
                                <label className="text-xs font-bold uppercase text-neutral-500">Title</label>
                                <p className="p-2 bg-[#252525] rounded-md text-neutral-200">{draft.title}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-neutral-500">Priority</label>
                                <p className="p-2 bg-[#252525] rounded-md text-neutral-200">{draft.priority}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-neutral-500">Suggested Tasks</label>
                                <ul className="list-disc list-inside space-y-1 p-2 bg-[#252525] rounded-md text-neutral-300">
                                    {draft.tasks.map((task, i) => <li key={i}>{task}</li>)}
                                </ul>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-neutral-500">Potential Parts</label>
                                <ul className="list-disc list-inside space-y-1 p-2 bg-[#252525] rounded-md text-neutral-300">
                                    {draft.parts.length > 0 ? draft.parts.map((part, i) => <li key={i}>{part}</li>) : <li>No specific parts suggested.</li>}
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-700">
                    <button onClick={onClose} disabled={isCreating} className="px-4 py-2 rounded-md text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 transition-colors disabled:opacity-50">Cancel</button>
                    <button onClick={() => draft && onCreate(draft)} disabled={isCreating || !draft} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center">
                        {isCreating && <Loader size="sm" className="mr-2"/>}
                        {isCreating ? 'Creating...' : 'Create Work Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const MachineDetailPage: React.FC<MachineDetailPageProps> = ({ machineInitialData, onNavigateBackToScanView, onMachineNumberUpdate, onMachineDataUpdate, onNavigateToReportIssue }) => {
  const { currentUser } = useAuth();
  const [machineData, setMachineData] = useState<UserMachineData>(machineInitialData);
  const [editableMachineNumber, setEditableMachineNumber] = useState<string>(machineInitialData.machineNumber || '');
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'info' | 'requests' | 'history' | 'docs'>('info');

  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftedWorkOrder | null>(null);
  const [draftingError, setDraftingError] = useState<string | null>(null);
  const [isCreatingWorkItem, setIsCreatingWorkItem] = useState(false);
  const [selectedRequestForDraft, setSelectedRequestForDraft] = useState<WorkRequest | null>(null);
  
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrCodeDataString, setQrCodeDataString] = useState<string>('');
  
  const [floorSections, setFloorSections] = useState<FloorSectionDefinition[]>([]);
  const [manualsModalState, setManualsModalState] = useState<ManualsModalState>({ isOpen: false, isLoading: false, links: [], error: null });

  useEffect(() => {
    const fetchFloorPlan = async () => {
        try {
            const plans = await floorPlanService.getFloorPlans();
            if (plans && plans.length > 0) {
                setFloorSections(plans[0].sections);
            }
        } catch (error) {
            console.error("Failed to load floor plan sections for dropdown", error);
        }
    };
    fetchFloorPlan();
  }, []);

  const loadMachineDataFromStorage = useCallback(async () => {
    setIsLoadingInitialData(true);
    if (!currentUser || !machineInitialData.make || !machineInitialData.modelName) {
      const initialWithDefaults: UserMachineData = { ...machineInitialData, workHistory: [], documents: [], workRequests: [], additionalInfo: '' };
      setMachineData(initialWithDefaults);
      setEditableMachineNumber(initialWithDefaults.machineNumber || '');
      setIsLoadingInitialData(false);
      return;
    }
    try {
      const storedData = await rememberedMachinesService.getSpecificUserMachineData(currentUser.id, machineInitialData.make, machineInitialData.modelName);
      let dataToSet: UserMachineData = storedData ? { ...machineInitialData, ...storedData, frameDataUrl: machineInitialData.frameDataUrl } : { ...machineInitialData, workHistory: [], documents: [], workRequests: [], additionalInfo: ''};
      setMachineData(dataToSet);
      setEditableMachineNumber(dataToSet.machineNumber || '');
    } catch (e) {
      console.error("Error loading full machine data:", e);
      setMachineData(machineInitialData);
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [currentUser, machineInitialData]);

  useEffect(() => {
    loadMachineDataFromStorage();
  }, [loadMachineDataFromStorage]);

  const handleSaveAll = async (updatedData: UserMachineData) => {
    if (!currentUser) { setSaveStatus('error'); setSaveError("Not logged in."); return; }
    setSaveStatus('saving');
    try {
      const { frameDataUrl, ...dataToSave } = updatedData;
      await rememberedMachinesService.saveUserMachineData(currentUser.id, dataToSave);
      onMachineDataUpdate(updatedData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error'); console.error("Failed to save machine data:", e); setSaveError("Could not save machine details.");
    }
  };

  const handleIdentifierUpdate = async () => {
    if (!currentUser) return;
    const newIdentifier = editableMachineNumber?.trim() || null;
    const oldIdentifier = machineData.machineNumber || null;

    if (newIdentifier === oldIdentifier) return;

    const performSave = async (dataToSave: UserMachineData) => {
        setMachineData(dataToSave);
        await handleSaveAll(dataToSave);
        onMachineNumberUpdate({ responseId: machineInitialData.id, newMachineNumber: dataToSave.machineNumber });
    };

    setSaveStatus('saving');
    setSaveError(null);
    
    try {
        if (!newIdentifier) {
            await performSave({ ...machineData, machineNumber: null });
            return;
        }

        const existingMachine = await rememberedMachinesService.findMachineByIdentifierAcrossUsers(newIdentifier);
        const isSameRecord = existingMachine && existingMachine.make === machineData.make && existingMachine.modelName === machineData.modelName && existingMachine.userId === currentUser.id;

        if (existingMachine && !isSameRecord) {
            const confirmSync = window.confirm(
              `Identifier "${newIdentifier}" is already assigned to "${existingMachine.make} ${existingMachine.modelName}".\n\nDo you want to sync and merge data (work history, documents, etc.) from that machine into this one?`
            );

            if (confirmSync) {
                const updatedData = { ...machineData, machineNumber: newIdentifier };
                const mergeArray = <T extends {id: string}>(targetArr: T[] = [], sourceArr: T[] = []) => {
                  const combined = [...sourceArr, ...targetArr];
                  const seen = new Set<string>();
                  return combined.filter(item => {
                    const duplicate = seen.has(item.id);
                    seen.add(item.id);
                    return !duplicate;
                  });
                };

                updatedData.workHistory = mergeArray(updatedData.workHistory, existingMachine.workHistory);
                updatedData.documents = mergeArray(updatedData.documents, existingMachine.documents);
                updatedData.workRequests = mergeArray(updatedData.workRequests, existingMachine.workRequests);

                if (existingMachine.additionalInfo && existingMachine.additionalInfo !== updatedData.additionalInfo) {
                    updatedData.additionalInfo = `${existingMachine.additionalInfo}\n\n--- Synced Data ---\n\n${updatedData.additionalInfo || ''}`.trim();
                }

                await performSave(updatedData);
            } else {
                setEditableMachineNumber(oldIdentifier || '');
                setSaveStatus('idle');
            }
        } else {
            await performSave({ ...machineData, machineNumber: newIdentifier });
        }
    } catch (e: any) {
        setSaveStatus('error');
        setSaveError(e.message || "An error occurred while updating the identifier.");
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };
  
  const handleFloorSectionUpdate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSectionId = e.target.value;
    const updatedData = { ...machineData, floorPlanSectionId: newSectionId === "none" ? null : newSectionId };
    setMachineData(updatedData);
    handleSaveAll(updatedData);
  };

  const handleGenerateQrCode = () => {
    if (!currentUser) return;
    const { frameDataUrl, ...payloadData } = machineData;
    const qrPayload: TrinMachineQrPayload = { type: TRIN_MACHINE_QR_TYPE, version: TRIN_MACHINE_QR_VERSION, data: { ...payloadData, lastUpdated: new Date().toISOString() } };
    try {
      setQrCodeDataString(JSON.stringify(qrPayload));
      setIsQrModalOpen(true);
    } catch (e) { console.error("Failed to stringify QR payload:", e); setSaveError("Could not generate QR code data."); }
  };

  const handleFindManuals = async () => {
    if (!machineData.make || !machineData.modelName) {
      alert("Make and Model must be known to find manuals.");
      return;
    }
    setManualsModalState({ isOpen: true, isLoading: true, links: [], error: null });
    try {
        const links = await scrapeManualLinks(machineData.make, machineData.modelName);
        if (links.length === 0) {
            setManualsModalState({ isOpen: true, isLoading: false, links: [], error: "No direct PDF manual links could be found automatically." });
        } else {
            setManualsModalState({ isOpen: true, isLoading: false, links, error: null });
        }
    } catch (e: any) {
        setManualsModalState({ isOpen: true, isLoading: false, links: [], error: e.message || "Failed to find manuals." });
    }
  };

  const handleShowGoogleSearchResult = () => {
    if (!machineData.make || !machineData.modelName) return;
    const { make, modelName } = machineData;
    const query = `filetype:pdf "${modelName}" "${make}" official manual support OR user guide OR service manual`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDraftWithAI = async (request: WorkRequest) => {
    setSelectedRequestForDraft(request); setDraftModalOpen(true); setDraft(null); setDraftingError(null);
    try {
        const photoBase64 = request.photoDataUrl ? request.photoDataUrl.split(',')[1] : undefined;
        const draftedWorkOrder = await draftWorkOrderFromReport(request.description || request.title, photoBase64);
        setDraft(draftedWorkOrder);
    } catch (e: any) { setDraftingError(e.message || "Failed to draft work order."); }
  };

  const handleCreateWorkItem = async (draftedOrder: DraftedWorkOrder) => {
    if (!currentUser) return;
    setIsCreatingWorkItem(true);
    try {
        const allUsers = await authService.getAllUsersRaw();
        const workerToAssign = allUsers.find(u => u.role === Role.User) || currentUser;
        await myWorkService.createWorkItemFromDraft(draftedOrder, { assetId: machineData.machineNumber || undefined, assetName: `${machineData.make} ${machineData.modelName}` }, workerToAssign.id);
        // Here you would typically also update the original request's status, e.g., to 'In Progress' or 'Closed'
        setDraftModalOpen(false);
    } catch (e: any) { setDraftingError(e.message || "Failed to create the work item."); } finally { setIsCreatingWorkItem(false); }
  };
  
  const isManagerOrAdmin = currentUser?.role === Role.Manager || currentUser?.role === Role.Admin || currentUser?.role === Role.SuperAdmin;

  if (isLoadingInitialData) {
    return <div className="flex-grow flex items-center justify-center p-6 bg-[#0D0D0D]"><Loader size="lg" /><p className="ml-4">Loading machine details...</p></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200 pb-20">
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-start">
          <button onClick={onNavigateBackToScanView} className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50 -ml-2">
            <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#1A1A1A] p-4 rounded-lg shadow-xl border border-[#2C2C2C] space-y-4">
              {machineData.frameDataUrl ? <img src={machineData.frameDataUrl} alt="Machine" className="w-full h-auto object-cover rounded-md" /> : <div className="w-full aspect-video bg-[#2d2d2d] rounded-md border border-[#404040] flex items-center justify-center"><CameraIcon className="w-16 h-16 text-neutral-600" /></div>}
              <div>
                <h2 className="text-xl font-bold text-neutral-100">{machineData.make} - {machineData.modelName}</h2>
                <p className="text-sm text-neutral-400 whitespace-pre-wrap">{machineData.userDisplayDescription}</p>
              </div>
            </div>
            <div className="bg-[#1A1A1A] p-4 sm:p-5 rounded-lg shadow-xl border border-[#2C2C2C]">
              <div className="flex items-center mb-3"><SparklesIcon className="w-5 h-5 mr-2 text-red-400" /><h3 className="text-md font-semibold text-neutral-100">AI Actions</h3></div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleFindManuals} 
                  disabled={!machineData.make || !machineData.modelName} 
                  className="flex items-center text-xs px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white transition-colors disabled:opacity-50"
                  title="Use AI to find direct PDF links for this machine's manual."
                >
                   <SparklesIcon className="w-4 h-4 mr-1.5"/> Find Manuals
                </button>
                <button
                  onClick={handleShowGoogleSearchResult}
                  disabled={!machineData.make || !machineData.modelName}
                  className="flex items-center text-xs px-3 py-1.5 rounded-md bg-neutral-600 hover:bg-neutral-500 text-white transition-colors disabled:opacity-50"
                  title="Open a new tab with Google search results for PDF manuals."
                >
                  <MagnifyingGlassIcon className="w-4 h-4 mr-1.5" />
                  Show Google Result
                </button>
                <button onClick={() => onNavigateToReportIssue({ make: machineData.make, modelName: machineData.modelName, assetName: `${machineData.make} ${machineData.modelName}` })} className="flex items-center text-xs px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white transition-colors">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1.5"/> Report an Issue
                </button>
              </div>
            </div>
             <div className="bg-[#1A1A1A] p-4 sm:p-5 rounded-lg shadow-xl border border-[#2C2C2C]">
                 <button onClick={handleGenerateQrCode} className="w-full flex items-center justify-center text-sm px-3 py-2 rounded-md bg-neutral-600 hover:bg-neutral-500 text-white transition-colors"><QrCodeIcon className="w-5 h-5 mr-2" /> Show Machine QR Code</button>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
                <div className="border-b border-[#333333] mb-4">
                    <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                        {['info', 'requests', 'history', 'docs'].map(tabId => (
                            <button key={tabId} onClick={() => setActiveTab(tabId as any)} className={`whitespace-nowrap flex items-center py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors ${activeTab === tabId ? 'border-red-500 text-red-400' : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'}`}>
                                {tabId.charAt(0).toUpperCase() + tabId.slice(1)}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-4 min-h-[200px]">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="machineNumber" className="text-xs font-bold uppercase text-neutral-500">Identifier / Serial Number</label>
                                <div className="flex gap-2 mt-1">
                                    <input id="machineNumber" type="text" value={editableMachineNumber} onChange={(e) => setEditableMachineNumber(e.target.value)} placeholder="Enter Machine S/N or ID" className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-colors" />
                                    <button onClick={handleIdentifierUpdate} disabled={saveStatus === 'saving' || editableMachineNumber === (machineData.machineNumber || '')} className="px-4 py-2 rounded-md font-semibold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"> {saveStatus === 'saving' ? <Loader size="sm"/> : 'Save'} </button>
                                </div>
                                {saveStatus === 'error' && <p className="text-red-400 text-xs mt-1">{saveError}</p>}
                                {saveStatus === 'saved' && <p className="text-green-400 text-xs mt-1">Identifier saved!</p>}
                            </div>
                            <div>
                                <label htmlFor="floorPlanSection" className="text-xs font-bold uppercase text-neutral-500">Assigned Location</label>
                                <select id="floorPlanSection" value={machineData.floorPlanSectionId || 'none'} onChange={handleFloorSectionUpdate} className="w-full mt-1 px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none">
                                    <option value="none">No Section Assigned</option>
                                    {floorSections.map(section => (<option key={section.id} value={section.id}>{section.name} ({section.category})</option>))}
                                </select>
                            </div>
                        </div>
                    )}
                     {activeTab === 'requests' && (
                        <div>
                            <h4 className="text-md font-semibold mb-2">Work Requests</h4>
                            <div className="space-y-3">
                                {(machineData.workRequests || []).length > 0 ? machineData.workRequests?.map(req => (
                                    <div key={req.id} className="p-3 bg-[#252525] rounded-lg border border-[#383838]">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <p className="font-semibold text-neutral-200">{req.title}</p>
                                                <p className="text-xs text-neutral-400">Status: {req.status} | Priority: {req.priority}</p>
                                                <p className="text-sm text-neutral-300 mt-1">{req.description}</p>
                                            </div>
                                            {isManagerOrAdmin && <button onClick={() => handleDraftWithAI(req)} className="text-xs px-2 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-500 whitespace-nowrap">Draft with AI</button>}
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-neutral-500 italic">No work requests reported for this machine.</p>}
                            </div>
                        </div>
                    )}
                    {activeTab === 'history' && <p className="text-sm text-neutral-500 italic">Work history would be shown here.</p>}
                    {activeTab === 'docs' && (
                         <div>
                            <h4 className="text-md font-semibold mb-2">Documents</h4>
                            <div className="space-y-3">
                                {(machineData.documents || []).length > 0 ? machineData.documents?.map(doc => (
                                    <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-[#252525] rounded-lg border border-[#383838] hover:border-red-500">
                                        <p className="font-semibold text-sky-400 hover:underline">{doc.name}</p>
                                        <p className="text-xs text-neutral-500">{doc.url}</p>
                                    </a>
                                )) : <p className="text-sm text-neutral-500 italic">No documents linked to this machine.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </main>
      <QrDisplayModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} qrData={qrCodeDataString} title={`${machineData.make} ${machineData.modelName}`} />
      <DraftWorkOrderModal 
        isOpen={draftModalOpen} 
        onClose={() => setDraftModalOpen(false)} 
        draft={draft}
        isCreating={isCreatingWorkItem}
        onCreate={handleCreateWorkItem}
        machineName={`${machineData.make} ${machineData.modelName}`}
        error={draftingError}
      />

    {manualsModalState.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-neutral-100 flex items-center">
                        <DocumentTextIcon className="w-6 h-6 mr-2 text-sky-400"/>
                        Manual Search Results
                    </h3>
                    <button onClick={() => setManualsModalState({ isOpen: false, isLoading: false, links: [], error: null })} className="p-1 text-neutral-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {manualsModalState.isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                            <Loader size="lg" />
                            <p className="mt-3">Searching for manuals...</p>
                        </div>
                    )}
                    {manualsModalState.error && (
                        <div className="p-3 text-center text-orange-300 bg-orange-800/30 border border-orange-700/50 rounded-md">
                            <p className="font-semibold">Search Notice</p>
                            <p className="text-sm">{manualsModalState.error}</p>
                        </div>
                    )}
                    {!manualsModalState.isLoading && !manualsModalState.error && manualsModalState.links.length > 0 && (
                        <ul className="space-y-2">
                            {manualsModalState.links.map((link, index) => (
                                <li key={index} className="bg-[#252525] p-3 rounded-md border border-[#383838] hover:border-sky-500">
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-sky-400 text-sm break-all hover:underline">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MachineDetailPage;