require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.BACKEND_PORT || 5002;

// Middleware
app.use(cors()); // Enable CORS for all routes (configure specific origins for production)
app.use(express.json({ limit: '10mb' })); // To parse JSON request bodies, limit for base64 image data

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
  console.error("GEMINI_API_KEY not found in .env file. Backend AI service will not work.");
}

// API endpoint to analyze frame
app.post('/api/analyze-frame', async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: 'AI service not initialized on backend. API Key might be missing.' });
  }

  const { base64ImageData, promptText, modelName } = req.body;

  if (!base64ImageData || !promptText || !modelName) {
    return res.status(400).json({ error: 'Missing required fields: base64ImageData, promptText, modelName.' });
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg', // Assuming JPEG captures
        data: base64ImageData,
      },
    };
    const textPart = { text: promptText };

    console.log(`Backend: Received request for prompt: "${promptText}" with model: ${modelName}`);

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent([imagePart, textPart]);
    const response = await result.response;
    res.json({ text: response.text() });

  } catch (error) {
    console.error('Backend Gemini API Error:', error);
    if (error.response && error.response.promptFeedback) {
        return res.status(400).json({ 
            error: 'Content blocked due to safety concerns.', 
            details: error.response.promptFeedback 
        });
    }
    res.status(500).json({ error: error.message || 'Error processing request with AI service on backend.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set. AI features will be disabled.");
  }
});
