import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { rememberedMachinesService } from '../services/rememberedMachinesService';
import { ManualAddMachinePageProps, UserMachineData, MachineDetailData, MachineNumberUpdatePayload } from '../types';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, CheckCircleIcon } from '../components/Icons';

const ManualAddMachinePage: React.FC<ManualAddMachinePageProps> = ({ onNavigateBack, onMachineAdded }) => {
    const { currentUser } = useAuth();
    const [make, setMake] = useState('');
    const [modelName, setModelName] = useState('');
    const [machineNumber, setMachineNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!make.trim() || !modelName.trim()) {
            setError("Make and Model are required fields.");
            return;
        }

        if (!currentUser) {
            setError("You must be logged in to add a machine.");
            return;
        }

        setIsLoading(true);

        try {
            const existingMachine = await rememberedMachinesService.getSpecificUserMachineData(currentUser.id, make.trim(), modelName.trim());
            if (existingMachine) {
                const proceed = window.confirm(`A machine with Make "${make.trim()}" and Model "${modelName.trim()}" already exists. Do you want to view its details instead?`);
                if (proceed) {
                    const machineDetailData: MachineDetailData = { ...existingMachine, id: `${existingMachine.make}-${existingMachine.modelName}` };
                    onMachineAdded(machineDetailData, () => {}); // onUpdate is complex to wire here, a no-op is acceptable for this flow.
                }
                setIsLoading(false);
                return;
            }

            const newMachineData: UserMachineData = {
                make: make.trim(),
                modelName: modelName.trim(),
                machineNumber: machineNumber.trim() || null,
                lastUpdated: new Date().toISOString(),
                userDisplayDescription: `Make: ${make.trim()}, Model: ${modelName.trim()}${machineNumber.trim() ? `, Identifier: ${machineNumber.trim()}`: ''}`,
                workHistory: [],
                documents: [],
                workRequests: [],
            };

            await rememberedMachinesService.saveUserMachineData(currentUser.id, newMachineData);
            
            const detailDataForNav: MachineDetailData = {
                ...newMachineData,
                id: `${newMachineData.make}-${newMachineData.modelName}-manual-${Date.now()}`,
                userId: currentUser.id,
            };
            
            const onUpdateCallback = (payload: MachineNumberUpdatePayload) => {
                 console.log("Update callback from manual add machine flow:", payload);
            };

            onMachineAdded(detailDataForNav, onUpdateCallback);

        } catch (e: any) {
            setError(e.message || "An error occurred while saving the machine.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputBaseClasses = "block w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors";
    const labelBaseClasses = "block text-sm font-medium text-neutral-300 mb-1";

    return (
        <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200 pb-20">
            <main className="flex-grow container mx-auto p-4 md:p-6">
                <div className="mb-4 flex items-center justify-start">
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50 -ml-2"
                        aria-label="Back to Scan View"
                    >
                        <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back
                    </button>
                </div>
                <div className="bg-[#1A1A1A] p-4 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] max-w-xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-semibold text-neutral-100 mb-6">Manually Add Machine</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="make" className={`${labelBaseClasses}`}>Make <span className="text-red-400">*</span></label>
                            <input type="text" name="make" id="make" value={make} onChange={(e) => setMake(e.target.value)} className={inputBaseClasses} required placeholder="e.g., Fanuc" />
                        </div>
                        <div>
                            <label htmlFor="modelName" className={`${labelBaseClasses}`}>Model <span className="text-red-400">*</span></label>
                            <input type="text" name="modelName" id="modelName" value={modelName} onChange={(e) => setModelName(e.target.value)} className={inputBaseClasses} required placeholder="e.g., R-2000iC" />
                        </div>
                        <div>
                            <label htmlFor="machineNumber" className={labelBaseClasses}>Identifier / Serial Number (Optional)</label>
                            <input type="text" name="machineNumber" id="machineNumber" value={machineNumber} onChange={(e) => setMachineNumber(e.target.value)} className={inputBaseClasses} placeholder="e.g., F123456" />
                        </div>

                        {error && <p className="text-sm text-red-400 bg-red-700/20 border border-red-600/50 p-3 rounded-md">{error}</p>}
                        
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] transition-colors disabled:opacity-60"
                        >
                            {isLoading ? <Loader size="sm" className="mr-2"/> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Saving...' : 'Save and View Details'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ManualAddMachinePage;