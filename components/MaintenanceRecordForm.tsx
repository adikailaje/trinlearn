
import React, { useState, useEffect, FormEvent } from 'react';
import { MaintenanceRecord, CmmsSyncStatus } from '../types';
import { Loader } from './Loader';
import { CalendarDaysIcon, InformationCircleIcon } from './Icons';

interface MaintenanceRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MaintenanceRecord, 'id' | 'userId' | 'machineMake' | 'machineModelName' | 'createdAt' | 'updatedAt' | 'cmmsSyncStatus' | 'cmmsRecordId'>) => Promise<void>;
  initialData?: Partial<MaintenanceRecord>; // For editing
  isLoading: boolean;
  formError: string | null;
}

const MaintenanceRecordForm: React.FC<MaintenanceRecordFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  formError
}) => {
  const [serviceDate, setServiceDate] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [repairActions, setRepairActions] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [technician, setTechnician] = useState('');
  const [currentFormError, setCurrentFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setServiceDate(initialData.serviceDate ? initialData.serviceDate.split('T')[0] : ''); // Format for date input
      setIssueDescription(initialData.issueDescription || '');
      setRepairActions(initialData.repairActions || '');
      setPartsUsed(initialData.partsUsed || '');
      setTechnician(initialData.technician || '');
    } else {
      // Reset form for new entry
      setServiceDate(new Date().toISOString().split('T')[0]); // Default to today
      setIssueDescription('');
      setRepairActions('');
      setPartsUsed('');
      setTechnician('');
    }
    setCurrentFormError(null); // Clear local error when initialData changes or form opens
  }, [initialData, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCurrentFormError(null);
    if (!serviceDate || !issueDescription.trim()) {
      setCurrentFormError('Service Date and Issue Description are required.');
      return;
    }
    await onSubmit({
      serviceDate,
      issueDescription: issueDescription.trim(),
      repairActions: repairActions.trim(),
      partsUsed: partsUsed.trim() || undefined,
      technician: technician.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  const displayError = currentFormError || formError;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-neutral-100">
            {initialData?.id ? 'Edit' : 'Add'} Maintenance Record
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="serviceDate" className="block text-sm font-medium text-neutral-300 mb-1">Service Date <span className="text-red-500">*</span></label>
            <div className="relative">
                 <input
                    type="date"
                    id="serviceDate"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none"
                 />
                 <CalendarDaysIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="issueDescription" className="block text-sm font-medium text-neutral-300 mb-1">Issue Description <span className="text-red-500">*</span></label>
            <textarea
              id="issueDescription"
              rows={3}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              required
              placeholder="Describe the issue observed..."
              className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="repairActions" className="block text-sm font-medium text-neutral-300 mb-1">Repair Actions Taken</label>
            <textarea
              id="repairActions"
              rows={3}
              value={repairActions}
              onChange={(e) => setRepairActions(e.target.value)}
              placeholder="Detail the repairs performed..."
              className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="partsUsed" className="block text-sm font-medium text-neutral-300 mb-1">Parts Used (Optional)</label>
            <input
              type="text"
              id="partsUsed"
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
              placeholder="e.g., Filter X, Belt Y"
              className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="technician" className="block text-sm font-medium text-neutral-300 mb-1">Technician (Optional)</label>
            <input
              type="text"
              id="technician"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="Technician's name or ID"
              className="w-full px-3 py-2 rounded-md bg-[#222222] border border-[#333333] text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          {displayError && (
             <div className="mt-2 text-xs p-2.5 rounded-md bg-red-700/20 border border-red-600/50 text-red-300 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 flex-shrink-0"/>
                <span>{displayError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-md text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading && <Loader size="sm" className="mr-2" />}
              {initialData?.id ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceRecordForm;
