

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { rememberedMachinesService } from '../services/rememberedMachinesService';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, TrashIcon, BrainIcon, SparklesIcon, MagnifyingGlassIcon } from '../components/Icons';
import { UserMachineData, MachineDetailData, MachineNumberUpdatePayload, MachineSortOption, SavedMachinesPageProps } from '../types';
import { SavedMachineItem } from '../components/SavedMachineItem'; 


const SavedMachinesPage: React.FC<SavedMachinesPageProps> = ({ onNavigateBackToScanView, onNavigateToMachineDetail, onSavedDataChange }) => {
  const { currentUser } = useAuth();
  const [savedMachines, setSavedMachines] = useState<UserMachineData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<MachineSortOption>(MachineSortOption.LastUpdated);


  const fetchMachines = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      setError("User not logged in.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const machines = await rememberedMachinesService.getUserMachineDataList(currentUser.id);
      setSavedMachines(machines);
    } catch (e) {
      console.error("Failed to fetch saved machines:", e);
      setError("Could not load your saved machines. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const handleRemoveMachine = async (make: string, modelName: string) => {
    if (!currentUser) return;
    try {
      const updatedMachines = await rememberedMachinesService.deleteUserMachineData(currentUser.id, make, modelName);
      setSavedMachines(updatedMachines);
      onSavedDataChange(); 
    } catch (e) {
      console.error("Failed to remove machine:", e);
      setError("Failed to remove machine. Please try again.");
    }
  };

  const handleClearAllMachines = async () => {
    if (!currentUser || savedMachines.length === 0) return;
    if (window.confirm("Are you sure you want to clear all your saved machines? This action cannot be undone.")) {
      try {
        await rememberedMachinesService.clearAllUserMachineData(currentUser.id);
        setSavedMachines([]);
        onSavedDataChange(); 
      } catch (e) {
        console.error("Failed to clear all machines:", e);
        setError("Failed to clear all machines. Please try again.");
      }
    }
  };

  const handleSavedMachineNumberUpdate = useCallback((payload: MachineNumberUpdatePayload) => {
    const { responseId, newMachineNumber } = payload; 
    const [make, modelName] = responseId.split('-');

    setSavedMachines(prevMachines =>
      prevMachines.map(machine => {
        if (machine.make === make && machine.modelName === modelName) {
          let updatedDescription = `Make: ${machine.make}, Model: ${machine.modelName}`;
          if (newMachineNumber) {
            updatedDescription += `, Identifier: ${newMachineNumber}`;
          }
          return { ...machine, machineNumber: newMachineNumber, userDisplayDescription: updatedDescription, lastUpdated: new Date().toISOString() };
        }
        return machine;
      })
    );
     setSavedMachines(currentMachines => [...currentMachines].sort((a, b) => {
        if (sortOption === MachineSortOption.LastUpdated) {
            return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        } else if (sortOption === MachineSortOption.MakeModel) {
            const makeA = a.make.toLowerCase(); const makeB = b.make.toLowerCase();
            if (makeA < makeB) return -1; if (makeA > makeB) return 1;
            const modelA = a.modelName.toLowerCase(); const modelB = b.modelName.toLowerCase();
            if (modelA < modelB) return -1; if (modelA > modelB) return 1;
            return 0;
        }
        return 0;
    }));
    onSavedDataChange(); 
  }, [sortOption, onSavedDataChange]);

  const handleMachineClick = (machine: UserMachineData) => {
    // Construct MachineDetailData from UserMachineData for navigation
    // Ensure all fields expected by MachineDetailData are included.
    // MachineDetailData = UserMachineData & { id: string; userId?: string; }
    const machineDetailData: MachineDetailData = {
      ...machine, // Spread all properties from UserMachineData
      id: `${machine.make}-${machine.modelName}-${machine.machineNumber || 'no-id'}`, // Ensure a unique ID, can use timestamp or a more robust method if needed
      userId: currentUser?.id, // Add userId if available and relevant for the detail view context
      // Ensure UserMachineData fields are correctly populated
      make: machine.make,
      modelName: machine.modelName,
      machineNumber: machine.machineNumber || null,
      originalGeminiOutput: machine.originalGeminiOutput || `Make: ${machine.make}, Model: ${machine.modelName}`,
      frameDataUrl: machine.frameDataUrl || '',
      userDisplayDescription: machine.userDisplayDescription || `Make: ${machine.make}, Model: ${machine.modelName}${machine.machineNumber ? ', Identifier: ' + machine.machineNumber : ''}`,
      lastUpdated: machine.lastUpdated || new Date().toISOString(),
      additionalInfo: machine.additionalInfo || '',
      workHistory: machine.workHistory || [],
      documents: machine.documents || [],
      workRequests: machine.workRequests || [],
    };
    onNavigateToMachineDetail(machineDetailData, handleSavedMachineNumberUpdate);
  };

  const filteredAndSortedMachines = savedMachines
    .filter(machine => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        machine.make.toLowerCase().includes(searchTermLower) ||
        machine.modelName.toLowerCase().includes(searchTermLower) ||
        (machine.machineNumber && machine.machineNumber.toLowerCase().includes(searchTermLower)) ||
        (machine.userDisplayDescription && machine.userDisplayDescription.toLowerCase().includes(searchTermLower))
      );
    })
    .sort((a, b) => {
      if (sortOption === MachineSortOption.LastUpdated) {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      } else if (sortOption === MachineSortOption.MakeModel) {
        const makeA = a.make.toLowerCase(); const makeB = b.make.toLowerCase();
        if (makeA < makeB) return -1; if (makeA > makeB) return 1;
        const modelA = a.modelName.toLowerCase(); const modelB = b.modelName.toLowerCase();
        if (modelA < modelB) return -1; if (modelA > modelB) return 1;
        return 0;
      }
      return 0;
    });


  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200 pb-20">
      {/* Header is now handled by PageHeader via MainWrapper */}
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-start">
            <button
                onClick={onNavigateBackToScanView}
                className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50 -ml-2"
                aria-label="Back to Scan View"
            >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Scan
            </button>
        </div>
        <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
                <input
                    type="text"
                    placeholder="Search machines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-neutral-500 absolute left-3 top-1/2 transform -translate-y-1/2"/>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="sortOption" className="text-sm text-neutral-400">Sort by:</label>
                <select
                    id="sortOption"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as MachineSortOption)}
                    className="px-2 py-1.5 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                >
                    <option value={MachineSortOption.LastUpdated}>Last Updated</option>
                    <option value={MachineSortOption.MakeModel}>Make & Model</option>
                </select>
            </div>
          </div>


          {isLoading && !error && (
            <div className="flex justify-center items-center py-10">
              <Loader size="lg" />
              <p className="ml-4 text-neutral-400">Loading your machines...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-red-400">
              <p>{error}</p>
              <button
                onClick={fetchMachines}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {filteredAndSortedMachines.length > 0 ? (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleClearAllMachines}
                      className="text-xs text-red-400 hover:text-red-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Clear all saved machines"
                      disabled={isLoading || savedMachines.length === 0}
                    >
                      Clear All ({savedMachines.length})
                    </button>
                  </div>
                  <div className="space-y-4">
                    {filteredAndSortedMachines.map((machine) => (
                      <SavedMachineItem
                        key={`${machine.make}-${machine.modelName}`}
                        machine={machine}
                        onRemove={() => handleRemoveMachine(machine.make, machine.modelName)}
                        onClick={() => handleMachineClick(machine)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <BrainIcon className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500 text-lg">
                    {searchTerm ? "No machines match your search." : "You haven't saved any machines yet."}
                  </p>
                  <p className="text-neutral-600 text-sm mt-2">
                    {searchTerm ? "Try a different search term." : "Machines you save or that are auto-remembered will appear here."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SavedMachinesPage;
