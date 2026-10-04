# EcoSort — Smart Waste Segregation & Circular Recycling Experience

EcoSort is a hackathon MVP designed to guide users from initial waste identification to verified circular recycling and rewards.

---

## 🔄 Core User Journey

```
Register / Login
       ↓
Scan / Identify Waste Item
       ↓
Get Preparation & Disposal Guidance
       ↓
Request Doorstep Collection / Curbside Pickup
       ↓
Track Waste Journey Stages (Collection → Sorting → Recycling)
       ↓
Facility Outcome Verification
       ↓
Earn Verified EcoPoints
       ↓
Redeem Rewards Vouchers
       ↓
Monitor Environmental Activity on Personal Dashboard
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env`)
Create or edit the `.env` file in the project root:
```env
# Server Port (Default is 3000)
PORT=3000

# Google Gemini Flash API Key (Optional)
# If omitted or left as default, EcoSort automatically uses clearly labeled demo classification logic.
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Signing Secret (Defaults to secure fallback in dev)
JWT_SECRET=ecosort_super_secret_jwt_key_2026
```

---

## 🏃 Running the Application

### Default Port (3000)
```bash
# Standard production mode
npm start

# Development mode with hot auto-reload
npm run dev
```
Open your browser at: **`http://localhost:3000`**

### Running on a Different Port (if Port 3000 is Occupied)
The server port is configurable via `process.env.PORT` with 3000 as default. If port 3000 is already in use by another process on your machine, you can run EcoSort on another port (such as 3001 or 8080) without interfering with the existing process:

- **Windows PowerShell:**
  ```powershell
  $env:PORT=3001; npm run dev
  ```
- **Windows Command Prompt (cmd):**
  ```cmd
  set PORT=3001 && npm run dev
  ```
- **macOS / Linux / bash:**
  ```bash
  PORT=3001 npm run dev
  ```
- **Via `.env` file:**
  Simply change `PORT=3001` in your `.env` file and execute `npm run dev`.

---

## 🗄️ Database Architecture & Initialization

EcoSort utilizes a lightweight, zero-dependency, file-persisted relational store located at:
`data/ecosort.db.json`

### Key Features
- **Automatic Initialization**: On first server startup, the database automatically boots and seeds default waste categories, recovery facilities, collection vehicles, gamification badges, and municipal collection schedules.
- **Relational Integrity**: Foreign keys link `Users` → `WasteScans` → `WasteJourneys` → `CollectionRequests` → `Facilities` → `Verifications` → `EcoPointTransactions` → `Badges` → `RewardRedemptions`.
- **Anti-Fraud Security**:
  - Passwords hashed with `bcryptjs` (hashes are never returned in responses).
  - Authenticated identity (`req.user`) extracted directly from verified JWTs (never trusts user-supplied `userId`).
  - User resource ownership checks enforced on all journey updates and profile endpoints.
  - Duplicate EcoPoints prevention: each journey action can only be awarded once.
  - Negative balance prevention: reward redemptions strictly validate current points before deduction.

---

## 📡 API Endpoints Reference

All API endpoints are mounted under `/api/*`:

| Domain | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Status** | `GET` | `/api/status` | No | Server health and Gemini AI status |
| **Auth** | `POST` | `/api/auth/register` | No | Register new user account |
| **Auth** | `POST` | `/api/auth/login` | No | Login and receive Bearer JWT |
| **Auth** | `POST` | `/api/auth/logout` | No | Log out session |
| **Auth** | `GET` | `/api/auth/me` | **Yes** | Verify authenticated identity |
| **Profile** | `GET` | `/api/users/me` | **Yes** | Get user profile & stats |
| **Profile** | `PUT` | `/api/users/me` | **Yes** | Update personal profile details |
| **Waste Scans** | `POST` | `/api/waste/analyze` | Optional | Analyze discarded item & get guidance |
| **Waste Scans** | `GET` | `/api/waste/history` | **Yes** | User scan history |
| **Categories** | `GET` | `/api/categories` | No | List waste categories & guidance |
| **Categories** | `GET` | `/api/categories/:category`| No | Guidelines for specific stream |
| **Journeys** | `POST` | `/api/journeys` | **Yes** | Start waste tracking journey |
| **Journeys** | `GET` | `/api/journeys` | **Yes** | User's active & past journeys |
| **Journeys** | `GET` | `/api/journeys/:id` | **Yes** | Full journey details with status history |
| **Journeys** | `PUT` | `/api/journeys/:id/status`| **Yes** | Advance journey stage with notes |
| **Journeys** | `GET` | `/api/journeys/:id/tracking`| **Yes** | Route stages & vehicle telematics |
| **Journeys** | `POST` | `/api/journeys/:id/verify`| **Yes** | Facility verification & award +50 pts |
| **Collections** | `POST` | `/api/collections/request`| **Yes** | Request doorstep curbside collection |
| **Vehicles** | `GET` | `/api/vehicles` | No | List collection fleet |
| **Facilities** | `GET` | `/api/facilities` | No | List recovery & recycling facilities |
| **EcoPoints** | `GET` | `/api/points/balance` | **Yes** | Wallet balance & recent transactions |
| **EcoPoints** | `GET` | `/api/points/history` | **Yes** | Full audit transaction ledger |
| **EcoPoints** | `GET` | `/api/points/rules` | No | Point matrix rules |
| **Badges** | `GET` | `/api/badges` | **Yes** | Activity badges earned & locked |
| **Rewards** | `GET` | `/api/rewards` | No/Yes | Catalog of vouchers |
| **Rewards** | `POST` | `/api/rewards/:id/redeem`| **Yes** | Redeem reward voucher |
| **Rewards** | `GET` | `/api/rewards/history` | **Yes** | User redemption claim codes |
| **Dashboard** | `GET` | `/api/dashboard` | **Yes** | Aggregated dashboard in 1 request |
| **Schedules** | `GET` | `/api/schedules` | No | Municipal collection timetables |
| **Notifications**| `GET` | `/api/notifications` | **Yes** | User milestone notifications |
| **Notifications**| `PUT` | `/api/notifications/:id/read`| **Yes**| Mark notification as read |

*(For full JSON schemas, payloads, and error codes, refer to [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)).*

---

## 🧪 Running the Verification Test Suite

A comprehensive automated test suite is included to verify all 19 backend requirements:
```bash
node backend/test_api_suite.js
```
The test suite validates:
1. Registration with password hashing & login token issuance
2. Authenticated user profile retrieval & update
3. Multi-stream waste categories (`RECYCLABLE`, `ORGANIC`, `HAZARDOUS`, `E_WASTE`, `GENERAL`, `REUSABLE`)
4. Waste analysis returning item name, bin recommendation, and preparation steps
5. **EcoPoints withholding**: Points are **not** awarded prematurely upon image scan
6. Creation of waste journeys and collection requests
7. Step-by-step journey stage progression and status history logging
8. Destination facility verification and awarding of +50 EcoPoints
9. **Anti-duplicate rewards check**: Verifying the same journey twice awards 0 additional points
10. **Negative balance check**: Attempting to redeem rewards without sufficient points returns `400 Bad Request`
11. Single-call aggregated user dashboard

---

## ⚠️ Prototype & Demo Notice

For hackathon presentation purposes:
- **AI Classification**: If `GEMINI_API_KEY` is provided, live Google Gemini Flash computer vision is active. If absent, clearly labeled rule-based demo classification is used.
- **GPS Tracking**: Vehicle telematics, route coordinates, and ETA feeds are simulated prototype data ready for production municipal IoT sensors.
- **Municipal Schedules & Facilities**: Timetables and facility profiles are demo municipal models designed to demonstrate open-data integration.
