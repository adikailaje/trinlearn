# TRIN Factory Worker App - Local Development Setup

This document outlines how to set up and run the TRIN application locally for development and offline demos. The project is structured as a monorepo with a React frontend and a Node.js backend.

## Prerequisites

- Node.js (v18 or later recommended)
- npm (usually comes with Node.js)

## 1. Backend Setup

The backend server handles API requests and communication with the Gemini AI.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create Environment File:**
    Create a file named `.env` inside the `backend` directory. This file will store your Gemini API key.
    ```
    touch .env
    ```

4.  **Add API Key:**
    Open the `.env` file and add your API key in the following format:
    ```
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

5.  **Start the Backend Server:**
    ```bash
    npm start
    ```
    The backend server will start on `http://localhost:5000` by default.

## 2. Frontend Setup

The frontend is a React application built with Vite.

1.  **Navigate to the frontend directory:**
    From the root of the project, run:
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Frontend Dev Server:**
    ```bash
    npm run dev
    ```
    This will start the frontend application. It will automatically open in your browser, typically at `http://localhost:5173`.

## How It Works

- The frontend application runs on its own development server (Vite).
- The backend Express server runs on `localhost:5000`.
- To avoid CORS issues and to keep the Gemini API key secure, the frontend dev server is configured to **proxy** any API requests starting with `/api` to the backend server.
- All communication with the Gemini AI is now handled exclusively by the backend. The frontend never directly uses the API key.
