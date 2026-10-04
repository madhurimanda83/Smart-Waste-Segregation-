import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

import * as authCtrl from '../controllers/authController.js';
import * as userCtrl from '../controllers/userController.js';
import * as wasteCtrl from '../controllers/wasteController.js';
import * as journeyCtrl from '../controllers/journeyController.js';
import * as colCtrl from '../controllers/collectionController.js';
import * as ptsCtrl from '../controllers/pointsController.js';
import * as rewCtrl from '../controllers/rewardsController.js';
import * as bdgCtrl from '../controllers/badgeController.js';
import * as dshCtrl from '../controllers/dashboardController.js';
import * as notifCtrl from '../controllers/notificationController.js';
import * as facCtrl from '../controllers/facilityController.js';

const api = Router();

// ================= 1. AUTHENTICATION =================
api.post('/auth/register', authCtrl.register);
api.post('/auth/login', authCtrl.login);
api.post('/auth/logout', authCtrl.logout);
api.get('/auth/me', requireAuth, authCtrl.getMe);

// ================= 2. USER PROFILE =================
api.get('/users/me', requireAuth, userCtrl.getProfile);
api.put('/users/me', requireAuth, userCtrl.updateProfile);

// ================= 3. WASTE SCANS =================
api.post('/waste/analyze', optionalAuth, wasteCtrl.analyzeWaste);
api.get('/waste/history', requireAuth, wasteCtrl.getScanHistory);

// Backwards-compatible alias for existing frontend calls
api.post('/classify', optionalAuth, wasteCtrl.analyzeWaste);

// ================= 4. WASTE CATEGORIES =================
api.get('/categories', wasteCtrl.getCategories);
api.get('/categories/:category', wasteCtrl.getCategoryDetail);

// ================= 5. WASTE JOURNEYS =================
api.post('/journeys', requireAuth, journeyCtrl.createJourney);
api.get('/journeys', requireAuth, journeyCtrl.getJourneys);
api.get('/journeys/:id', requireAuth, journeyCtrl.getJourneyById);
api.put('/journeys/:id/status', requireAuth, journeyCtrl.updateJourneyStatus);
api.get('/journeys/:id/tracking', requireAuth, journeyCtrl.getJourneyTracking);
api.post('/journeys/:id/verify', requireAuth, journeyCtrl.verifyJourney);

// ================= 6. COLLECTIONS & VEHICLES =================
api.post('/collections/request', requireAuth, colCtrl.requestCollection);
api.get('/vehicles', facCtrl.getVehicles);
api.get('/vehicles/:id', facCtrl.getVehicleById);

// ================= 7. FACILITIES =================
api.get('/facilities', facCtrl.getFacilities);
api.get('/facilities/:id', facCtrl.getFacilityById);

// ================= 8. ECOPOINTS & WALLET =================
api.get('/points/balance', requireAuth, ptsCtrl.getPointsBalance);
api.get('/points/history', requireAuth, ptsCtrl.getPointsHistory);
api.get('/points/rules', ptsCtrl.getPointRules);

// ================= 9. BADGES =================
api.get('/badges', requireAuth, bdgCtrl.getBadges);

// ================= 10. REWARDS =================
api.get('/rewards', requireAuth, rewCtrl.getRewards);
api.post('/rewards/:id/redeem', requireAuth, rewCtrl.redeemReward);
api.get('/rewards/history', requireAuth, rewCtrl.getRedemptionHistory);

// ================= 11. DASHBOARD =================
api.get('/dashboard', requireAuth, dshCtrl.getDashboard);

// ================= 12. SCHEDULES =================
api.get('/schedules', colCtrl.getSchedules);

// ================= 13. NOTIFICATIONS =================
api.get('/notifications', requireAuth, notifCtrl.getNotifications);
api.put('/notifications/:id/read', requireAuth, notifCtrl.markAsRead);
api.put('/notifications/read-all', requireAuth, notifCtrl.markAllRead);

// Health check status
api.get('/status', (req, res) => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  res.json({
    status: 'online',
    service: 'EcoSort Backend API v1.0',
    geminiConfigured: Boolean(apiKey && apiKey !== 'your_gemini_api_key_here'),
    models: ['gemini-2.5-flash', 'gemini-1.5-flash'],
    authenticated: Boolean(req.user)
  });
});

export default api;
