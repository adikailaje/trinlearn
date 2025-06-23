import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { rememberedMachinesService } from '../services/rememberedMachinesService';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, TrashIcon, BrainIcon } from '../components/Icons';

interface SavedMachinesPageProps {
  onNavigateBack: () => void;
}

const SavedMachinesPage: React.FC<SavedMachinesPageProps> = ({ onNavigateBack }) => {
  const { currentUser } = useAuth();
  const [savedMachines, setSavedMachines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMachines = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      setError("User not logged in.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const machines = await rememberedMachinesService.getRememberedMachines(currentUser.id);
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

  const handleRemoveMachine = async (machineDescription: string) => {
    if (!currentUser) return;
    setIsLoading(true); // Indicate activity
    try {
      const updatedMachines = await rememberedMachinesService.removeRememberedMachine(currentUser.id, machineDescription);
      setSavedMachines(updatedMachines);
    } catch (e) {
      console.error("Failed to remove machine:", e);
      setError("Failed to remove machine. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllMachines = async () => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to clear all your saved machines? This action cannot be undone.")) {
      setIsLoading(true);
      try {
        const updatedMachines = await rememberedMachinesService.clearAllRememberedMachines(currentUser.id);
        setSavedMachines(updatedMachines);
      } catch (e) {
        console.error("Failed to clear all machines:", e);
        setError("Failed to clear all machines. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
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
          <h1 className="text-xl font-bold text-red-500 flex items-center">
            <BrainIcon className="w-6 h-6 mr-2 text-red-400" />
            Your Saved Machines
          </h1>
          <div className="w-20"></div> {/* Spacer to balance header */}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C]">
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
              {savedMachines.length > 0 ? (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleClearAllMachines}
                      className="text-xs text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
                      title="Clear all saved machines"
                      disabled={isLoading}
                    >
                      Clear All ({savedMachines.length})
                    </button>
                  </div>
                  <ul className="space-y-3">
                    {savedMachines.map((machine, index) => (
                      <li 
                        key={`${machine}-${index}`} 
                        className="text-sm text-neutral-200 bg-[#222222] p-3 rounded-md flex justify-between items-center group border border-[#333333] hover:border-[#444444]"
                      >
                        <span className="truncate pr-2">{machine}</span>
                        <button 
                          onClick={() => handleRemoveMachine(machine)}
                          className="text-neutral-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-neutral-600/50 disabled:opacity-50"
                          title="Remove this machine"
                          disabled={isLoading}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="text-center py-10">
                  <BrainIcon className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500 text-lg">You haven't saved any machines yet.</p>
                  <p className="text-neutral-600 text-sm mt-2">Machines you save or that are auto-remembered will appear here.</p>
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