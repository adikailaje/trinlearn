import { GEMINI_MODEL_NAME } from '../constants';
import { MaintenanceRecord, PredictiveMaintenanceResult, DraftedWorkOrder, WorkRequestAnalysisResult, AnalyzedReceiptData } from "../types";

// Helper for making API requests to our own backend
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.error || `Request failed with status ${response.status}`);
  }
  return responseData;
}


export const generateDescriptionFromFrame = async (
  base64ImageData: string,
  promptText: string
): Promise<string> => {
    const response = await apiRequest<{ text: string }>('/api/analyze-frame', {
        method: 'POST',
        body: JSON.stringify({
            base64ImageData,
            promptText,
            modelName: GEMINI_MODEL_NAME
        })
    });
    return response.text;
};

export const getPredictiveMaintenanceInsights = async (
  workHistory: MaintenanceRecord[]
): Promise<PredictiveMaintenanceResult> => {
    return apiRequest<PredictiveMaintenanceResult>('/api/predictive-maintenance', {
        method: 'POST',
        body: JSON.stringify({ workHistory })
    });
};

export const draftWorkOrderFromReport = async (
    issueDescription: string,
    photoBase64?: string
): Promise<DraftedWorkOrder> => {
    return apiRequest<DraftedWorkOrder>('/api/draft-work-order', {
        method: 'POST',
        body: JSON.stringify({ issueDescription, photoBase64 })
    });
};

export const getWorkRequestAnalysis = async (
  machine: { make: string; modelName: string },
  workRequest: { title: string; description?: string }
): Promise<WorkRequestAnalysisResult> => {
    return apiRequest<WorkRequestAnalysisResult>('/api/analyze-work-request', {
        method: 'POST',
        body: JSON.stringify({ machine, workRequest })
    });
};

export const scrapeManualLinks = async (make: string, modelName: string): Promise<string[]> => {
  const response = await apiRequest<{ urls: string[] }>('/api/scrape-manuals', {
    method: 'POST',
    body: JSON.stringify({ make, modelName }),
  });
  return response.urls;
};

export const analyzeReceiptForWorkHistory = async (base64ImageData: string): Promise<AnalyzedReceiptData> => {
    // This function will need a new backend endpoint. For now, we'll assume it exists.
    // Let's call it `/api/analyze-receipt`.
    const response = await apiRequest<{ data: AnalyzedReceiptData }>('/api/analyze-receipt', {
        method: 'POST',
        body: JSON.stringify({ base64ImageData })
    });
    return response.data;
};
