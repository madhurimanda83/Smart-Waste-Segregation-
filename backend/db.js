import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'ecosort.db.json');
const SQLITE_FILE = path.join(DB_DIR, 'ecosort.sqlite');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Generate unique ID helper
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

class EcoSortDatabase {
  constructor() {
    this.sqliteDb = null;
    this.data = this.loadDatabase();
    this.initSqlite();
  }

  async initSqlite() {
    try {
      const SQL = await initSqlJs();
      if (fs.existsSync(SQLITE_FILE)) {
        try {
          const buffer = fs.readFileSync(SQLITE_FILE);
          this.sqliteDb = new SQL.Database(buffer);
        } catch {
          this.sqliteDb = new SQL.Database();
        }
      } else {
        this.sqliteDb = new SQL.Database();
      }

      this.sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          fullName TEXT NOT NULL,
          mobileNumber TEXT,
          email TEXT UNIQUE,
          location TEXT,
          passwordHash TEXT NOT NULL,
          ecoPoints INTEGER DEFAULT 0,
          currentStreak INTEGER DEFAULT 1,
          createdAt TEXT,
          updatedAt TEXT
        );
        CREATE TABLE IF NOT EXISTS waste_scans (
          id TEXT PRIMARY KEY,
          userId TEXT,
          itemName TEXT,
          category TEXT,
          confidence REAL,
          recommendedBin TEXT,
          createdAt TEXT
        );
        CREATE TABLE IF NOT EXISTS waste_journeys (
          id TEXT PRIMARY KEY,
          journeyId TEXT,
          userId TEXT,
          itemName TEXT,
          category TEXT,
          status TEXT,
          createdAt TEXT
        );
      `);

      this.syncToSqlite();
    } catch (err) {
      console.warn('[EcoSort DB] SQLite init note:', err.message);
    }
  }

  syncToSqlite() {
    if (!this.sqliteDb) return;
    try {
      const stmt = this.sqliteDb.prepare(`
        INSERT OR REPLACE INTO users (id, fullName, mobileNumber, email, location, passwordHash, ecoPoints, currentStreak, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of (this.data.users || [])) {
        stmt.run([
          u.id,
          u.fullName || '',
          u.mobileNumber || null,
          u.email || null,
          u.location || 'Curbside Zone A',
          u.passwordHash || '',
          u.ecoPoints || 0,
          u.currentStreak || 1,
          u.createdAt || new Date().toISOString(),
          u.updatedAt || new Date().toISOString()
        ]);
      }
      stmt.free();

      const binary = this.sqliteDb.export();
      fs.writeFileSync(SQLITE_FILE, Buffer.from(binary));
    } catch (err) {
      console.error('[EcoSort DB] SQLite sync error:', err.message);
    }
  }

  loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn('[EcoSort DB] Error reading database file, reinitializing seeds:', err.message);
      }
    }
    const initialData = this.getSeedData();
    this.save(initialData);
    return initialData;
  }

  save(dataToSave = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      this.syncToSqlite();
    } catch (err) {
      console.error('[EcoSort DB] Failed to persist database:', err);
    }
  }

  getSeedData() {
    return {
      users: [],
      wasteScans: [],
      wasteCategories: [
        {
          id: 'cat_recyclable',
          code: 'RECYCLABLE',
          name: 'Recyclable Waste',
          color: '#0284c7',
          binName: 'Blue Recycling Bin',
          description: 'Dry, rigid items that can be processed and remanufactured into circular resources.',
          examples: ['Plastic water bottles', 'Aluminum cans', 'Cardboard packaging', 'Glass jars', 'Tin cans'],
          disposalInstructions: 'Empty liquids completely, rinse residue lightly, flatten bottles & cans, and place clean in the blue bin.',
          recyclingInformation: 'Processed at local Material Recovery Facilities (MRFs), baled, and remanufactured with up to 95% less virgin energy.'
        },
        {
          id: 'cat_organic',
          code: 'ORGANIC',
          name: 'Organic & Food Waste',
          color: '#16a34a',
          binName: 'Green Compost Bin',
          description: 'Biodegradable natural matter suitable for composting or anaerobic digestion.',
          examples: ['Fruit & vegetable peelings', 'Coffee grounds', 'Eggshells', 'Garden leaves & clippings', 'Leftover food scraps'],
          disposalInstructions: 'Remove any non-compostable stickers, plastic ties or conventional bags. Deposit directly or inside certified biodegradable bags.',
          recyclingInformation: 'Converted into nutrient-rich humus and bio-fertilizer, preventing methane emissions from anaerobic landfill decomposition.'
        },
        {
          id: 'cat_hazardous',
          code: 'HAZARDOUS',
          name: 'Hazardous Waste',
          color: '#dc2626',
          binName: 'Special Red Drop / Certified Hazardous Bin',
          description: 'Corrosive, toxic, flammable, or heavy metal waste posing danger to human health and groundwater.',
          examples: ['Lithium & alkaline batteries', 'Chemical solvents', 'Motor oil', 'Pesticides', 'CFL light tubes'],
          disposalInstructions: 'Never place into regular trash or recycling trucks. Tape battery terminals and take to certified municipal drop-offs.',
          recyclingInformation: 'Handled in specialized neutralizer plants to recover heavy metals (zinc, steel, cobalt) and neutralize toxins.'
        },
        {
          id: 'cat_ewaste',
          code: 'E_WASTE',
          name: 'Electronic Waste (E-Waste)',
          color: '#9333ea',
          binName: 'Certified E-Waste Drop Box',
          description: 'Discarded electronics, circuit boards, appliances, and lithium battery devices.',
          examples: ['Smartphones', 'Laptops & chargers', 'Tablets', 'Computer peripherals', 'Audio gear'],
          disposalInstructions: 'Wipe personal data, keep cords wrapped, and drop at authorized municipal e-waste recycling kiosks.',
          recyclingInformation: 'Dismantled to recover precious metals (gold, copper, silver) while safely recycling chassis plastics.'
        },
        {
          id: 'cat_general',
          code: 'GENERAL',
          name: 'General Residual Waste',
          color: '#475569',
          binName: 'Black / Grey Bin',
          description: 'Non-recyclable packaging and contaminated materials that cannot be safely sorted into other streams.',
          examples: ['Plastic wrap & chip bags', 'Styrofoam containers', 'Wax-lined coffee cups', 'Contaminated paper', 'Broken ceramics'],
          disposalInstructions: 'Place in designated general trash bins. Aim to reduce single-use plastic consumption at the source.',
          recyclingInformation: 'Transported to modern Waste-to-Energy (WtE) recovery centers or sanitary regulated containment.'
        },
        {
          id: 'cat_reusable',
          code: 'REUSABLE',
          name: 'Reusable / Donation Items',
          color: '#0d9488',
          binName: 'Community Reuse Hub',
          description: 'Intact household goods, furniture, books, and working appliances suitable for community donation.',
          examples: ['Study tables & chairs', 'Books & textbooks', 'Clothing & textiles', 'Working small appliances'],
          disposalInstructions: 'Inspect physical condition, clean surfaces, and schedule community volunteer pickup or drop at local donation depots.',
          recyclingInformation: 'Directly recirculated to schools, shelters, and community centers, eliminating manufacturing carbon footprints.'
        }
      ],
      facilities: [
        {
          id: 'fac_mrf_01',
          name: 'EcoSort Partner Material Recovery Facility (MRF)',
          type: 'RECYCLING_FACILITY',
          location: 'Sector 4, Green Bay Industrial Park',
          acceptedCategories: ['RECYCLABLE'],
          status: 'ACTIVE'
        },
        {
          id: 'fac_comp_01',
          name: 'Community Aerobic Composting & Biomass Hub',
          type: 'COMPOSTING_CENTER',
          location: 'North Greenway Eco-Park',
          acceptedCategories: ['ORGANIC'],
          status: 'ACTIVE'
        },
        {
          id: 'fac_ewaste_01',
          name: 'Authorized Certified E-Waste & Chemical Facility',
          type: 'E_WASTE_FACILITY',
          location: 'Civic Recycling Depot #7',
          acceptedCategories: ['HAZARDOUS', 'E_WASTE'],
          status: 'ACTIVE'
        },
        {
          id: 'fac_reuse_01',
          name: 'Green Springs Community Reuse & Donation Depot',
          type: 'DONATION_CENTER',
          location: 'Community Transit Center, Downtown',
          acceptedCategories: ['REUSABLE'],
          status: 'ACTIVE'
        },
        {
          id: 'fac_wte_01',
          name: 'EcoSort Waste-to-Energy Recovery Center',
          type: 'REUSE_CENTER',
          location: 'Metro Resource Park',
          acceptedCategories: ['GENERAL'],
          status: 'ACTIVE'
        }
      ],
      collectionVehicles: [
        {
          id: 'veh_01',
          vehicleNumber: 'EV-Truck #04',
          driverName: 'Alex Mercer',
          currentStatus: 'COLLECTED',
          currentLocation: 'Residential Sector 4 (Curbside Greenway)',
          assignedJourneyId: 'ES-2026-9041',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'veh_02',
          vehicleNumber: 'EV-Van #02',
          driverName: 'Sarah Lin',
          currentStatus: 'AVAILABLE',
          currentLocation: 'Central Depot Bay #3',
          assignedJourneyId: null,
          updatedAt: new Date().toISOString()
        }
      ],
      badges: [
        {
          id: 'bdg_first_scan',
          code: 'FIRST_SCAN',
          name: 'First Scan',
          description: 'Completed first AI waste identification scan',
          icon: '🌱',
          requirement: 'Scan 1 waste item'
        },
        {
          id: 'bdg_rookie',
          code: 'RECYCLING_ROOKIE',
          name: 'Recycling Rookie',
          description: 'Properly segregated 5 verified recyclable items',
          icon: '♻️',
          requirement: 'Complete 5 verified recycling journeys'
        },
        {
          id: 'bdg_collector',
          code: 'RESPONSIBLE_COLLECTOR',
          name: 'Responsible Collector',
          description: 'Successfully scheduled and verified 10 curbside pickups',
          icon: '🚚',
          requirement: 'Complete 10 curbside pickups'
        },
        {
          id: 'bdg_champion',
          code: 'RECYCLING_CHAMPION',
          name: 'Recycling Champion',
          description: 'Diverted over 20 items from municipal landfills',
          icon: '🏭',
          requirement: 'Complete 20 verified journeys'
        },
        {
          id: 'bdg_explorer',
          code: 'ECO_EXPLORER',
          name: 'Eco Explorer',
          description: 'Scanned and segregated items across all 4 waste categories',
          icon: '🌍',
          requirement: 'Scan items across all 4 streams'
        },
        {
          id: 'bdg_warrior',
          code: 'WASTE_WARRIOR',
          name: 'Waste Warrior',
          description: 'Accumulated over 1,000 lifetime EcoPoints',
          icon: '🏆',
          requirement: 'Earn 1000 EcoPoints'
        }
      ],
      rewards: [
        {
          id: 'rew_badge',
          name: 'Eco Badge & Digital Certificate',
          description: 'Verified municipal digital credential recognizing your zero-contamination sorting.',
          pointsRequired: 100,
          available: true,
          partnerName: 'Municipal Clean Cities Initiative',
          status: 'AVAILABLE',
          icon: '🌱'
        },
        {
          id: 'rew_market',
          name: 'Zero Waste Bulk Market 15% Pass',
          description: '15% discount on certified package-free bulk foods, grains, oils & pantry essentials.',
          pointsRequired: 250,
          available: true,
          partnerName: 'Zero Waste Grocery Collective',
          status: 'AVAILABLE',
          icon: '🎟️'
        },
        {
          id: 'rew_voucher',
          name: 'Eco Store $15 Voucher',
          description: 'Valid for plastic-free personal care, shampoo bars, and circular kitchen goods.',
          pointsRequired: 500,
          available: true,
          partnerName: 'EcoLife Goods Co.',
          status: 'COMING_SOON',
          icon: '🌿'
        },
        {
          id: 'rew_cutlery',
          name: 'Sustainable Bamboo Travel Utensil Kit',
          description: 'Handcrafted bamboo travel cutlery, steel straw & organic cotton roll pouch.',
          pointsRequired: 750,
          available: true,
          partnerName: 'GreenEarth Essentials',
          status: 'COMING_SOON',
          icon: '🎁'
        },
        {
          id: 'rew_tree',
          name: 'Community Tree-Planting Contribution',
          description: 'Sponsors 1 native shade tree planted with GPS coordinates in your city greenway.',
          pointsRequired: 1000,
          available: true,
          partnerName: 'Urban Canopy Forest Project',
          status: 'COMING_SOON',
          icon: '🌳'
        }
      ],
      collectionSchedules: [
        {
          id: 'sch_zone_a_blue',
          location: 'Zone A — Downtown, Central & University District',
          wasteCategory: 'RECYCLABLE',
          collectionDay: 'Tuesday',
          collectionTime: '07:30 AM',
          status: 'ACTIVE'
        },
        {
          id: 'sch_zone_a_green',
          location: 'Zone A — Downtown, Central & University District',
          wasteCategory: 'ORGANIC',
          collectionDay: 'Thursday',
          collectionTime: '08:00 AM',
          status: 'ACTIVE'
        },
        {
          id: 'sch_zone_a_black',
          location: 'Zone A — Downtown, Central & University District',
          wasteCategory: 'GENERAL',
          collectionDay: 'Friday',
          collectionTime: '07:00 AM',
          status: 'ACTIVE'
        },
        {
          id: 'sch_zone_b_blue',
          location: 'Zone B — North Suburbs & Residential Greenways',
          wasteCategory: 'RECYCLABLE',
          collectionDay: 'Monday',
          collectionTime: '08:00 AM',
          status: 'ACTIVE'
        },
        {
          id: 'sch_zone_b_green',
          location: 'Zone B — North Suburbs & Residential Greenways',
          wasteCategory: 'ORGANIC',
          collectionDay: 'Wednesday',
          collectionTime: '08:30 AM',
          status: 'ACTIVE'
        }
      ],
      wasteJourneys: [],
      collectionRequests: [],
      verifications: [],
      ecoPointTransactions: [],
      userBadges: [],
      rewardRedemptions: [],
      notifications: []
    };
  }

  // --- USERS ---
  createUser(userData) {
    const newUser = {
      id: generateId('usr'),
      fullName: userData.fullName,
      mobileNumber: userData.mobileNumber,
      email: userData.email || null,
      location: userData.location || 'Curbside Zone A',
      passwordHash: userData.passwordHash,
      ecoPoints: 0,
      currentStreak: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return this.sanitizeUser(newUser);
  }

  findUserById(id) {
    const user = this.data.users.find(u => u.id === id);
    return user ? { ...user } : null;
  }

  findUserByMobile(mobileNumber) {
    const user = this.data.users.find(u => u.mobileNumber === mobileNumber);
    return user ? { ...user } : null;
  }

  findUserByEmail(email) {
    if (!email) return null;
    const user = this.data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    const allowed = ['fullName', 'mobileNumber', 'email', 'location'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        this.data.users[index][key] = updates[key];
      }
    }
    this.data.users[index].updatedAt = new Date().toISOString();
    this.save();
    return this.sanitizeUser(this.data.users[index]);
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // --- WASTE SCANS ---
  createWasteScan(scanData) {
    const scan = {
      id: generateId('scn'),
      userId: scanData.userId || null,
      imageUrl: scanData.imageUrl || null,
      itemName: scanData.itemName,
      category: scanData.category,
      confidence: scanData.confidence || 95.0,
      recommendedDisposal: scanData.recommendedDisposal,
      recommendedBin: scanData.recommendedBin,
      material: scanData.material || '',
      impactHeadline: scanData.impactHeadline || '',
      createdAt: new Date().toISOString()
    };
    this.data.wasteScans.push(scan);
    this.save();
    return scan;
  }

  getWasteScansByUserId(userId) {
    return this.data.wasteScans
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // --- CATEGORIES ---
  getCategories() {
    return this.data.wasteCategories;
  }

  getCategoryByCode(code) {
    const c = code.toUpperCase();
    return this.data.wasteCategories.find(cat => cat.code === c || cat.id === `cat_${code.toLowerCase()}`);
  }

  // --- FACILITIES ---
  getFacilities() {
    return this.data.facilities;
  }

  getFacilityById(id) {
    return this.data.facilities.find(f => f.id === id);
  }

  getFacilityForCategory(catCode) {
    const c = catCode.toUpperCase();
    return this.data.facilities.find(f => f.acceptedCategories.includes(c)) || this.data.facilities[0];
  }

  // --- WASTE JOURNEYS ---
  createWasteJourney(journeyData) {
    const count = this.data.wasteJourneys.length + 1;
    const year = new Date().getFullYear();
    const humanId = `ES-${year}-${String(9000 + count).padStart(4, '0')}`;

    const facility = journeyData.destinationId
      ? this.getFacilityById(journeyData.destinationId)
      : this.getFacilityForCategory(journeyData.category || 'RECYCLABLE');

    const defaultVehicle = this.data.collectionVehicles[0];

    const initialStatus = journeyData.isReusable ? 'MARKED_FOR_REUSE' : 'COLLECTION_REQUESTED';
    const now = new Date().toISOString();

    const journey = {
      id: generateId('jny'),
      journeyId: humanId,
      userId: journeyData.userId,
      wasteScanId: journeyData.wasteScanId || null,
      itemName: journeyData.itemName || 'Identified Waste Item',
      category: (journeyData.category || 'RECYCLABLE').toUpperCase(),
      status: initialStatus,
      statusHistory: [
        {
          status: 'IDENTIFIED',
          timestamp: now,
          note: 'Waste item identified and analyzed for segregation'
        },
        {
          status: initialStatus,
          timestamp: now,
          note: journeyData.notes || 'Waste journey initiated'
        }
      ],
      pickupAddress: journeyData.pickupAddress || 'Curbside Bay #12 (Residential Zone A)',
      destinationId: facility ? facility.id : null,
      destinationName: facility ? facility.name : 'EcoSort Partner Recovery Facility',
      vehicleId: defaultVehicle ? defaultVehicle.id : null,
      isReusable: Boolean(journeyData.isReusable),
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };

    this.data.wasteJourneys.push(journey);
    this.save();
    return journey;
  }

  getJourneysByUserId(userId) {
    return this.data.wasteJourneys
      .filter(j => j.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getJourneyById(id) {
    return this.data.wasteJourneys.find(j => j.id === id || j.journeyId === id);
  }

  updateJourneyStatus(id, newStatus, note = null) {
    const index = this.data.wasteJourneys.findIndex(j => j.id === id || j.journeyId === id);
    if (index === -1) return null;

    const j = this.data.wasteJourneys[index];
    const now = new Date().toISOString();
    j.status = newStatus;
    j.updatedAt = now;

    if (!Array.isArray(j.statusHistory)) {
      j.statusHistory = [{ status: 'IDENTIFIED', timestamp: j.createdAt, note: 'Initial identification' }];
    }

    j.statusHistory.push({
      status: newStatus,
      timestamp: now,
      note: note || `Status updated to ${newStatus}`
    });

    if (['RECOVERED', 'COMPLETED'].includes(newStatus)) {
      j.completedAt = now;
    }

    this.save();
    return j;
  }

  // --- COLLECTION REQUESTS ---
  createCollectionRequest(reqData) {
    const colReq = {
      id: generateId('col'),
      wasteJourneyId: reqData.wasteJourneyId,
      userId: reqData.userId,
      pickupLocation: reqData.pickupLocation || 'Residential Curbside Bay',
      preferredDate: reqData.preferredDate || new Date().toISOString().split('T')[0],
      preferredTime: reqData.preferredTime || '08:00 AM - 11:00 AM',
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };
    this.data.collectionRequests.push(colReq);

    // Update journey status to PICKUP_SCHEDULED
    this.updateJourneyStatus(reqData.wasteJourneyId, 'PICKUP_SCHEDULED');

    this.save();
    return colReq;
  }

  // --- COLLECTION VEHICLES ---
  getVehicles() {
    return this.data.collectionVehicles;
  }

  getVehicleById(id) {
    return this.data.collectionVehicles.find(v => v.id === id);
  }

  // --- VERIFICATIONS ---
  createVerification(verData) {
    const ver = {
      id: generateId('ver'),
      journeyId: verData.journeyId,
      verificationType: verData.verificationType || 'FACILITY_RFID_SCAN',
      verifiedBy: verData.verifiedBy || 'EcoSort Sorting Hub Scanner #02',
      verificationCode: `ES-VER-${Math.floor(10000 + Math.random() * 90000)}`,
      verifiedAt: new Date().toISOString(),
      status: 'VERIFIED'
    };
    this.data.verifications.push(ver);

    // Mark journey as COMPLETED
    this.updateJourneyStatus(verData.journeyId, 'COMPLETED');
    this.save();
    return ver;
  }

  // --- ECOPOINTS & TRANSACTIONS ---
  addPointTransaction(userId, action, points, journeyId = null) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    // Check duplicate points for the same journey + action
    if (journeyId) {
      const existing = this.data.ecoPointTransactions.find(
        t => t.userId === userId && t.journeyId === journeyId && t.action === action
      );
      if (existing) {
        return { duplicate: true, transaction: existing, currentBalance: user.ecoPoints };
      }
    }

    user.ecoPoints = Math.max(0, user.ecoPoints + points);
    user.updatedAt = new Date().toISOString();

    const tx = {
      id: generateId('tx'),
      userId,
      journeyId,
      action,
      points,
      createdAt: new Date().toISOString()
    };
    this.data.ecoPointTransactions.push(tx);
    this.save();

    // Check badges after points change
    this.checkAndAwardBadges(userId);

    return { duplicate: false, transaction: tx, currentBalance: user.ecoPoints };
  }

  getUserPoints(userId) {
    const user = this.data.users.find(u => u.id === userId);
    const balance = user ? user.ecoPoints : 0;
    const transactions = this.data.ecoPointTransactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { totalPoints: balance, transactions };
  }

  // --- BADGES ---
  getBadges() {
    return this.data.badges;
  }

  getUserBadges(userId) {
    const awarded = this.data.userBadges.filter(ub => ub.userId === userId);
    const awardedCodes = new Set(awarded.map(ub => ub.badgeCode));

    return this.data.badges.map(b => ({
      ...b,
      unlocked: awardedCodes.has(b.code),
      earnedAt: awarded.find(ub => ub.badgeCode === b.code)?.earnedAt || null
    }));
  }

  checkAndAwardBadges(userId) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return;

    const scans = this.data.wasteScans.filter(s => s.userId === userId);
    const journeys = this.data.wasteJourneys.filter(j => j.userId === userId && j.status === 'COMPLETED');
    const userBadges = this.data.userBadges.filter(ub => ub.userId === userId);
    const hasBadge = code => userBadges.some(ub => ub.badgeCode === code);

    // 1. FIRST_SCAN
    if (scans.length >= 1 && !hasBadge('FIRST_SCAN')) {
      this.awardBadge(userId, 'FIRST_SCAN');
    }
    // 2. RECYCLING_ROOKIE (5 completed journeys)
    if (journeys.length >= 5 && !hasBadge('RECYCLING_ROOKIE')) {
      this.awardBadge(userId, 'RECYCLING_ROOKIE');
    }
    // 3. RESPONSIBLE_COLLECTOR (10 completed journeys)
    if (journeys.length >= 10 && !hasBadge('RESPONSIBLE_COLLECTOR')) {
      this.awardBadge(userId, 'RESPONSIBLE_COLLECTOR');
    }
    // 4. RECYCLING_CHAMPION (20 completed journeys)
    if (journeys.length >= 20 && !hasBadge('RECYCLING_CHAMPION')) {
      this.awardBadge(userId, 'RECYCLING_CHAMPION');
    }
    // 5. WASTE_WARRIOR (1000 points)
    if (user.ecoPoints >= 1000 && !hasBadge('WASTE_WARRIOR')) {
      this.awardBadge(userId, 'WASTE_WARRIOR');
    }
  }

  awardBadge(userId, badgeCode) {
    const badge = this.data.badges.find(b => b.code === badgeCode);
    if (!badge) return;

    const ub = {
      id: generateId('ub'),
      userId,
      badgeCode,
      earnedAt: new Date().toISOString()
    };
    this.data.userBadges.push(ub);

    this.createNotification(
      userId,
      'BADGE_UNLOCKED',
      'New Badge Unlocked!',
      `You earned the "${badge.name}" badge! ${badge.icon}`
    );
    this.save();
  }

  // --- REWARDS ---
  getRewards(userId) {
    const user = this.data.users.find(u => u.id === userId);
    const balance = user ? user.ecoPoints : 0;

    return this.data.rewards.map(r => ({
      ...r,
      canRedeem: balance >= r.pointsRequired && r.status === 'AVAILABLE',
      pointsNeeded: Math.max(0, r.pointsRequired - balance)
    }));
  }

  redeemReward(userId, rewardId) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const reward = this.data.rewards.find(r => r.id === rewardId);
    if (!reward) throw new Error('Reward not found');

    if (user.ecoPoints < reward.pointsRequired) {
      throw new Error(`Insufficient EcoPoints. You need ${reward.pointsRequired - user.ecoPoints} more points.`);
    }

    // Deduct points
    user.ecoPoints -= reward.pointsRequired;
    user.updatedAt = new Date().toISOString();

    const redemptionCode = `ECO-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const redemption = {
      id: generateId('rdm'),
      userId,
      rewardId: reward.id,
      rewardName: reward.name,
      pointsSpent: reward.pointsRequired,
      redemptionCode,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };
    this.data.rewardRedemptions.push(redemption);

    // Log transaction
    const tx = {
      id: generateId('tx'),
      userId,
      journeyId: null,
      action: 'REWARD_REDEMPTION',
      points: -reward.pointsRequired,
      createdAt: new Date().toISOString()
    };
    this.data.ecoPointTransactions.push(tx);

    this.createNotification(
      userId,
      'REWARD_REDEEMED',
      'Reward Redeemed!',
      `You claimed "${reward.name}". Voucher Code: ${redemptionCode}`
    );

    this.save();
    return { redemption, currentBalance: user.ecoPoints };
  }

  getRedemptionsByUserId(userId) {
    return this.data.rewardRedemptions
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // --- SCHEDULES ---
  getSchedules(locationFilter = null) {
    if (!locationFilter || locationFilter.trim() === '') return this.data.collectionSchedules;
    const q = locationFilter.toLowerCase().trim();
    const filtered = this.data.collectionSchedules.filter(s => s.location.toLowerCase().includes(q));
    return filtered.length > 0 ? filtered : this.data.collectionSchedules;
  }

  // --- NOTIFICATIONS ---
  createNotification(userId, type, title, message) {
    const notif = {
      id: generateId('notif'),
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(notif);
    this.save();
    return notif;
  }

  getNotificationsByUserId(userId) {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  markNotificationAsRead(id, userId) {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.save();
    }
    return notif;
  }

  markAllNotificationsRead(userId) {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.save();
  }
}

// Singleton database instance
export const db = new EcoSortDatabase();
