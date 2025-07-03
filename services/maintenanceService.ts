
import { MaintenanceRecord, CmmsSyncStatus } from '../types';

const MAINTENANCE_RECORDS_KEY_PREFIX = 'gemini_app_maintenance_records_';

// Helper to simulate async operations
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStorageKey = (userId: string, machineMake: string, machineModelName: string): string => {
  return `${MAINTENANCE_RECORDS_KEY_PREFIX}${userId}_${machineMake}_${machineModelName}`;
};

export const maintenanceService = {
  getMaintenanceRecords: async (
    userId: string,
    machineMake: string,
    machineModelName: string
  ): Promise<MaintenanceRecord[]> => {
    await simulateDelay(100);
    const key = getStorageKey(userId, machineMake, machineModelName);
    const storedData = localStorage.getItem(key);
    const records: MaintenanceRecord[] = storedData ? JSON.parse(storedData) : [];
    // Sort by serviceDate descending by default
    return records.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  },

  addMaintenanceRecord: async (
    userId: string,
    machineMake: string,
    machineModelName: string,
    recordData: Omit<MaintenanceRecord, 'id' | 'userId' | 'machineMake' | 'machineModelName' | 'createdAt' | 'updatedAt' | 'cmmsSyncStatus' | 'cmmsRecordId'>
  ): Promise<MaintenanceRecord> => {
    await simulateDelay(150);
    const records = await maintenanceService.getMaintenanceRecords(userId, machineMake, machineModelName);
    
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: `maint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      machineMake,
      machineModelName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cmmsSyncStatus: CmmsSyncStatus.NotSynced,
    };

    records.push(newRecord);
    localStorage.setItem(getStorageKey(userId, machineMake, machineModelName), JSON.stringify(records));
    return newRecord;
  },

  updateMaintenanceRecord: async (
    userId: string,
    machineMake: string,
    machineModelName: string,
    recordId: string,
    updates: Partial<Omit<MaintenanceRecord, 'id' | 'userId' | 'machineMake' | 'machineModelName' | 'createdAt' | 'cmmsSyncStatus' | 'cmmsRecordId'>>
  ): Promise<MaintenanceRecord> => {
    await simulateDelay(150);
    let records = await maintenanceService.getMaintenanceRecords(userId, machineMake, machineModelName);
    const recordIndex = records.findIndex(r => r.id === recordId);

    if (recordIndex === -1) {
      throw new Error("Maintenance record not found.");
    }

    records[recordIndex] = {
      ...records[recordIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      // If content changes, reset sync status conceptually (actual CMMS would handle updates)
      cmmsSyncStatus: CmmsSyncStatus.NotSynced, 
    };

    localStorage.setItem(getStorageKey(userId, machineMake, machineModelName), JSON.stringify(records));
    return records[recordIndex];
  },

  deleteMaintenanceRecord: async (
    userId: string,
    machineMake: string,
    machineModelName: string,
    recordId: string
  ): Promise<void> => {
    await simulateDelay(100);
    let records = await maintenanceService.getMaintenanceRecords(userId, machineMake, machineModelName);
    records = records.filter(r => r.id !== recordId);
    localStorage.setItem(getStorageKey(userId, machineMake, machineModelName), JSON.stringify(records));
  },

  // Placeholder for CMMS Sync
  syncRecordToCmms: async (
    userId: string,
    machineMake: string,
    machineModelName: string,
    recordId: string
  ): Promise<{ success: boolean; status: CmmsSyncStatus; cmmsRecordId?: string; error?: string }> => {
    await simulateDelay(100); // Simulate network latency to set pending
    let records = await maintenanceService.getMaintenanceRecords(userId, machineMake, machineModelName);
    const recordIndex = records.findIndex(r => r.id === recordId);

    if (recordIndex === -1) {
      return { success: false, status: CmmsSyncStatus.Failed, error: "Record not found locally." };
    }

    records[recordIndex].cmmsSyncStatus = CmmsSyncStatus.Pending;
    localStorage.setItem(getStorageKey(userId, machineMake, machineModelName), JSON.stringify(records));
    
    // Notify UI (MachineDetailPage) to re-fetch or update this specific record's state
    // For now, MachineDetailPage will re-fetch list, but a more granular update would be better in a real app.

    console.log(`Simulating CMMS Sync for record ID: ${recordId}`);
    await simulateDelay(1500); // Simulate actual sync process

    // Simulate success or failure
    const success = Math.random() > 0.2; // 80% success rate
    if (success) {
      records = await maintenanceService.getMaintenanceRecords(userId, machineMake, machineModelName); // Re-fetch to ensure working with latest
      const currentRecordIndex = records.findIndex(r => r.id === recordId);
      if (currentRecordIndex !== -1) {
          records[currentRecordIndex].cmmsSyncStatus = CmmsSyncStatus.Synced;
          records[currentRecordIndex].cmmsRecordId = `cmms-${Date.now()}`; // Mock CMMS ID
          localStorage.setItem(getStorageKey(userId, machineMake, machineModelName), JSON.stringify(records));
      }
      return { success: true, status: CmmsSyncStatus.Synced, cmmsRecordId: records[currentRecordIndex]?.cmmsRecordId };
    } else {
      records = await maintenanceService.getMaintenanceRecords(userId, machineMake, machineModelName); // Re-fetch
      const currentRecordIndex = records.findIndex(r => r.id === recordId);
      if(currentRecordIndex !== -1) {
          records[currentRecordIndex].cmmsSyncStatus = CmmsSyncStatus.Failed;
          localStorage.setItem(getStorageKey(userId, machineMake, machineModelName), JSON.stringify(records));
      }
      return { success: false, status: CmmsSyncStatus.Failed, error: "Simulated CMMS sync failure." };
    }
  },
};
