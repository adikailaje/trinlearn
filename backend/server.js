require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// --- Database Setup ---
const DATA_DIR = path.join(__dirname, '_data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'db-seed.json');

let db = {};

const readDb = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    db = JSON.parse(data);
  } catch (error) {
    console.error("Could not read database file. Attempting to seed.", error);
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const seedData = await fs.readFile(SEED_PATH, 'utf-8');
        db = JSON.parse(seedData);
        await writeDb();
        console.log("Database seeded successfully.");
    } catch (seedError) {
        console.error("CRITICAL: Failed to create or seed database.", seedError);
        process.exit(1);
    }
  }
};

const writeDb = async () => {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch (error) {
        console.error("CRITICAL: Failed to write to database.", error);
    }
};

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- AI Setup ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let geminiAI;

if (GEMINI_API_KEY) {
  try {
    geminiAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log("Backend: GoogleGenAI SDK for Gemini initialized successfully.");
  } catch (e) {
    console.error("Backend: CRITICAL ERROR - Failed to initialize GoogleGenAI SDK for Gemini. AI features will be disabled. Error:", e.message);
    geminiAI = null;
  }
} else {
  console.warn("Backend: GEMINI_API_KEY not found in .env file. Gemini AI features will be disabled.");
  geminiAI = null;
}

const parseJsonFromMarkdown = (text) => {
    try {
        let jsonStr = text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON response on backend:", e, "Original text:", text);
        return null;
    }
};

// --- API Routes ---

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// My Work API
app.get('/api/my-work/:userId', (req, res) => {
  const { userId } = req.params;
  const userWorkItems = db.workItems.filter(item => item.assignedToUserId === userId);
  res.status(200).json(userWorkItems);
});

app.get('/api/my-work/:userId/:itemId', (req, res) => {
    const { userId, itemId } = req.params;
    const item = db.workItems.find(wi => wi.id === itemId && wi.assignedToUserId === userId);
    if(item) {
        res.status(200).json(item);
    } else {
        res.status(404).json({ message: "Work item not found." });
    }
});

app.post('/api/work-items/:itemId/start', async (req, res) => {
    const { itemId } = req.params;
    const itemIndex = db.workItems.findIndex(wi => wi.id === itemId);
    if (itemIndex > -1) {
        db.workItems[itemIndex].status = "In Progress";
        db.workItems[itemIndex].startTime = new Date().toISOString();
        db.workItems[itemIndex].pauseTime = undefined;
        await writeDb();
        res.status(200).json(db.workItems[itemIndex]);
    } else {
        res.status(404).json({ message: "Work item not found." });
    }
});

app.post('/api/work-items/:itemId/pause', async (req, res) => {
    const { itemId } = req.params;
    const { pause } = req.body;
    const itemIndex = db.workItems.findIndex(wi => wi.id === itemId);
    if (itemIndex > -1) {
        db.workItems[itemIndex].status = pause ? "Paused" : "In Progress";
        db.workItems[itemIndex].pauseTime = pause ? new Date().toISOString() : undefined;
        await writeDb();
        res.status(200).json(db.workItems[itemIndex]);
    } else {
        res.status(404).json({ message: "Work item not found." });
    }
});

app.post('/api/work-items/:itemId/tasks/:taskId', async (req, res) => {
    const { itemId, taskId } = req.params;
    const { completed } = req.body;
    const itemIndex = db.workItems.findIndex(wi => wi.id === itemId);
    if (itemIndex > -1 && db.workItems[itemIndex].tasks) {
        const taskIndex = db.workItems[itemIndex].tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            db.workItems[itemIndex].tasks[taskIndex].completed = completed;
            await writeDb();
            res.status(200).json(db.workItems[itemIndex]);
            return;
        }
    }
    res.status(404).json({ message: "Task or work item not found." });
});

app.post('/api/work-items/:itemId/complete', async (req, res) => {
    const { itemId } = req.params;
    const { notes, signatureDataUrl } = req.body;
    const itemIndex = db.workItems.findIndex(wi => wi.id === itemId);
    if (itemIndex > -1) {
        const allTasksDone = db.workItems[itemIndex].tasks?.every(task => task.completed) ?? true;
        if (!allTasksDone) {
            return res.status(400).json({ message: "All tasks must be completed first." });
        }
        db.workItems[itemIndex].status = "Completed";
        db.workItems[itemIndex].completionNotes = notes;
        db.workItems[itemIndex].signatureDataUrl = signatureDataUrl;
        db.workItems[itemIndex].completionTime = new Date().toISOString();
        await writeDb();
        res.status(200).json(db.workItems[itemIndex]);
    } else {
        res.status(404).json({ message: "Work item not found." });
    }
});

// Safety Permits API
app.get('/api/safety/permits/:userId', (req, res) => {
    const { userId } = req.params;
    if (!db.safetyPermits[userId]) {
        db.safetyPermits[userId] = db.safetyPermits["seed_user"].map(p => ({
            ...p,
            id: p.id.replace("seed_user", userId),
            assignedToUserId: userId
        }));
    }
    res.status(200).json(db.safetyPermits[userId]);
});

app.get('/api/safety/permits/:userId/:permitId', (req, res) => {
    const { userId, permitId } = req.params;
    const userPermits = db.safetyPermits[userId] || [];
    const permit = userPermits.find(p => p.id === permitId);
    if (permit) {
        res.status(200).json(permit);
    } else {
        res.status(404).json({ message: "Permit not found." });
    }
});

app.post('/api/safety/permits/:permitId/acknowledge', async (req, res) => {
    const { permitId } = req.params;
    const { userId, signatureDataUrl } = req.body;
    
    const userPermits = db.safetyPermits[userId];
    if (!userPermits) {
        return res.status(404).json({ message: "User permits not found." });
    }
    const permitIndex = userPermits.findIndex(p => p.id === permitId);
    if (permitIndex > -1) {
        userPermits[permitIndex].status = "Acknowledged";
        userPermits[permitIndex].acknowledgementSignatureDataUrl = signatureDataUrl;
        userPermits[permitIndex].acknowledgedDate = new Date().toISOString();
        await writeDb();
        res.status(200).json(userPermits[permitIndex]);
    } else {
        res.status(404).json({ message: "Permit not found." });
    }
});


// --- Gemini API Proxies ---

// Proxy for generateDescriptionFromFrame
app.post('/api/analyze-frame', async (req, res) => {
  if (!geminiAI) return res.status(503).json({ error: 'AI service not available' });
  try {
    const { base64ImageData, promptText, modelName } = req.body;
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64ImageData }};
    const textPart = { text: promptText };
    
    const response = await geminiAI.models.generateContent({ 
        model: modelName, 
        contents: { parts: [imagePart, textPart] }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Backend /api/analyze-frame Error:", error);
    res.status(500).json({ error: error.message || 'Failed to analyze frame with AI' });
  }
});

// Proxy for getPredictiveMaintenanceInsights
app.post('/api/predictive-maintenance', async (req, res) => {
    if (!geminiAI) return res.status(503).json({ error: "AI service not available" });
    try {
        const { workHistory } = req.body;
        if (!workHistory || workHistory.length === 0) {
            return res.status(400).json({ error: "No work history provided." });
        }
        const formattedHistory = workHistory.map(r => `Date: ${r.serviceDate}, Issue: ${r.issueDescription}, Actions: ${r.repairActions || 'N/A'}`).join('\n');
        const prompt = `Analyze the following maintenance log for a machine. Identify recurring issues, failure patterns, and the average time between failures for specific components. Based on this data, predict which component is most likely to fail next and suggest a preventative maintenance schedule. Return the output as a single, minified JSON object with no markdown formatting. The JSON object should have three keys: "component" (string), "predicted_failure_date" (string, in format "YYYY-MM-DD"), and "recommendation" (string, a concise action to take).\n\nMaintenance Log:\n${formattedHistory}`;
        
        const response = await geminiAI.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        res.json(parseJsonFromMarkdown(response.text));
    } catch (error) {
        console.error("Backend /api/predictive-maintenance Error:", error);
        res.status(500).json({ error: error.message || 'Failed to get predictive insights' });
    }
});

// Proxy for draftWorkOrderFromReport
app.post('/api/draft-work-order', async (req, res) => {
    if (!geminiAI) return res.status(503).json({ error: "AI service not available" });
    try {
        const { issueDescription, photoBase64 } = req.body;
        const prompt = `Based on this user's issue report and optional photo, generate a structured work order draft. Include a concise title, a recommended priority level ('High', 'Medium', or 'Low'), a list of likely procedural tasks to resolve the issue, and a list of potentially required parts. Return the output as a single, minified JSON object with no markdown formatting. The JSON object should have four keys: "title" (string), "priority" (string: 'High', 'Medium', or 'Low'), "tasks" (array of strings), and "parts" (array of strings).\n\nIssue Description: "${issueDescription}"`;
        
        const contentParts = [{ text: prompt }];
        if (photoBase64) {
            contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: photoBase64 } });
        }
        
        const response = await geminiAI.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: { parts: contentParts },
            config: { responseMimeType: "application/json" }
        });

        res.json(parseJsonFromMarkdown(response.text));
    } catch (error) {
        console.error("Backend /api/draft-work-order Error:", error);
        res.status(500).json({ error: error.message || 'Failed to draft work order' });
    }
});

// Proxy for getWorkRequestAnalysis
app.post('/api/analyze-work-request', async (req, res) => {
    if (!geminiAI) return res.status(503).json({ error: "AI service not available" });
    try {
        const { machine, workRequest } = req.body;
        const prompt = `Act as an expert repair technician for industrial machinery. A work request has been submitted for a "${machine.make} ${machine.modelName}" machine.\n\nWork Request Title: "${workRequest.title}"\nWork Request Description: "${workRequest.description || 'No description provided.'}"\n\nBased on this information, provide a likely cause for the issue and a concise, step-by-step repair plan. Return the output as a single, minified JSON object with no markdown formatting. The JSON object must have two keys:\n1. "likelyCause" (string): A brief explanation of the probable root cause.\n2. "suggestedSteps" (array of strings): A list of clear, actionable steps to diagnose and repair the issue.`;
        
        const response = await geminiAI.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        res.json(parseJsonFromMarkdown(response.text));
    } catch (error) {
        console.error("Backend /api/analyze-work-request Error:", error);
        res.status(500).json({ error: error.message || 'Failed to analyze work request' });
    }
});

// Proxy for scrapeManualLinks
app.post('/api/scrape-manuals', async (req, res) => {
  const { make, modelName } = req.body;
  if (!make || !modelName) return res.status(400).json({ error: 'Missing make and modelName' });
  const query = `filetype:pdf "${modelName}" "${make}" official manual support OR user guide OR service manual`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us`;
  try {
    const { data } = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }});
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((i, element) => {
      let href = $(element).attr('href');
      if (href && href.startsWith('/url?q=')) {
          const urlObj = new URL(href, `https://www.google.com`);
          const actualUrl = urlObj.searchParams.get('q');
          if (actualUrl && actualUrl.startsWith('http')) links.push(actualUrl);
      }
    });
    res.json({ urls: [...new Set(links)].slice(0, 10) });
  } catch (error) {
    console.error("Backend /api/scrape-manuals Error:", error);
    res.status(500).json({ error: 'Failed to scrape for manuals.' });
  }
});


// --- Server and WebSocket Initialization ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live-voice' });

wss.on('connection', (ws) => {
  // ... existing WebSocket implementation
});

// Initialize DB and start server
readDb().then(() => {
    server.listen(PORT, () => {
      console.log(`Backend server with WebSocket running on http://localhost:${PORT}`);
    });
});
