import { REMEMBER_MACHINES_TOGGLE_KEY_PREFIX, REMEMBERED_MACHINES_KEY_PREFIX } from '../constants';

// Helper to simulate async operations
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const rememberedMachinesService = {
  getRememberToggleState: async (userId: string): Promise<boolean> => {
    await simulateDelay(50); // Simulate async
    const key = `${REMEMBER_MACHINES_TOGGLE_KEY_PREFIX}${userId}`;
    const storedState = localStorage.getItem(key);
    return storedState === 'true'; // Default to false if not found or not 'true'
  },

  setRememberToggleState: async (userId: string, isEnabled: boolean): Promise<void> => {
    await simulateDelay(50);
    const key = `${REMEMBER_MACHINES_TOGGLE_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, isEnabled.toString());
  },

  getRememberedMachines: async (userId: string): Promise<string[]> => {
    await simulateDelay(100);
    const key = `${REMEMBERED_MACHINES_KEY_PREFIX}${userId}`;
    const storedMachines = localStorage.getItem(key);
    return storedMachines ? JSON.parse(storedMachines) : [];
  },

  addRememberedMachine: async (userId: string, machineDescription: string): Promise<string[]> => {
    await simulateDelay(100);
    const key = `${REMEMBERED_MACHINES_KEY_PREFIX}${userId}`;
    let machines = await rememberedMachinesService.getRememberedMachines(userId);
    if (!machines.includes(machineDescription)) {
      machines = [machineDescription, ...machines.slice(0, 49)]; // Keep latest 50
      localStorage.setItem(key, JSON.stringify(machines));
    }
    return machines;
  },

  removeRememberedMachine: async (userId: string, machineDescription: string): Promise<string[]> => {
    await simulateDelay(100);
    const key = `${REMEMBERED_MACHINES_KEY_PREFIX}${userId}`;
    let machines = await rememberedMachinesService.getRememberedMachines(userId);
    machines = machines.filter(m => m !== machineDescription);
    localStorage.setItem(key, JSON.stringify(machines));
    return machines;
  },

  clearAllRememberedMachines: async (userId: string): Promise<string[]> => {
    await simulateDelay(100);
    const key = `${REMEMBERED_MACHINES_KEY_PREFIX}${userId}`;
    localStorage.removeItem(key);
    return [];
  },
};
