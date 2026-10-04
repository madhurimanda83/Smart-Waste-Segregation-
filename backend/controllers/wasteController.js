import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

/**
 * Resolve image base64 data from Base64 Data URI, local path, or remote URL
 */
async function resolveImageBase64(imageInput, defaultMime = 'image/jpeg') {
  if (!imageInput) {
    throw new Error('No image payload provided');
  }

  // Case 1: Data URL
  if (imageInput.startsWith('data:')) {
    const matches = imageInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      return { mimeType: matches[1], base64Data: matches[2] };
    }
  }

  // Case 2: Local file in project root
  const localPath = path.resolve(ROOT_DIR, imageInput);
  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    const ext = path.extname(localPath).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };
    return {
      mimeType: mimeMap[ext] || defaultMime,
      base64Data: fs.readFileSync(localPath).toString('base64')
    };
  }

  // Case 3: Remote URL
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    const response = await fetch(imageInput);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type') || defaultMime;
    const arrayBuffer = await response.arrayBuffer();
    return {
      mimeType: contentType.split(';')[0],
      base64Data: Buffer.from(arrayBuffer).toString('base64')
    };
  }

  // Case 4: Raw base64
  return { mimeType: defaultMime, base64Data: imageInput };
}

/**
 * Call Gemini Flash REST API with vision prompt
 */
async function callGeminiFlash(base64Data, mimeType, apiKey) {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  const prompt = `You are EcoSort AI, a specialized municipal computer vision system for waste segregation and recycling.
Analyze this discarded item image carefully. Identify the exact item, what material it is made of, and which waste stream it belongs to.
Classify into ONE of these categories:
- "RECYCLABLE" (clean rigid plastics, aluminum cans, paper, cardboard, glass)
- "ORGANIC" (fruit/vegetable scraps, food leftovers, coffee grounds, garden clippings)
- "HAZARDOUS" (batteries, chemicals, motor oil)
- "E_WASTE" (electronics, phones, chargers, circuit boards)
- "GENERAL" (non-recyclable packaging, chip bags, styrofoam, contaminated paper)
- "REUSABLE" (intact furniture, books, clothing, working appliances)

Respond ONLY with a valid JSON object matching this schema:
{
  "itemName": "Specific item name",
  "material": "Material composition",
  "category": "RECYCLABLE" | "ORGANIC" | "HAZARDOUS" | "E_WASTE" | "GENERAL" | "REUSABLE",
  "categoryLabel": "Recyclable Waste" | "Organic Waste" | "Hazardous Waste" | "E-Waste" | "General Waste" | "Reusable Item",
  "confidence": 98.2,
  "recommendedDisposal": "Clear step-by-step instructions on cleaning and preparing this item for disposal",
  "recommendedBin": "Blue Recycling Bin" | "Green Compost Bin" | "Special Red Drop / E-Waste Bin" | "Black / Grey General Trash" | "Community Reuse Hub",
  "binColor": "#0284c7" | "#16a34a" | "#dc2626" | "#9333ea" | "#475569" | "#0d9488",
  "impactHeadline": "Quantified environmental metric (e.g. Saves 0.08 kWh energy & prevents 50g CO2)",
  "steps": ["Step 1", "Step 2", "Step 3"]
}`;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        throw new Error(`Gemini status ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty Gemini response');

      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();

      const parsed = JSON.parse(cleanJson);
      return { model, data: parsed };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Fallback classification dataset
 */
function getFallbackClassification(hint = 'plastic_bottle') {
  const map = {
    plastic_bottle: {
      itemName: 'Plastic Water Bottle',
      material: 'Polyethylene Terephthalate (PET 1)',
      category: 'RECYCLABLE',
      categoryLabel: 'Recyclable Waste',
      confidence: 98.4,
      recommendedDisposal: 'Empty residual liquids completely, rinse lightly, crush bottle, and tightly reattach cap.',
      recommendedBin: 'Blue Recycling Bin',
      binColor: '#0284c7',
      impactHeadline: 'Saves 0.08 kWh energy & prevents ~50g CO₂ emissions',
      steps: ['Empty residual liquids', 'Rinse lightly', 'Crush to save space', 'Reattach cap tightly']
    },
    banana_peel: {
      itemName: 'Banana Peel & Fruit Scraps',
      material: 'Natural Organic Biomass (Cellulose & Potassium)',
      category: 'ORGANIC',
      categoryLabel: 'Organic Waste',
      confidence: 99.1,
      recommendedDisposal: 'Remove synthetic produce stickers and deposit directly into organic compost.',
      recommendedBin: 'Green Compost Bin',
      binColor: '#16a34a',
      impactHeadline: 'Prevents landfill methane; converts to nutrient-rich compost humus',
      steps: ['Remove non-organic fruit stickers', 'Place in compost caddy', 'Use certified compostable bags']
    },
    battery: {
      itemName: 'AA Alkaline Battery Pack',
      material: 'Zinc-Manganese Dioxide / Heavy Metals',
      category: 'HAZARDOUS',
      categoryLabel: 'Hazardous Waste',
      confidence: 97.2,
      recommendedDisposal: 'Tape positive (+) and negative (-) terminals with clear tape to prevent short circuits. Drop at authorized e-waste depots.',
      recommendedBin: 'Special Red Drop / Certified Hazardous Bin',
      binColor: '#dc2626',
      impactHeadline: 'Prevents toxic heavy metals (mercury/cadmium) from leaching into groundwater',
      steps: ['Tape battery terminals', 'Store in dry container', 'Drop at certified hazardous depot']
    },
    coffee_cup: {
      itemName: 'Takeout Single-Use Coffee Cup',
      material: 'Paperboard with Polyethylene Plastic Lining',
      category: 'GENERAL',
      categoryLabel: 'General Waste',
      confidence: 94.6,
      recommendedDisposal: 'Separate plastic lid for recycling (#5 PP). Place cup body into general waste as interior film prevents repulping.',
      recommendedBin: 'Black / Grey Bin',
      binColor: '#475569',
      impactHeadline: 'Proper separation prevents pulp batch contamination at paper mills',
      steps: ['Recycle plastic lid separately', 'Recycle cardboard sleeve', 'Dispose lined cup body in general waste']
    },
    aluminum_can: {
      itemName: 'Aluminum Beverage Soda Can',
      material: 'High-Purity Alloy Aluminum (Al)',
      category: 'RECYCLABLE',
      categoryLabel: 'Recyclable Waste',
      confidence: 99.5,
      recommendedDisposal: 'Pour out contents, rinse lightly, leave pull-tab attached, and place in blue bin.',
      recommendedBin: 'Blue Recycling Bin',
      binColor: '#0284c7',
      impactHeadline: 'Saves 95% energy compared to virgin bauxite processing; 100% infinitely circular',
      steps: ['Empty drink contents', 'Light rinse', 'Leave tab attached', 'Deposit in blue bin']
    },
    pizza_box: {
      itemName: 'Greasy Takeout Pizza Box',
      material: 'Corrugated Cardboard with Food Grease Contamination',
      category: 'ORGANIC',
      categoryLabel: 'Organic Waste',
      confidence: 96.2,
      recommendedDisposal: 'Tear in half: clean unsoiled lid goes into Blue Recycling Bin; greasy bottom half goes into Green Compost.',
      recommendedBin: 'Green Compost Bin (Soiled Half) & Blue Bin (Clean Lid)',
      binColor: '#16a34a',
      impactHeadline: 'Prevents grease from spoiling hundreds of pounds of paper batches',
      steps: ['Tear box in half', 'Recycle clean lid', 'Compost greasy bottom', 'Remove plastic pizza inserts']
    },
    study_desk: {
      itemName: 'Wooden Study Table & Chair',
      material: 'Solid Pine Wood & Steel Hardware',
      category: 'REUSABLE',
      categoryLabel: 'Reusable Item',
      confidence: 96.8,
      recommendedDisposal: 'Inspect physical stability. Item is in working condition and eligible for neighborhood community donation.',
      recommendedBin: 'Community Reuse Hub',
      binColor: '#0d9488',
      impactHeadline: 'Directly recirculates functional furniture to community schools and centers',
      steps: ['Check joint tightness', 'Wipe down wood surface', 'Schedule community volunteer pickup']
    }
  };

  return map[hint] || map.plastic_bottle;
}

/**
 * POST /api/waste/analyze
 */
export async function analyzeWaste(req, res) {
  try {
    const { image, mimeType = 'image/jpeg', sampleHint, itemName: queryName, searchQuery, query } = req.body || {};

    let analysisData;
    let modelSource = 'demo-classifier';
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const hasValidKey = Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');

    if (image) {
      try {
        const resolved = await resolveImageBase64(image, mimeType);
        if (hasValidKey) {
          try {
            const geminiRes = await callGeminiFlash(resolved.base64Data, resolved.mimeType, apiKey);
            analysisData = geminiRes.data;
            modelSource = geminiRes.model;
          } catch (err) {
            console.warn('[Waste Analyze] Gemini API call failed, falling back to local classifier:', err.message);
            analysisData = getFallbackClassification(sampleHint || 'plastic_bottle');
          }
        } else {
          analysisData = getFallbackClassification(sampleHint || 'plastic_bottle');
        }
      } catch (err) {
        analysisData = getFallbackClassification(sampleHint || 'plastic_bottle');
      }
    } else {
      // Text search or demo item recognition
      const textQuery = (queryName || searchQuery || query || sampleHint || '').toLowerCase();
      let hintKey = 'plastic_bottle';
      if (textQuery.includes('batter') || textQuery.includes('hazard') || textQuery.includes('chemical')) hintKey = 'battery';
      else if (textQuery.includes('banana') || textQuery.includes('food') || textQuery.includes('apple') || textQuery.includes('organic') || textQuery.includes('fruit')) hintKey = 'banana_peel';
      else if (textQuery.includes('cup') || textQuery.includes('coffee') || textQuery.includes('wrapper') || textQuery.includes('chip')) hintKey = 'coffee_cup';
      else if (textQuery.includes('can') || textQuery.includes('aluminum') || textQuery.includes('tin') || textQuery.includes('soda')) hintKey = 'aluminum_can';
      else if (textQuery.includes('pizza') || textQuery.includes('box') || textQuery.includes('carton')) hintKey = 'pizza_box';
      else if (textQuery.includes('table') || textQuery.includes('chair') || textQuery.includes('book') || textQuery.includes('cloth') || textQuery.includes('desk')) hintKey = 'study_desk';

      analysisData = getFallbackClassification(hintKey);
      if (queryName) {
        analysisData.itemName = queryName;
      }
      modelSource = 'keyword-semantic-matcher';
    }

    // Save scan record in database
    const scan = db.createWasteScan({
      userId: req.user ? req.user.id : null,
      imageUrl: (image && (image.startsWith('http') || image.startsWith('assets'))) ? image : null,
      itemName: analysisData.itemName || analysisData.name || 'Identified Waste Item',
      category: (analysisData.category || 'RECYCLABLE').toUpperCase(),
      confidence: typeof analysisData.confidence === 'number' ? analysisData.confidence : parseFloat(analysisData.confidence) || 96.0,
      recommendedDisposal: analysisData.recommendedDisposal || (analysisData.steps ? analysisData.steps.join(' ') : 'Dispose responsibly.'),
      recommendedBin: analysisData.recommendedBin || analysisData.binName || 'General Waste',
      material: analysisData.material,
      impactHeadline: analysisData.impactHeadline
    });

    return res.json({
      success: true,
      scan,
      scanId: scan.id,
      itemName: scan.itemName,
      material: scan.material,
      category: scan.category,
      categoryLabel: analysisData.categoryLabel || scan.category,
      confidence: scan.confidence,
      recommendedDisposal: scan.recommendedDisposal,
      recommendedBin: scan.recommendedBin,
      binColor: analysisData.binColor || '#0284c7',
      impactHeadline: scan.impactHeadline,
      steps: analysisData.steps || [],
      model: modelSource,
      isDemoClassification: modelSource !== 'gemini-3.8-flash' && modelSource !== 'gemini-2.5-flash',
      pointsEarned: 0,
      rewardNotice: 'EcoPoints are awarded after collection and verified recycling/recovery.',
      demoDisclaimer: 'Hackathon MVP classification logic. Connects to production computer vision in deployment.',
      createdAt: scan.createdAt
    });
  } catch (err) {
    console.error('[Waste Analyze Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze waste item',
      details: err.message
    });
  }
}

/**
 * GET /api/waste/history
 */
export function getScanHistory(req, res) {
  const scans = db.getWasteScansByUserId(req.user.id);
  return res.json({
    success: true,
    totalScans: scans.length,
    scans
  });
}

/**
 * GET /api/categories
 */
export function getCategories(_req, res) {
  return res.json({
    success: true,
    categories: db.getCategories()
  });
}

/**
 * GET /api/categories/:category
 */
export function getCategoryDetail(req, res) {
  const cat = db.getCategoryByCode(req.params.category);
  if (!cat) {
    return res.status(404).json({
      success: false,
      error: `Category "${req.params.category}" not found.`
    });
  }
  return res.json({
    success: true,
    category: cat
  });
}
