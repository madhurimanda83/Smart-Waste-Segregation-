/**
 * EcoSort API Integration & Verification Suite
 * Tests full user journey:
 * Register/Login -> Scan -> Guidance -> Collection -> Tracking -> Status History -> Verification -> EcoPoints -> Rewards -> Dashboard
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Running EcoSort Comprehensive Backend Test Suite...\n');
  let token = null;
  let userId = null;
  let scanId = null;
  let journeyId = null;
  let rewardId = null;
  let notifId = null;

  const testPhone = '99' + Math.floor(10000000 + Math.random() * 90000000);
  const testEmail = `tester_${Date.now()}@ecosort.org`;

  // HTTP Helper
  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data: json };
  }

  // 1. Health Status
  console.log('1. Testing GET /api/status...');
  const s1 = await api('/api/status');
  console.log(`   Status: ${s1.status}, Service: ${s1.data.service}, Gemini: ${s1.data.geminiConfigured}`);
  if (!s1.ok) throw new Error('Status check failed');

  // 2. Authentication: Register
  console.log('\n2. Testing POST /api/auth/register...');
  const regPayload = {
    fullName: 'Ananya Sharma',
    mobileNumber: testPhone,
    location: 'Jubilee Hills, Hyderabad',
    email: testEmail,
    password: 'SecurePassword123!'
  };
  const s2 = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(regPayload)
  });
  console.log(`   Status: ${s2.status}, User ID: ${s2.data.user?.id}, Initial Points: ${s2.data.user?.ecoPoints}`);
  if (s2.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(s2.data)}`);
  token = s2.data.token;
  userId = s2.data.user.id;

  // Verify password hash is never exposed
  if (s2.data.user.passwordHash || s2.data.user.password) {
    throw new Error('SECURITY VIOLATION: Password hash exposed in register response!');
  }

  // 3. Authentication: Login
  console.log('\n3. Testing POST /api/auth/login...');
  const s3 = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: testPhone,
      password: 'SecurePassword123!'
    })
  });
  console.log(`   Status: ${s3.status}, Welcome: ${s3.data.user?.fullName}`);
  if (!s3.ok) throw new Error(`Login failed: ${JSON.stringify(s3.data)}`);
  token = s3.data.token;

  // 4. Authenticated Identity: GET /api/auth/me
  console.log('\n4. Testing GET /api/auth/me...');
  const s4 = await api('/api/auth/me');
  console.log(`   Status: ${s4.status}, Authenticated user: ${s4.data.user?.fullName} (${s4.data.user?.mobileNumber})`);
  if (!s4.ok) throw new Error('Auth me failed');

  // 5. User Profile: PUT /api/users/me
  console.log('\n5. Testing PUT /api/users/me...');
  const s5 = await api('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify({
      location: 'Madhapur Cybercity, Hyderabad'
    })
  });
  console.log(`   Status: ${s5.status}, Updated Location: ${s5.data.user?.location}`);
  if (!s5.ok) throw new Error('User update failed');

  // 6. Waste Categories: GET /api/categories
  console.log('\n6. Testing GET /api/categories...');
  const s6 = await api('/api/categories');
  const catCodes = s6.data.categories?.map(c => c.code) || [];
  console.log(`   Supported categories (${catCodes.length}): ${catCodes.join(', ')}`);
  const requiredCategories = ['RECYCLABLE', 'ORGANIC', 'HAZARDOUS', 'E_WASTE', 'GENERAL', 'REUSABLE'];
  const hasAll = requiredCategories.every(c => catCodes.includes(c));
  if (!hasAll) throw new Error(`Missing required waste categories: ${requiredCategories}`);

  // 7. Waste Scan & Disposal Guidance
  console.log('\n7. Testing POST /api/waste/analyze...');
  const s7 = await api('/api/waste/analyze', {
    method: 'POST',
    body: JSON.stringify({
      itemName: 'Clean PET Plastic Bottle',
      category: 'RECYCLABLE'
    })
  });
  console.log(`   Status: ${s7.status}, Item: "${s7.data.itemName}", Category: ${s7.data.category}, Bin: ${s7.data.recommendedBin}`);
  console.log(`   Points Earned on Scan: ${s7.data.pointsEarned} (Points withheld until verified disposal)`);
  if (!s7.ok) throw new Error('Analyze failed');
  if (s7.data.pointsEarned !== 0) throw new Error('Points should NOT be awarded merely for scanning/uploading');
  scanId = s7.data.scan?.id || s7.data.scanId;

  // 8. Waste Scan History
  console.log('\n8. Testing GET /api/waste/history...');
  const s8 = await api('/api/waste/history');
  console.log(`   History items count: ${s8.data.scans?.length}`);
  if (!s8.ok || s8.data.scans?.length === 0) throw new Error('Scan history failed');

  // 9. Create Waste Journey
  console.log('\n9. Testing POST /api/journeys...');
  const s9 = await api('/api/journeys', {
    method: 'POST',
    body: JSON.stringify({
      wasteScanId: scanId,
      pickupAddress: 'Block C, Highrise Apts, Madhapur',
      notes: 'Contains 12 clean PET bottles and flattened cardboard'
    })
  });
  console.log(`   Status: ${s9.status}, Journey ID: ${s9.data.journey?.journeyId}, Status: ${s9.data.journey?.status}`);
  if (s9.status !== 201) throw new Error('Journey create failed');
  journeyId = s9.data.journey.id;

  // 10. Request Doorstep Collection
  console.log('\n10. Testing POST /api/collections/request...');
  const s10 = await api('/api/collections/request', {
    method: 'POST',
    body: JSON.stringify({
      wasteJourneyId: journeyId,
      pickupLocation: 'Block C, Highrise Apts, Madhapur',
      preferredDate: '2026-10-05',
      preferredTime: '10:00 AM - 12:00 PM',
      contactPhone: testPhone
    })
  });
  console.log(`   Status: ${s10.status}, Status: ${s10.data.collectionRequest?.status}, Assigned Vehicle: ${s10.data.vehicle?.vehicleNumber}`);
  if (s10.status !== 201) throw new Error('Collection request failed');

  // 11. Vehicle Tracking & Route Telematics
  console.log('\n11. Testing GET /api/journeys/:id/tracking...');
  const s11 = await api(`/api/journeys/${journeyId}/tracking`);
  console.log(`   Status: ${s11.status}, Vehicle: ${s11.data.vehicle?.vehicleNumber}, Estimated: ${s11.data.estimatedArrival}`);
  if (!s11.ok) throw new Error('Tracking failed');

  // 12. Advance Status & Verify Status History
  console.log('\n12. Testing PUT /api/journeys/:id/status (Updating to AT_SORTING_CENTER & AT_RECYCLING_FACILITY)...');
  await api(`/api/journeys/${journeyId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'AT_SORTING_CENTER', note: 'Unloaded at North Sorting Facility' })
  });
  const s12 = await api(`/api/journeys/${journeyId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'AT_RECYCLING_FACILITY', note: 'Delivered to Material Recovery Plant' })
  });
  console.log(`   Status: ${s12.status}, Current Status: ${s12.data.journey?.status}`);
  console.log(`   Status History Stages logged: ${s12.data.journey?.statusHistory?.length}`);
  s12.data.journey?.statusHistory?.forEach(h => console.log(`     - [${h.status}] ${h.note}`));
  if (!s12.ok || (s12.data.journey?.statusHistory?.length || 0) < 3) throw new Error('Status history missing or incomplete');

  // 13. Verify Outcome and Award EcoPoints
  console.log('\n13. Testing POST /api/journeys/:id/verify...');
  const s13 = await api(`/api/journeys/${journeyId}/verify`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'VERIFIED',
      verificationType: 'DESTINATION_RECOVERY',
      verifiedBy: 'Inspector K. Rao, GreenTech Recovery Center'
    })
  });
  console.log(`   Status: ${s13.status}, Points Awarded: ${s13.data.pointsAwarded}, Balance: ${s13.data.newBalance}`);
  if (!s13.ok || s13.data.pointsAwarded !== 50) throw new Error('Verification failed to award 50 EcoPoints');

  // 14. Anti-Duplicate Points Check: Verify the same journey again
  console.log('\n14. Testing Anti-Duplicate Reward Prevention on repeated verification...');
  const s14Dup = await api(`/api/journeys/${journeyId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ verifiedBy: 'Second Scanner' })
  });
  console.log(`   Duplicate points awarded: ${s14Dup.data.pointsAwarded} (alreadyAwarded: ${s14Dup.data.alreadyAwarded})`);
  if (s14Dup.data.pointsAwarded !== 0) throw new Error('ANTI-DUPLICATE CHECK FAILED: Duplicate points were awarded!');

  // 15. EcoPoints Wallet & History
  console.log('\n15. Testing GET /api/points/balance & /api/points/history...');
  const s15a = await api('/api/points/balance');
  const s15b = await api('/api/points/history');
  console.log(`   Total Points Balance: ${s15a.data.totalPoints}`);
  console.log(`   Ledger Transactions: ${s15b.data.transactions?.length}`);
  if (!s15a.ok || !s15b.ok || s15a.data.totalPoints !== 50) throw new Error('Points balance mismatch');

  // 16. Negative Balance Prevention on Reward Redemption
  console.log('\n16. Testing Negative Balance Prevention on Reward Redemption...');
  const s16Catalog = await api('/api/rewards');
  const expensiveReward = s16Catalog.data.rewards?.find(r => r.pointsRequired > s15a.data.totalPoints);
  if (expensiveReward) {
    console.log(`   Attempting to claim "${expensiveReward.name}" (${expensiveReward.pointsRequired} pts) with 50 pts balance...`);
    const s16Deny = await api(`/api/rewards/${expensiveReward.id}/redeem`, { method: 'POST' });
    console.log(`   Redemption HTTP Status: ${s16Deny.status} (Expected 400 Bad Request)`);
    console.log(`   Error message: "${s16Deny.data.error}"`);
    if (s16Deny.status !== 400) throw new Error('NEGATIVE BALANCE CHECK FAILED: User was allowed to overspend points!');
  }

  // 17. User Dashboard: GET /api/dashboard
  console.log('\n17. Testing GET /api/dashboard...');
  const s17 = await api('/api/dashboard');
  console.log('   Aggregated Dashboard verified:');
  console.log(`     User: ${s17.data.profile?.fullName}`);
  console.log(`     EcoPoints: ${s17.data.ecoPoints}`);
  console.log(`     Total Scans: ${s17.data.totalScans}`);
  console.log(`     Total Journeys: ${s17.data.totalJourneys}`);
  console.log(`     Completed Journeys: ${s17.data.completedJourneys}`);
  console.log(`     Active Journey: ${s17.data.activeJourney?.journeyId}`);
  if (!s17.ok) throw new Error('Dashboard API failed');

  // 18. Notifications: GET /api/notifications
  console.log('\n18. Testing GET /api/notifications...');
  const s18 = await api('/api/notifications');
  console.log(`   Notifications generated: ${s18.data.total}`);
  if (!s18.ok || s18.data.total === 0) throw new Error('Notifications failed');

  // 19. Collection Schedules: GET /api/schedules
  console.log('\n19. Testing GET /api/schedules...');
  const s19 = await api('/api/schedules?location=Madhapur');
  console.log(`   Collection schedule slots: ${s19.data.schedules?.length}`);
  if (!s19.ok || s19.data.schedules?.length === 0) throw new Error('Schedules failed');

  console.log('\n================================================================');
  console.log('🎉 ALL INTEGRATION CHECKS & USER JOURNEY REQUIREMENTS PASSED!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
