# EcoSort Backend API Documentation

Welcome to the **EcoSort REST API Documentation**. This reference guide is prepared specifically for frontend developers and client integrations to connect seamlessly with the EcoSort Smart Waste Segregation & Circular Economy platform.

---

## Base URL & Configuration

| Environment | Base URL |
| :--- | :--- |
| **Local Development** | `http://localhost:3000/api` |
| **Status & Health** | `http://localhost:3000/api/status` |

---

## Authentication & Headers

EcoSort uses **Bearer JWT Authentication**.
Once registered or logged in, include the token in the `Authorization` header for all protected endpoints:

```http
Authorization: Bearer <your_jwt_token_here>
Content-Type: application/json
```

---

## Standard Response Envelopes

### Success Response
```json
{
  "success": true,
  "...data": "payload"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable error description",
  "details": "Optional diagnostic information"
}
```

---

## Summary of All API Endpoints

| Category | Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :---: | :--- |
| **System** | `GET` | `/api/status` | No | Server health check & Gemini AI status |
| **Auth** | `POST` | `/api/auth/register` | No | Register new user account |
| **Auth** | `POST` | `/api/auth/login` | No | Authenticate user & issue JWT |
| **Auth** | `POST` | `/api/auth/logout` | No | Invalidate client session/token |
| **Auth** | `GET` | `/api/auth/me` | **Yes** | Get authenticated user info |
| **Users** | `GET` | `/api/users/me` | **Yes** | Fetch current user profile & stats |
| **Users** | `PUT` | `/api/users/me` | **Yes** | Update personal profile details |
| **Waste Scans** | `POST` | `/api/waste/analyze` | Optional | Analyze discarded item (AI Vision / text) |
| **Waste Scans** | `GET` | `/api/waste/history` | **Yes** | Scan history of the authenticated user |
| **Categories** | `GET` | `/api/categories` | No | List all supported waste categories |
| **Categories** | `GET` | `/api/categories/:category` | No | Specific category disposal guidelines |
| **Journeys** | `POST` | `/api/journeys` | **Yes** | Initialize new waste tracking journey |
| **Journeys** | `GET` | `/api/journeys` | **Yes** | List user's active & completed journeys |
| **Journeys** | `GET` | `/api/journeys/:id` | **Yes** | Get detailed status of a journey |
| **Journeys** | `PUT` | `/api/journeys/:id/status` | **Yes** | Progress journey to next lifecycle stage |
| **Journeys** | `GET` | `/api/journeys/:id/tracking` | **Yes** | Real-time vehicle telematics & route stages |
| **Journeys** | `POST` | `/api/journeys/:id/verify` | **Yes** | Facility verification & award EcoPoints |
| **Collections** | `POST` | `/api/collections/request` | **Yes** | Schedule doorstep waste/reuse pickup |
| **Vehicles** | `GET` | `/api/vehicles` | No | List municipal collection EV fleet |
| **Vehicles** | `GET` | `/api/vehicles/:id` | No | Get vehicle location and assigned journey |
| **Facilities** | `GET` | `/api/facilities` | No | List certified MRFs & recycling centers |
| **Facilities** | `GET` | `/api/facilities/:id` | No | Get specific facility details |
| **EcoPoints** | `GET` | `/api/points/balance` | **Yes** | View current EcoPoints balance & wallet |
| **EcoPoints** | `GET` | `/api/points/history` | **Yes** | Audit ledger of all earned & spent points |
| **EcoPoints** | `GET` | `/api/points/rules` | No | Point rewards matrix and criteria |
| **Badges** | `GET` | `/api/badges` | **Yes** | Badges earned, locked, and next milestone |
| **Rewards** | `GET` | `/api/rewards` | No/Yes | Catalog of redeemable vouchers & items |
| **Rewards** | `POST` | `/api/rewards/:id/redeem` | **Yes** | Redeem reward voucher with points |
| **Rewards** | `GET` | `/api/rewards/history` | **Yes** | List of claimed voucher codes |
| **Dashboard** | `GET` | `/api/dashboard` | **Yes** | Aggregated dashboard data in 1 request |
| **Schedules** | `GET` | `/api/schedules` | No | Municipal collection days by zone |
| **Notifications** | `GET` | `/api/notifications` | **Yes** | User notification stream |
| **Notifications** | `PUT` | `/api/notifications/:id/read`| **Yes** | Mark individual notification as read |
| **Notifications** | `PUT` | `/api/notifications/read-all`| **Yes** | Mark all notifications as read |

---

## 1. Authentication APIs

### 1.1 Register User
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Authentication:** None
- **Request Body:**
```json
{
  "fullName": "Ananya Sharma",
  "mobileNumber": "9876543210",
  "location": "Jubilee Hills, Hyderabad",
  "email": "ananya@example.com",
  "password": "StrongPassword123!"
}
```
*(Note: `email` is optional. Passwords are encrypted with `bcryptjs` before storage).*

- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr_1791039125107_5jyprq",
    "fullName": "Ananya Sharma",
    "mobileNumber": "9876543210",
    "email": "ananya@example.com",
    "location": "Jubilee Hills, Hyderabad",
    "ecoPoints": 0,
    "currentStreak": 1,
    "createdAt": "2026-10-03T14:52:05.107Z",
    "updatedAt": "2026-10-03T14:52:05.107Z"
  }
}
```
- **Possible Errors:**
  - `400 Bad Request`: Missing mandatory fields (`fullName`, `mobileNumber`, `location`, `password`).
  - `409 Conflict`: Phone number or email already registered.

---

### 1.2 User Login
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Authentication:** None
- **Request Body:**
```json
{
  "identifier": "9876543210",
  "password": "StrongPassword123!"
}
```
*(You can pass either `mobileNumber` or `email` as `identifier`).*

- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr_1791039125107_5jyprq",
    "fullName": "Ananya Sharma",
    "mobileNumber": "9876543210",
    "email": "ananya@example.com",
    "location": "Jubilee Hills, Hyderabad",
    "ecoPoints": 55,
    "currentStreak": 1
  }
}
```
- **Possible Errors:**
  - `400 Bad Request`: Missing identifier or password.
  - `401 Unauthorized`: Invalid credentials.

---

### 1.3 Logout
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Authentication:** Optional
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.4 Get Current User (Auth Check)
- **Method:** `GET`
- **Endpoint:** `/api/auth/me`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "user": {
    "id": "usr_1791039125107_5jyprq",
    "fullName": "Ananya Sharma",
    "mobileNumber": "9876543210",
    "email": "ananya@example.com",
    "location": "Jubilee Hills, Hyderabad",
    "ecoPoints": 55,
    "currentStreak": 1
  }
}
```
- **Possible Errors:**
  - `401 Unauthorized`: Missing or invalid Bearer token.

---

## 2. User Profile APIs

### 2.1 Get Profile
- **Method:** `GET`
- **Endpoint:** `/api/users/me`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):** Returns user profile with scan count, journey count, and badges count.

### 2.2 Update Profile
- **Method:** `PUT`
- **Endpoint:** `/api/users/me`
- **Authentication:** Bearer Token
- **Request Body:**
```json
{
  "fullName": "Ananya Sharma",
  "location": "Madhapur Cybercity, Hyderabad",
  "email": "ananya.new@example.com",
  "mobileNumber": "9876543210"
}
```
- **Success Response (`200 OK`):** Returns updated user profile.

---

## 3. Waste Analysis & Scans

### 3.1 Analyze Discarded Item
- **Method:** `POST`
- **Endpoint:** `/api/waste/analyze`
- **Authentication:** Optional (if authenticated, scan is automatically saved to user's history and awards +5 EcoPoints).
- **Request Body (Option A - Image Upload):**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg"
}
```
*(Also accepts local relative file path like `assets/plastic_bottle.jpg` or remote web URL).*

- **Request Body (Option B - Text Search / Keyword):**
```json
{
  "itemName": "Clean PET Plastic Bottle"
}
```

- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "itemName": "Clean PET Plastic Bottle",
  "category": "RECYCLABLE",
  "confidence": 98.4,
  "recommendedDisposal": "Empty residual liquids completely, rinse lightly, crush bottle, and tightly reattach cap.",
  "recommendedBin": "Blue Recycling Bin",
  "material": "Polyethylene Terephthalate (PET / Resin Code 1)",
  "binColor": "#0284c7",
  "impactHeadline": "Saves 0.08 kWh energy & prevents ~50g CO₂ emissions",
  "steps": [
    "Empty residual liquids",
    "Rinse lightly",
    "Crush to save space",
    "Reattach cap tightly"
  ],
  "model": "gemini-3.8-flash",
  "pointsEarned": 5,
  "scanId": "scan_1791039125107_abc"
}
```

### 3.2 User Scan History
- **Method:** `GET`
- **Endpoint:** `/api/waste/history`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):** Array of historical scans for the authenticated user.

---

## 4. Waste Categories

### 4.1 Get All Categories
- **Method:** `GET`
- **Endpoint:** `/api/categories`
- **Authentication:** None
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "categories": [
    {
      "code": "RECYCLABLE",
      "name": "Recyclable Materials",
      "binName": "Blue Recycling Bin",
      "color": "#0284c7",
      "description": "Clean, dry, rigid plastics, metals, paper, and cardboard.",
      "examples": ["Plastic bottles (#1, #2, #5)", "Aluminum soda cans", "Newspapers & office paper", "Corrugated boxes"],
      "disposalInstructions": "Empty all liquids and food residue before binning. Keep dry and unsoiled.",
      "recyclingInformation": "Processed at Materials Recovery Facilities (MRF), baled, and extruded into secondary pellets."
    },
    { "code": "ORGANIC", "name": "Organic & Compostable", "binName": "Green Compost Bin" },
    { "code": "HAZARDOUS", "name": "Hazardous Waste", "binName": "Special Red Drop / Certified Hazardous Bin" },
    { "code": "E_WASTE", "name": "Electronic Waste", "binName": "Certified E-Waste Drop Depot" },
    { "code": "GENERAL", "name": "General Landfill Waste", "binName": "Black / Grey Waste Bin" },
    { "code": "REUSABLE", "name": "Reusable & Donatable Items", "binName": "Community Reuse Hub" }
  ]
}
```

### 4.2 Get Specific Category
- **Method:** `GET`
- **Endpoint:** `/api/categories/RECYCLABLE`
- **Authentication:** None

---

## 5. Waste Journeys ("From Trash to Impact")

The waste journey tracks items through every stage from initial scan to verified recycling.

### Valid Journey Statuses
1. `IDENTIFIED`
2. `COLLECTION_REQUESTED`
3. `PICKUP_SCHEDULED`
4. `COLLECTED`
5. `IN_TRANSIT`
6. `AT_SORTING_CENTER`
7. `AT_RECYCLING_FACILITY`
8. `RECOVERED`
9. `COMPLETED`
10. `CANCELLED`

*Reusable journeys follow the specialized donation flow:*
`IDENTIFIED` → `MARKED_FOR_REUSE` → `DONATION_REQUESTED` → `PICKUP` → `RECIPIENT_RECEIVED` → `COMPLETED`

---

### 5.1 Create Journey
- **Method:** `POST`
- **Endpoint:** `/api/journeys`
- **Authentication:** Bearer Token
- **Request Body:**
```json
{
  "wasteScanId": "scan_1791039125107_abc",
  "pickupAddress": "Block C, Highrise Apts, Madhapur, Hyderabad",
  "notes": "12 clean PET bottles and flattened cardboard"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "journey": {
    "id": "jrn_1791039125107_def",
    "journeyId": "ES-2026-9002",
    "userId": "usr_1791039125107_5jyprq",
    "itemName": "Clean PET Plastic Bottle",
    "category": "RECYCLABLE",
    "status": "COLLECTION_REQUESTED",
    "pickupAddress": "Block C, Highrise Apts, Madhapur, Hyderabad",
    "destinationName": "EcoSort Materials Recovery Facility (MRF)",
    "vehicleId": "veh_04",
    "createdAt": "2026-10-03T14:52:05.107Z"
  }
}
```

### 5.2 List User Journeys
- **Method:** `GET`
- **Endpoint:** `/api/journeys`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):** Returns only the authenticated user's journeys.

### 5.3 Get Journey by ID
- **Method:** `GET`
- **Endpoint:** `/api/journeys/:id`
- **Authentication:** Bearer Token

### 5.4 Update Journey Status
- **Method:** `PUT`
- **Endpoint:** `/api/journeys/:id/status`
- **Authentication:** Bearer Token
- **Request Body:**
```json
{
  "status": "AT_RECYCLING_FACILITY",
  "note": "Truck unloaded at facility bay 3"
}
```

### 5.5 Journey Tracking & Vehicle Telematics
- **Method:** `GET`
- **Endpoint:** `/api/journeys/:id/tracking`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "journeyId": "ES-2026-9002",
  "status": "IN_TRANSIT",
  "destination": "EcoSort Materials Recovery Facility (MRF)",
  "facilityLocation": "Industrial Greenway, Sector 4",
  "vehicle": {
    "vehicleNumber": "EV-Truck #04",
    "driverName": "Vikram Singh",
    "currentLocation": {
      "address": "HiTech City Junction",
      "lat": 17.4474,
      "lng": 78.3762
    },
    "status": "IN_TRANSIT"
  },
  "tracking": {
    "status": "IN_TRANSIT",
    "currentLocation": { "address": "HiTech City Junction", "lat": 17.4474, "lng": 78.3762 }
  },
  "estimatedArrival": "Today • 3:45 PM",
  "stages": [
    { "key": "IDENTIFIED", "label": "Waste Identified", "completed": true },
    { "key": "PICKUP_SCHEDULED", "label": "Pickup Scheduled", "completed": true },
    { "key": "COLLECTED", "label": "Collected by EV Truck", "completed": true },
    { "key": "IN_TRANSIT", "label": "In Transit to MRF", "completed": true },
    { "key": "AT_RECYCLING_FACILITY", "label": "Arrived at Recycling Plant", "completed": false },
    { "key": "VERIFIED", "label": "Verified & Circularized", "completed": false }
  ]
}
```

### 5.6 Verify Journey & Award EcoPoints
- **Method:** `POST`
- **Endpoint:** `/api/journeys/:id/verify`
- **Authentication:** Bearer Token
- **Request Body:**
```json
{
  "status": "VERIFIED",
  "verificationType": "DESTINATION_RECOVERY",
  "verifiedBy": "Inspector K. Rao, GreenTech Recovery Center",
  "notes": "Verified 100% clean PET plastic baled for circular extrusion."
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Waste journey successfully verified by partner facility",
  "pointsAwarded": 50,
  "newBalance": 55,
  "journey": {
    "id": "jrn_1791039125107_def",
    "status": "COMPLETED",
    "completedAt": "2026-10-03T14:52:10.000Z"
  }
}
```

---

## 6. Collection Scheduling & Municipal Timetables

### 6.1 Request Doorstep Collection
- **Method:** `POST`
- **Endpoint:** `/api/collections/request`
- **Authentication:** Bearer Token
- **Request Body:**
```json
{
  "wasteJourneyId": "jrn_1791039125107_def",
  "pickupLocation": "Block C, Highrise Apts, Madhapur",
  "preferredDate": "2026-10-05",
  "preferredTime": "10:00 AM - 12:00 PM",
  "contactPhone": "9876543210"
}
```
- **Success Response (`201 Created`):** Returns scheduled collection details and assigned electric collection truck.

### 6.2 Municipal Schedules
- **Method:** `GET`
- **Endpoint:** `/api/schedules?location=Madhapur`
- **Authentication:** None
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "total": 5,
  "notice": "Prototype municipal timetable. Connects to real municipal open data schedules in production.",
  "schedules": [
    {
      "id": "sch_zone_a_blue",
      "location": "Zone A — Downtown, Central & University District",
      "wasteCategory": "RECYCLABLE",
      "collectionDay": "Tuesday",
      "collectionTime": "07:30 AM",
      "status": "ACTIVE"
    }
  ]
}
```

---

## 7. EcoPoints & EcoWallet

EcoPoints cannot be forged or arbitrarily altered. Every point update is preserved in an immutable transaction ledger.

### Point Rules
| Action | Points | Trigger Event |
| :--- | :---: | :--- |
| `WASTE_IDENTIFIED` | **+5** | Scanned/identified via AI Vision or Search |
| `DISPOSAL_GUIDANCE_COMPLETED` | **+10** | Completed all preparation checklist steps |
| `COLLECTION_COMPLETED` | **+20** | Collection vehicle completes curbside pickup |
| `RECOVERY_VERIFIED` | **+50** | Partner facility scans and confirms material recovery |
| `REUSE_COMPLETED` | **+50** | Donation recipient receives reusable item |
| `STREAK_BONUS` | **+15** | Daily activity streak milestones |
| `REWARD_REDEMPTION` | **-Points** | Deducted upon claiming partner vouchers |

### 7.1 Wallet Balance
- **Method:** `GET`
- **Endpoint:** `/api/points/balance`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "totalPoints": 55,
  "currentStreak": 1,
  "recentTransactions": [
    {
      "id": "tx_01",
      "action": "RECOVERY_VERIFIED",
      "points": 50,
      "createdAt": "2026-10-03T14:52:10.000Z"
    },
    {
      "id": "tx_02",
      "action": "WASTE_IDENTIFIED",
      "points": 5,
      "createdAt": "2026-10-03T14:52:05.000Z"
    }
  ]
}
```

### 7.2 Full Transaction Ledger
- **Method:** `GET`
- **Endpoint:** `/api/points/history`
- **Authentication:** Bearer Token

---

## 8. Gamification Badges

### 8.1 List Badges & Progress
- **Method:** `GET`
- **Endpoint:** `/api/badges`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "totalBadges": 6,
  "earnedBadges": 1,
  "badges": [
    {
      "id": "bdg_first_scan",
      "title": "First Scan",
      "description": "Completed first AI waste identification scan",
      "icon": "🌱",
      "isEarned": true,
      "unlockedAt": "2026-10-03T14:52:05.000Z"
    },
    {
      "id": "bdg_recycling_rookie",
      "title": "Recycling Rookie",
      "description": "Completed first verified waste disposal journey",
      "icon": "♻️",
      "isEarned": false
    },
    { "id": "bdg_responsible_collector", "title": "Responsible Collector", "icon": "🚛" },
    { "id": "bdg_recycling_champion", "title": "Recycling Champion", "icon": "🏆" },
    { "id": "bdg_eco_explorer", "title": "Eco Explorer", "icon": "🧭" },
    { "id": "bdg_waste_warrior", "title": "Waste Warrior", "icon": "🛡️" }
  ]
}
```

---

## 9. Rewards & Redemptions

### 9.1 Browse Reward Catalog
- **Method:** `GET`
- **Endpoint:** `/api/rewards`
- **Authentication:** Optional / Bearer Token
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "rewards": [
    {
      "id": "rew_coffee",
      "name": "Zero-Waste Café Beverage Discount",
      "description": "100% off any organic coffee or iced tea when using a reusable tumbler.",
      "pointsRequired": 100,
      "available": true,
      "partnerName": "Green Grounds Café",
      "status": "AVAILABLE"
    },
    {
      "id": "rew_metro",
      "name": "1-Day Clean Transit Pass",
      "description": "Free unlimited day pass on municipal electric buses and light rail.",
      "pointsRequired": 250,
      "available": true,
      "partnerName": "Metropolitan Green Transit",
      "status": "AVAILABLE"
    }
  ]
}
```

### 9.2 Redeem Reward Voucher
- **Method:** `POST`
- **Endpoint:** `/api/rewards/:id/redeem`
- **Authentication:** Bearer Token
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Reward claimed successfully",
  "couponCode": "ECO-1791039125-99A1",
  "reward": {
    "name": "Zero-Waste Café Beverage Discount",
    "partnerName": "Green Grounds Café"
  },
  "pointsDeducted": 100,
  "newBalance": 20
}
```
- **Possible Errors:**
  - `400 Bad Request`: Insufficient EcoPoints balance.
  - `404 Not Found`: Reward item not found.

---

## 10. Aggregated User Dashboard

Single convenient API to populate the user dashboard in 1 network call.

### 10.1 Load Dashboard
- **Method:** `GET`
- **Endpoint:** `/api/dashboard`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "profile": {
    "id": "usr_1791039125107_5jyprq",
    "fullName": "Ananya Sharma",
    "location": "Madhapur Cybercity, Hyderabad"
  },
  "ecoPoints": 55,
  "currentStreak": 1,
  "totalScans": 1,
  "totalJourneys": 1,
  "completedJourneys": 1,
  "recyclableItems": 1,
  "badges": [ ... ],
  "activeJourney": {
    "journeyId": "ES-2026-9002",
    "itemName": "Clean PET Plastic Bottle",
    "category": "RECYCLABLE",
    "status": "COMPLETED",
    "destination": "EcoSort Materials Recovery Facility (MRF)"
  },
  "recentTransactions": [ ... ],
  "availableRewards": [ ... ]
}
```

---

## 11. Notifications

### 11.1 Get Notifications
- **Method:** `GET`
- **Endpoint:** `/api/notifications`
- **Authentication:** Bearer Token
- **Success Response (`200 OK`):** Returns user notification list with unread counter.

### 11.2 Mark Single Notification Read
- **Method:** `PUT`
- **Endpoint:** `/api/notifications/:id/read`
- **Authentication:** Bearer Token

### 11.3 Mark All Read
- **Method:** `PUT`
- **Endpoint:** `/api/notifications/read-all`
- **Authentication:** Bearer Token

---

## 12. Facilities & Vehicles

### 12.1 Certified Recycling & Recovery Centers
- **Method:** `GET`
- **Endpoint:** `/api/facilities`
- **Types Supported:**
  - `RECYCLING_FACILITY`
  - `COMPOSTING_CENTER`
  - `E_WASTE_FACILITY`
  - `DONATION_CENTER`
  - `REUSE_CENTER`

### 12.2 Collection Vehicles
- **Method:** `GET`
- **Endpoint:** `/api/vehicles`
- **Vehicle Statuses:** `AVAILABLE`, `ASSIGNED`, `PICKING_UP`, `COLLECTED`, `IN_TRANSIT`, `COMPLETED`

---

## Quick Testing with cURL / Postman

### 1. Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Dev Tester",
    "mobileNumber": "9800000001",
    "location": "Hyderabad",
    "password": "Password123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9800000001",
    "password": "Password123!"
  }'
```

### 3. Fetch Dashboard
```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <TOKEN_RETURNED_FROM_LOGIN>"
```
