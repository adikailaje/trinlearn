
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { MaintenanceRecord, PredictiveMaintenanceResult, DraftedWorkOrder, WorkRequest, WorkRequestAnalysisResult } from "../types";

let ai: GoogleGenAI | null = null;
let apiKeyAvailable = false;

if (process.env.API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    apiKeyAvailable = true;
    console.info("GoogleGenAI SDK initialized successfully with API_KEY from process.env.");
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI with API_KEY:", error);
    ai = null; // Ensure ai is null if initialization fails
    apiKeyAvailable = false;
  }
} else {
  console.warn("API_KEY not found in process.env. Gemini API calls will fail.");
  apiKeyAvailable = false;
}

const parseJsonFromMarkdown = <T>(text: string): T | null => {
    try {
        let jsonStr = text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", e, "Original text:", text);
        return null;
    }
};


export const generateDescriptionFromFrame = async (
  base64ImageData: string, // Pure base64 string, not data URL
  promptText: string
): Promise<string> => {
  if (!apiKeyAvailable || !ai) {
    console.error("Google GenAI SDK not initialized. API_KEY might be missing or invalid.");
    throw new Error("AI service is not configured. Please ensure the API key is set up correctly.");
  }

  try {
    console.log(`Sending request to Gemini API. Model: ${GEMINI_MODEL_NAME}, Prompt: "${promptText.substring(0, 50)}..."`);

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg', 
        data: base64ImageData,
      },
    };
    const textPart = { text: promptText };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
    });
    
    const description = response.text;
    if (typeof description !== 'string') {
        console.error("Unexpected response structure from Gemini API:", response);
        throw new Error("Received an unexpected response structure from the AI service.");
    }
    return description;

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message) {
         throw new Error(`Gemini API Error: ${error.message}`);
    } else if (error.toString) {
        throw new Error(`Gemini API Error: ${error.toString()}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI service.");
  }
};

export const getPredictiveMaintenanceInsights = async (
  workHistory: MaintenanceRecord[]
): Promise<PredictiveMaintenanceResult> => {
    if (!apiKeyAvailable || !ai) {
        throw new Error("AI service is not configured.");
    }
    if (workHistory.length === 0) {
        throw new Error("No work history available to analyze.");
    }

    const formattedHistory = workHistory.map(r => 
        `Date: ${r.serviceDate}, Issue: ${r.issueDescription}, Actions: ${r.repairActions || 'N/A'}`
    ).join('\n');

    const prompt = `
        Analyze the following maintenance log for a machine. Identify recurring issues, failure patterns, and the average time between failures for specific components. Based on this data, predict which component is most likely to fail next and suggest a preventative maintenance schedule. 
        
        Return the output as a single, minified JSON object with no markdown formatting. The JSON object should have three keys: "component" (string), "predicted_failure_date" (string, in format "YYYY-MM-DD"), and "recommendation" (string, a concise action to take).

        Maintenance Log:
        ${formattedHistory}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const result = parseJsonFromMarkdown<PredictiveMaintenanceResult>(response.text);
        if (!result || !result.component || !result.predicted_failure_date || !result.recommendation) {
            throw new Error("AI response was not in the expected format.");
        }
        return result;

    } catch (error: any) {
        console.error("Error getting predictive maintenance insights:", error);
        throw new Error(`Failed to get predictive insights from AI: ${error.message}`);
    }
};

export const draftWorkOrderFromReport = async (
    issueDescription: string,
    photoBase64?: string
): Promise<DraftedWorkOrder> => {
    if (!apiKeyAvailable || !ai) {
        throw new Error("AI service is not configured.");
    }

    const prompt = `
        Based on this user's issue report and optional photo, generate a structured work order draft. 
        Include a concise title, a recommended priority level ('High', 'Medium', or 'Low'), a list of likely procedural tasks to resolve the issue, and a list of potentially required parts.

        Return the output as a single, minified JSON object with no markdown formatting. The JSON object should have four keys: "title" (string), "priority" (string: 'High', 'Medium', or 'Low'), "tasks" (array of strings), and "parts" (array of strings).

        Issue Description: "${issueDescription}"
    `;
    
    const contentParts: any[] = [{ text: prompt }];
    if (photoBase64) {
        contentParts.push({
            inlineData: { mimeType: 'image/jpeg', data: photoBase64 }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: { parts: contentParts },
            config: { responseMimeType: "application/json" }
        });

        const result = parseJsonFromMarkdown<DraftedWorkOrder>(response.text);
        if (!result || !result.title || !result.priority || !Array.isArray(result.tasks) || !Array.isArray(result.parts)) {
            throw new Error("AI response for work order draft was not in the expected format.");
        }
        return result;

    } catch (error: any) {
        console.error("Error drafting work order:", error);
        throw new Error(`Failed to draft work order from AI: ${error.message}`);
    }
};

export const getWorkRequestAnalysis = async (
  machine: { make: string; modelName: string },
  workRequest: { title: string; description?: string }
): Promise<WorkRequestAnalysisResult> => {
    if (!apiKeyAvailable || !ai) {
        throw new Error("AI service is not configured.");
    }
    
    const prompt = `
        Act as an expert repair technician for industrial machinery.
        A work request has been submitted for a "${machine.make} ${machine.modelName}" machine.
        
        Work Request Title: "${workRequest.title}"
        Work Request Description: "${workRequest.description || 'No description provided.'}"

        Based on this information, provide a likely cause for the issue and a concise, step-by-step repair plan.
        Return the output as a single, minified JSON object with no markdown formatting.
        The JSON object must have two keys:
        1. "likelyCause" (string): A brief explanation of the probable root cause.
        2. "suggestedSteps" (array of strings): A list of clear, actionable steps to diagnose and repair the issue.

        Example JSON:
        {"likelyCause": "The primary drive belt has likely snapped or is excessively worn, causing a loss of power transmission.", "suggestedSteps": ["Perform a full Lock-out/Tag-out procedure on the machine.", "Open the main access panel to the drive assembly.", "Visually inspect the drive belt for breaks, cracks, or severe wear.", "If the belt is broken, remove the remnants and install a new, correctly tensioned belt.", "If the belt is intact, check for proper tension and adjust as per manufacturer specifications.", "Rotate the assembly by hand to ensure smooth movement before restoring power."]}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const result = parseJsonFromMarkdown<WorkRequestAnalysisResult>(response.text);
        if (!result || !result.likelyCause || !Array.isArray(result.suggestedSteps)) {
            throw new Error("AI response was not in the expected format for work request analysis.");
        }
        return result;

    } catch (error: any) {
        console.error("Error getting work request analysis:", error);
        throw new Error(`Failed to get work request analysis from AI: ${error.message}`);
    }
};

export const scrapeManualLinks = async (make: string, modelName: string): Promise<string[]> => {
  // This function now calls our own backend instead of having the client do it.
  const response = await fetch('/api/scrape-manuals', { // This relative URL assumes the dev server proxies requests to the backend.
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ make, modelName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "An unknown server error occurred." }));
    throw new Error(errorData.error || `Failed to fetch manuals from server.`);
  }

  const data = await response.json();
  return data.urls;
};