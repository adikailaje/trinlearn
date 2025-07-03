

import { USER_MACHINE_DATA_KEY_PREFIX, REMEMBER_MACHINES_TOGGLE_KEY_PREFIX } from '../constants';
import { UserMachineData, MaintenanceRecord, DocumentLink, WorkRequest, User } from '../types';

// Helper to simulate async operations
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_SAVED_DETAILED_MACHINES = 50;

// Helper to create a user-friendly display description from UserMachineData
const createUserDisplayDescription = (data: Partial<UserMachineData>): string => {
  let desc = "";
  if (data.make && data.modelName) {
    desc = `Make: ${data.make}, Model: ${data.modelName}`;
  } else if (data.make) {
    desc = `Make: ${data.make}`;
  } else if (data.modelName) {
    desc = `Model: ${data.modelName}`;
  } else {
    desc = "Machine (Make/Model Unknown)";
  }
  if (data.machineNumber) {
    desc += `, Identifier: ${data.machineNumber}`;
  }
  return desc;
};


export const rememberedMachinesService = {
  // --- Toggle state (still relevant) ---
  getRememberToggleState: async (userId: string): Promise<boolean> => {
    await simulateDelay(50);
    const key = `${REMEMBER_MACHINES_TOGGLE_KEY_PREFIX}${userId}`;
    const storedState = localStorage.getItem(key);
    return storedState === null ? true : storedState === 'true';
  },

  setRememberToggleState: async (userId: string, isEnabled: boolean): Promise<void> => {
    await simulateDelay(50);
    const key = `${REMEMBER_MACHINES_TOGGLE_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, isEnabled.toString());
  },

  // --- Functions for detailed UserMachineData (Primary way to store machines) ---

  getUserMachineDataList: async (userId: string): Promise<UserMachineData[]> => {
    await simulateDelay(100);
    const key = `${USER_MACHINE_DATA_KEY_PREFIX}${userId}`;
    const storedData = localStorage.getItem(key);
    const machines: UserMachineData[] = storedData ? JSON.parse(storedData) : [];
    // Ensure new fields are initialized if not present
    return machines.map(m => ({
        ...m,
        workHistory: m.workHistory || [],
        documents: m.documents || [],
        workRequests: m.workRequests || [],
        additionalInfo: m.additionalInfo || '',
        floorPlanSectionId: m.floorPlanSectionId || null,
        // frameDataUrl will be undefined if not saved, which is fine
    }));
  },

  saveUserMachineData: async (userId: string, dataToSave: Partial<UserMachineData> & { make: string; modelName: string }): Promise<UserMachineData[]> => {
    await simulateDelay(150);
    let allMachineData = await rememberedMachinesService.getUserMachineDataList(userId);
    
    const existingIndex = allMachineData.findIndex(
      (m) => m.make === dataToSave.make && m.modelName === dataToSave.modelName
    );

    const displayDescription = dataToSave.userDisplayDescription || createUserDisplayDescription(dataToSave);

    // Explicitly exclude frameDataUrl from being stored to prevent localStorage overflow
    const recordToStore: UserMachineData = {
        make: dataToSave.make,
        modelName: dataToSave.modelName,
        machineNumber: dataToSave.machineNumber !== undefined ? dataToSave.machineNumber : null,
        originalGeminiOutput: dataToSave.originalGeminiOutput,
        // frameDataUrl is intentionally omitted here
        userDisplayDescription: displayDescription,
        lastUpdated: new Date().toISOString(),
        additionalInfo: dataToSave.additionalInfo || '',
        workHistory: dataToSave.workHistory || [],
        documents: dataToSave.documents || [],
        workRequests: dataToSave.workRequests || [],
        floorPlanSectionId: dataToSave.floorPlanSectionId || null,
        currentStatus: dataToSave.currentStatus,
        currentErrorCode: dataToSave.currentErrorCode,
        lastTelemetryUpdate: dataToSave.lastTelemetryUpdate,
        troubleshootingTips: dataToSave.troubleshootingTips
    };


    if (existingIndex > -1) {
      // Update existing record, merging new fields carefully
      const existingRecord = allMachineData[existingIndex];
      allMachineData[existingIndex] = {
        ...existingRecord, // Preserve old fields (like frameDataUrl if it was somehow there from an older version)
        ...recordToStore,   // Overwrite with new data. frameDataUrl in recordToStore is undefined, effectively removing it or keeping it absent.
        // Explicitly ensure arrays are not lost if `dataToSave` doesn't include them but existingRecord did
        workHistory: dataToSave.workHistory || existingRecord.workHistory || [],
        documents: dataToSave.documents || existingRecord.documents || [],
        workRequests: dataToSave.workRequests || existingRecord.workRequests || [],
      };
       // If existingRecord had a frameDataUrl and dataToSave didn't, we want to ensure it's NOT carried over if we are trying to phase it out.
      // The spread of recordToStore already handles making frameDataUrl undefined if it's not in recordToStore.
      // If for some reason dataToSave itself had frameDataUrl and we wanted to ensure it's stripped, recordToStore already handles it.
    } else {
      // Add new record (frameDataUrl is not in recordToStore)
      allMachineData.push(recordToStore);
    }

    allMachineData.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    if (allMachineData.length > MAX_SAVED_DETAILED_MACHINES) {
      allMachineData = allMachineData.slice(0, MAX_SAVED_DETAILED_MACHINES);
    }
    
    const key = `${USER_MACHINE_DATA_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(allMachineData));
    return allMachineData;
  },

  getSpecificUserMachineData: async (
    userId: string, 
    make: string, 
    modelName: string
  ): Promise<UserMachineData | null> => {
    await simulateDelay(100);
    const allMachineData = await rememberedMachinesService.getUserMachineDataList(userId);
    const foundMachine = allMachineData.find(
      (m) => m.make === make && m.modelName === modelName
    );
    if (foundMachine) {
        return { // Ensure all fields are present even if null/empty from older storage
            ...foundMachine,
            workHistory: foundMachine.workHistory || [],
            documents: foundMachine.documents || [],
            workRequests: foundMachine.workRequests || [],
            additionalInfo: foundMachine.additionalInfo || '',
            floorPlanSectionId: foundMachine.floorPlanSectionId || null,
            // frameDataUrl will be as it is in stored data (likely undefined)
        };
    }
    return null;
  },

  deleteUserMachineData: async (userId: string, make: string, modelName: string): Promise<UserMachineData[]> => {
    await simulateDelay(100);
    let allMachineData = await rememberedMachinesService.getUserMachineDataList(userId);
    allMachineData = allMachineData.filter(
      (m) => !(m.make === make && m.modelName === modelName)
    );
    
    const key = `${USER_MACHINE_DATA_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(allMachineData));
    return allMachineData;
  },

  clearAllUserMachineData: async (userId: string): Promise<UserMachineData[]> => {
    await simulateDelay(100);
    const key = `${USER_MACHINE_DATA_KEY_PREFIX}${userId}`;
    localStorage.removeItem(key);
    return [];
  },

  // --- Specific CRUD for sub-arrays ---
  // Example for Documents (similar can be made for WorkHistory, WorkRequests if needed directly)
  addDocumentLink: async (userId: string, machineMake: string, machineModelName: string, docLink: DocumentLink): Promise<UserMachineData | null> => {
    const machine = await rememberedMachinesService.getSpecificUserMachineData(userId, machineMake, machineModelName);
    if (machine) {
      machine.documents = [...(machine.documents || []), docLink];
      machine.lastUpdated = new Date().toISOString();
      await rememberedMachinesService.saveUserMachineData(userId, machine); // This will strip frameDataUrl again if it was somehow re-added
      return machine;
    }
    return null;
  },

  updateDocumentLink: async (userId: string, machineMake: string, machineModelName: string, updatedDocLink: DocumentLink): Promise<UserMachineData | null> => {
    const machine = await rememberedMachinesService.getSpecificUserMachineData(userId, machineMake, machineModelName);
    if (machine && machine.documents) {
      const docIndex = machine.documents.findIndex(d => d.id === updatedDocLink.id);
      if (docIndex > -1) {
        machine.documents[docIndex] = updatedDocLink;
        machine.lastUpdated = new Date().toISOString();
        await rememberedMachinesService.saveUserMachineData(userId, machine);
        return machine;
      }
    }
    return null;
  },

  deleteDocumentLink: async (userId: string, machineMake: string, machineModelName: string, docId: string): Promise<UserMachineData | null> => {
    const machine = await rememberedMachinesService.getSpecificUserMachineData(userId, machineMake, machineModelName);
    if (machine && machine.documents) {
      machine.documents = machine.documents.filter(d => d.id !== docId);
      machine.lastUpdated = new Date().toISOString();
      await rememberedMachinesService.saveUserMachineData(userId, machine);
      return machine;
    }
    return null;
  },

   addWorkRequest: async (userId: string, machineMake: string, machineModelName: string, workRequest: WorkRequest): Promise<UserMachineData | null> => {
    const machine = await rememberedMachinesService.getSpecificUserMachineData(userId, machineMake, machineModelName);
    if (machine) {
      machine.workRequests = [...(machine.workRequests || []), workRequest];
      machine.lastUpdated = new Date().toISOString();
      await rememberedMachinesService.saveUserMachineData(userId, machine);
      return machine;
    }
    return null;
  },

  updateWorkRequest: async (userId: string, machineMake: string, machineModelName: string, updatedWorkRequest: WorkRequest): Promise<UserMachineData | null> => {
    const machine = await rememberedMachinesService.getSpecificUserMachineData(userId, machineMake, machineModelName);
    if (machine && machine.workRequests) {
      const wrIndex = machine.workRequests.findIndex(wr => wr.id === updatedWorkRequest.id);
      if (wrIndex > -1) {
        machine.workRequests[wrIndex] = updatedWorkRequest;
        machine.lastUpdated = new Date().toISOString();
        await rememberedMachinesService.saveUserMachineData(userId, machine);
        return machine;
      }
    }
    return null;
  },

  deleteWorkRequest: async (userId: string, machineMake: string, machineModelName: string, workRequestId: string): Promise<UserMachineData | null> => {
    const machine = await rememberedMachinesService.getSpecificUserMachineData(userId, machineMake, machineModelName);
    if (machine && machine.workRequests) {
      machine.workRequests = machine.workRequests.filter(wr => wr.id !== workRequestId);
      machine.lastUpdated = new Date().toISOString();
      await rememberedMachinesService.saveUserMachineData(userId, machine);
      return machine;
    }
    return null;
  },
  
  getAllMachinesForAllUsers: async (): Promise<(UserMachineData & { userId: string, username: string })[]> => {
    await simulateDelay(250);
    const allMachines = [];
    const usersJson = localStorage.getItem('gemini_live_app_users');
    const users: Omit<User, 'profilePictureUrl'>[] = usersJson ? JSON.parse(usersJson) : [];

    for (const user of users) {
        const userMachines = await rememberedMachinesService.getUserMachineDataList(user.id);
        for (const machine of userMachines) {
            allMachines.push({ ...machine, userId: user.id, username: user.username });
        }
    }
    return allMachines;
  },

  findMachineByIdentifierAcrossUsers: async (
    identifier: string
  ): Promise<(UserMachineData & { userId: string, username: string }) | null> => {
    if (!identifier) return null;
    await simulateDelay(250); // Simulate a more "expensive" cross-user query
    const usersJson = localStorage.getItem('gemini_live_app_users');
    if (!usersJson) return null;
    
    const users: User[] = JSON.parse(usersJson);

    for (const user of users) {
        const userMachinesKey = `${USER_MACHINE_DATA_KEY_PREFIX}${user.id}`;
        const userMachinesJson = localStorage.getItem(userMachinesKey);
        if (userMachinesJson) {
            const userMachines: UserMachineData[] = JSON.parse(userMachinesJson);
            const foundMachine = userMachines.find(m => m.machineNumber && m.machineNumber.toLowerCase() === identifier.toLowerCase());
            if (foundMachine) {
                // Return the machine enriched with the user who owns it
                return { ...foundMachine, userId: user.id, username: user.username };
            }
        }
    }
    return null;
  },
};