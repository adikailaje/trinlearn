// No longer imports GoogleGenAI directly for client-side use for these functions
import { GEMINI_MODEL_NAME } from '../constants';

// The backend server will be running on a port, e.g., 5000 (configurable)
// Ensure this matches your backend server's address and port.
const BACKEND_API_URL = 'http://localhost:5002/api'; // Example backend URL

export const generateDescriptionFromFrame = async (
  base64ImageData: string, // Pure base64 string, not data URL
  promptText: string
): Promise<string> => {
  try {
    console.log(`Sending request to backend for prompt: "${promptText}" with model: ${GEMINI_MODEL_NAME}`);
    const response = await fetch(`${BACKEND_API_URL}/analyze-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64ImageData,
        promptText,
        modelName: GEMINI_MODEL_NAME, // Send the model name to the backend
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from backend.' }));
      throw new Error(errorData.error || `Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) { // Handle application-level errors returned by the backend
        throw new Error(data.error);
    }
    // Assuming backend returns { description: "..." } or similar
    // The previous implementation returned response.text directly from Gemini,
    // so the backend should ideally wrap this in a 'description' field or the frontend needs to expect raw text.
    // For now, let's assume backend sends { description: "..." }
    // Or if backend sends { text: "..." } to match Gemini SDK, use data.text
    if (typeof data.description === 'string') {
        return data.description;
    } else if (typeof data.text === 'string') { // If backend mirrors Gemini's raw response field
        return data.text;
    } else {
        // Fallback or specific handling if the backend structure is different
        // If the backend directly returns the string:
        // const textResponse = await response.text();
        // return textResponse;
        // For now, expecting a JSON structure.
        console.error("Unexpected response structure from backend:", data);
        throw new Error("Unexpected response structure from backend.");
    }

  } catch (error) {
    console.error("Error communicating with backend AI service:", error);
    if (error instanceof Error) {
      // Avoid prefixing "AI Service Error" if it's already a backend error message
      if (error.message.startsWith("Backend error:") || error.message.startsWith("AI service not initialized on backend")) {
        throw error;
      }
      throw new Error(`Frontend-Backend Comms Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the backend AI service.");
  }
};
