import { SafetyPermit, SafetyPermitStatus, SafetyProcedureDocument, User } from '../types';

const API_BASE = '/api'; // Assuming proxy is set up in dev environment

// Helper to simulate async operations for non-migrated parts
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for fetch requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
    throw new Error(errorData.message || 'An unknown API error occurred.');
  }
  
  return response.json();
}

// Procedures can remain local for now as they are static library content
const SAFETY_PROCEDURES_KEY = 'trin_safety_procedures_library';
const getStoredProcedures = (): SafetyProcedureDocument[] => {
  const proceduresJson = localStorage.getItem(SAFETY_PROCEDURES_KEY);
  return proceduresJson ? JSON.parse(proceduresJson) : []; // This part can remain as is.
};


export const safetyService = {
  getActivePermitsForUser: async (userId: string): Promise<SafetyPermit[]> => {
    const allPermits = await apiRequest<SafetyPermit[]>(`/safety/permits/${userId}`);
    return allPermits.filter(permit =>
      (permit.status === SafetyPermitStatus.Active || permit.status === SafetyPermitStatus.PendingAcknowledgement || permit.status === SafetyPermitStatus.Acknowledged) &&
      new Date(permit.expiryDate) > new Date()
    ).sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  },

  getPastPermitsForUser: async (userId: string): Promise<SafetyPermit[]> => {
    const allPermits = await apiRequest<SafetyPermit[]>(`/safety/permits/${userId}`);
    const activeStatuses = [SafetyPermitStatus.Active, SafetyPermitStatus.PendingAcknowledgement, SafetyPermitStatus.Acknowledged];
    return allPermits.filter(permit => {
        if ([SafetyPermitStatus.Expired, SafetyPermitStatus.Closed, SafetyPermitStatus.Cancelled].includes(permit.status)) {
            return true;
        }
        if (activeStatuses.includes(permit.status) && new Date(permit.expiryDate) <= new Date()) {
            return true;
        }
        return false;
    }).sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
  },

  getPermitDetails: async (permitId: string, userId: string): Promise<SafetyPermit | null> => {
    try {
      return await apiRequest(`/safety/permits/${userId}/${permitId}`);
    } catch (e) {
      console.error(`Failed to get permit ${permitId}:`, e);
      return null;
    }
  },

  acknowledgePermit: async (userId: string, permitId: string, signatureDataUrl: string): Promise<SafetyPermit> => {
    return apiRequest(`/safety/permits/${permitId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ userId, signatureDataUrl }),
    });
  },

  // --- Local procedure functions can remain as they are for the demo ---
  getAllSafetyProcedures: async (): Promise<SafetyProcedureDocument[]> => {
    await simulateDelay(150);
    return getStoredProcedures().sort((a,b) => a.title.localeCompare(b.title));
  },

  searchSafetyProcedures: (searchTerm: string, procedures: SafetyProcedureDocument[]): SafetyProcedureDocument[] => {
    if (!searchTerm.trim()) {
      return procedures;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return procedures.filter(proc =>
      proc.title.toLowerCase().includes(lowerSearchTerm) ||
      (proc.documentNumber && proc.documentNumber.toLowerCase().includes(lowerSearchTerm)) ||
      proc.category.toLowerCase().includes(lowerSearchTerm) ||
      (proc.keywords && proc.keywords.some(kw => kw.toLowerCase().includes(lowerSearchTerm)))
    );
  },
};
