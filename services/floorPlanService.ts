import { FloorPlanData } from '../types';

const FLOOR_PLANS_STORAGE_KEY = 'trin_app_floor_plans';

// Helper to simulate async operations, can be removed if not needed
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getDefaultFloorPlans = (): FloorPlanData[] => ([{
  id: 'main-factory-floor-' + Date.now(),
  name: 'Main Factory Floor Plan',
  sections: [],
  planWidth: 800,
  planHeight: 600,
  lastUpdated: new Date().toISOString(),
}]);

export const floorPlanService = {
  getFloorPlans: async (): Promise<FloorPlanData[]> => {
    await simulateDelay(150);
    const storedData = localStorage.getItem(FLOOR_PLANS_STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Basic validation to ensure it has the expected shape
        if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData.every(p => p.id && Array.isArray(p.sections))) {
          return parsedData as FloorPlanData[];
        }
      } catch (e) {
        console.error("Failed to parse stored floor plans data, returning default.", e);
        return getDefaultFloorPlans();
      }
    }
    return getDefaultFloorPlans();
  },

  saveFloorPlans: async (plans: FloorPlanData[]): Promise<void> => {
    await simulateDelay(200);
    try {
      localStorage.setItem(FLOOR_PLANS_STORAGE_KEY, JSON.stringify(plans));
    } catch (e) {
      console.error("Failed to save floor plans data to localStorage.", e);
      throw new Error("Could not save floor plans. Storage might be full.");
    }
  },
};