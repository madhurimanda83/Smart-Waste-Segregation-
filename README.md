# EcoSort — Smart Waste Segregation & Recycling Experience

An AI-powered municipal waste segregation and recycling web application powered by **Google Gemini 2.5 Flash** multi-modal vision.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Your Google Gemini API Key
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open the `.env` file in the root directory.
3. Paste your Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...your_actual_gemini_api_key_here
PORT=3000
```
*(Note: If you run the app without an API key, the system automatically uses demo fallback data so you can test and present without errors).*

### 3. Start the Server
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧠 How the AI Classification Works

1. **Upload or Capture**: The user uploads an image (drag & drop, file browse, preset chips, or webcam snap).
2. **Click "Run AI Classification"**: The frontend sends the image to `POST /api/classify`.
3. **Backend Processing**:
   - The Express backend resolves the image (Base64 Data URL, local file, or remote URL).
   - If `GEMINI_API_KEY` is present in `.env`, the backend calls `gemini-2.5-flash` (with automatic fallback to `gemini-1.5-flash`) using Google's Generative Language REST API.
   - The AI identifies the item, material composition, bin classification, prep instructions, and carbon impact metrics in structured JSON.
   - If `GEMINI_API_KEY` is not yet configured, the server provides demo segregation data so the application is always demo-ready.
4. **Rich Results Display**: The frontend displays the bin color, category badge, prep steps, decomposition time, and CO₂ savings metrics.

---

## 🛠️ Tech Stack
- **Frontend**: Vanilla HTML5, Modern CSS Design System, JavaScript (ES6+), Lucide Icons
- **Backend**: Node.js, Express.js, native `fetch`
- **AI Model**: Google Gemini 2.5 Flash (`gemini-2.5-flash`) / Gemini 1.5 Flash (`gemini-1.5-flash`)
