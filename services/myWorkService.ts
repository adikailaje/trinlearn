
import { WorkItem, WorkItemStatus, DraftedWorkOrder, WorkItemType } from '../types';

const API_BASE = '/api'; // Assuming proxy is set up in dev environment

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
  
  // Handle cases with no response body (e.g., 204 No Content)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  } else {
    return Promise.resolve(null as T);
  }
}

export const myWorkService = {
  getWorkItemsForUser: async (userId: string): Promise<WorkItem[]> => {
    return apiRequest(`/my-work/${userId}`);
  },

  getWorkItemById: async (userId: string, itemId: string): Promise<WorkItem | null> => {
    try {
      return await apiRequest(`/my-work/${userId}/${itemId}`);
    } catch (e) {
      console.error(`Failed to get work item ${itemId}:`, e);
      return null;
    }
  },

  startWorkItem: async (userId: string, itemId: string): Promise<WorkItem | null> => {
    return apiRequest(`/work-items/${itemId}/start`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  pauseWorkItem: async (userId: string, itemId: string, pause: boolean): Promise<WorkItem | null> => {
    return apiRequest(`/work-items/${itemId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ userId, pause }),
    });
  },

  updateTaskStatus: async (userId: string, itemId: string, taskId: string, completed: boolean): Promise<WorkItem | null> => {
    return apiRequest(`/work-items/${itemId}/tasks/${taskId}`, {
      method: 'POST',
      body: JSON.stringify({ userId, completed }),
    });
  },

  completeWorkItem: async (userId: string, itemId: string, notes: string, signatureDataUrl: string): Promise<WorkItem | null> => {
    return apiRequest(`/work-items/${itemId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId, notes, signatureDataUrl }),
    });
  },

  createWorkItemFromDraft: async (
    draft: DraftedWorkOrder,
    asset: { assetId?: string; assetName?: string; },
    assignedToUserId: string
  ): Promise<WorkItem> => {
    // This function can remain client-side for now as it's for demo data generation
    // In a real app, this would also be a backend endpoint.
    console.warn("createWorkItemFromDraft is using a mock implementation.");
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7);

    const newWorkItem: WorkItem = {
      id: `WO-DRAFT-${Date.now()}`,
      type: WorkItemType.WorkOrder,
      title: draft.title,
      assetId: asset.assetId,
      assetName: asset.assetName,
      priority: draft.priority,
      dueDate: dueDate.toISOString().split('T')[0],
      status: WorkItemStatus.Open,
      assignedToUserId,
      description: `Work order drafted by AI. Original request: ${draft.title}`,
      tasks: draft.tasks.map((desc, i) => ({ id: `task-draft-${i}`, description: desc, completed: false })),
      parts: draft.parts.map((name, i) => ({ id: `part-draft-${i}`, name, quantityRequired: 1 })),
      safetyProcedures: [], hazards: [], requiredPPE: [], assetHistory: [],
    };
    return newWorkItem;
  },
};
