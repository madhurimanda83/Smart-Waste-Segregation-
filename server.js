import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static frontend files from project root
app.use(express.static(__dirname));

/**
 * Health check & Gemini configuration status endpoint
 */
app.get('/api/status', (e_req, res) => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const isConfigured = Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');

  res.json({
    status: 'online',
    service: 'EcoSort Backend',
    geminiConfigured: isConfigured,
    preferredModel: 'gemini-2.5-flash',
    fallbackModel: 'gemini-1.5-flash'
  });
});

/**
 * Helper to extract base64 and mimeType from various image sources
 */
async function resolveImageBase64(imageInput, defaultMime = 'image/jpeg') {
  if (!imageInput) {
    throw new Error('No image payload received');
  }

  // Case 1: Data URL (e.g. data:image/png;base64,iVBORw0KGgo...)
  if (imageInput.startsWith('data:')) {
    const matches = imageInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      return {
        mimeType: matches[1],
        base64Data: matches[2]
      };
    }
  }

  // Case 2: Local file path in workspace (e.g. assets/plastic-water-bottles.png)
  const localPath = path.resolve(__dirname, imageInput);
  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    const ext = path.extname(localPath).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    const mimeType = mimeMap[ext] || defaultMime;
    const fileBuffer = fs.readFileSync(localPath);
    return {
      mimeType,
      base64Data: fileBuffer.toString('base64')
    };
  }

  // Case 3: Remote URL (e.g. https://images.unsplash.com/...)
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    const response = await fetch(imageInput);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type') || defaultMime;
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    return {
      mimeType: contentType.split(';')[0],
      base64Data
    };
  }

  // Case 4: Plain base64 string
  return {
    mimeType: defaultMime,
    base64Data: imageInput
  };
}

/**
 * Call Google Gemini Flash API with an image
 */
async function callGeminiFlash(base64Data, mimeType, apiKey) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  const prompt = `You are EcoSort AI, a specialized municipal computer vision system for waste segregation and recycling.
Analyze this discarded item image carefully. Identify the exact item, what material it is made of, and which waste stream it belongs to.
Classify into ONE of these four categories:
1. "recyclable" (clean rigid plastics #1, #2, #5, aluminum cans, paper, cardboard, glass bottles)
2. "organic" (fruit/vegetable scraps, food leftovers, coffee grounds, garden clippings)
3. "hazardous" (batteries, lithium packs, chemicals, motor oil, e-waste, electronics, CFL bulbs)
4. "general" (non-recyclable packaging, chip bags, styrofoam, contaminated paper, composite materials)

Respond ONLY with a valid JSON object matching this exact schema:
{
  "name": "Specific item name (e.g., Polyethylene Plastic Bottle, AA Alkaline Battery, Banana Peel)",
  "material": "Material composition (e.g., Polyethylene Terephthalate PET 1, Organic Biomass, Zinc-Carbon / Manganese)",
  "category": "recyclable" | "organic" | "hazardous" | "general",
  "categoryLabel": "Recyclable Waste" | "Organic Waste" | "Hazardous / E-Waste" | "General Waste",
  "binName": "Blue Recycling Bin" | "Green Compost Bin" | "Special Red Drop / E-Waste Bin" | "Black / Grey General Trash",
  "binRule": "Short guideline explaining what belongs in this bin",
  "binColor": "#0284c7" (for recyclable blue) | "#16a34a" (for organic green) | "#dc2626" (for hazardous red) | "#475569" (for general grey/black),
  "confidence": "e.g. 97.8%",
  "steps": [
    "Step 1 preparation instruction (e.g. empty liquids)",
    "Step 2 preparation instruction (e.g. rinse residue)",
    "Step 3 preparation instruction (e.g. squash/flatten)",
    "Step 4 preparation instruction (e.g. bin placement tip)"
  ],
  "impactHeadline": "Quantified environmental offset (e.g. Saves 0.08 kWh energy & prevents 50g CO2)",
  "decomposition": "Time to decompose (e.g. 450 Years, 2-4 Weeks, 100+ Years)",
  "recyclability": "Recyclability description (e.g. High 100% Circular PET, Compostable, Hazardous Recovery Only)",
  "commonMistakes": "Common contamination error to avoid with this item"
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

      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Gemini API error (${apiResponse.status}): ${errorText}`);
      }

      const responseJson = await apiResponse.json();
      const rawText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini API returned an empty response');
      }

      // Clean markdown code blocks if present
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsedData = JSON.parse(cleanJson);
      return {
        model,
        data: parsedData
      };
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${model} failed, trying next model if available:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini Flash models failed to process image');
}

/**
 * Fallback classification for when API key is not yet provided by the user
 */
function getFallbackClassification(suggestedKey = 'plastic_bottle') {
  const fallbacks = {
    plastic_bottle: {
      name: 'Plastic Water Bottle',
      material: 'Polyethylene Terephthalate (PET 1)',
      category: 'recyclable',
      categoryLabel: 'Recyclable Waste',
      binName: 'Blue Recycling Bin',
      binRule: 'For rigid clean plastics, metal cans, paper & cardboard',
      binColor: '#0284c7',
      confidence: '98.4%',
      steps: [
        'Empty any residual liquids completely.',
        'Rinse lightly if containing sweetened drinks or milk.',
        'Crush or squash the bottle to conserve blue bin volume.',
        'Reattach the plastic cap tightly.'
      ],
      impactHeadline: 'Saves 0.08 kWh energy & prevents ~50g CO₂ emissions',
      decomposition: '450 Years',
      recyclability: 'High (100% Circular PET)',
      commonMistakes: 'Leaving half-full liquids which contaminates paper batches in recycling trucks.'
    },
    banana_peel: {
      name: 'Banana Peel & Fruit Scraps',
      material: 'Natural Organic Biomass (Cellulose & Potassium)',
      category: 'organic',
      categoryLabel: 'Organic Waste',
      binName: 'Green Compost Bin',
      binRule: 'For vegetable/fruit scraps, garden waste, tea bags & coffee',
      binColor: '#16a34a',
      confidence: '99.1%',
      steps: [
        'Remove any non-organic stickers or produce labels.',
        'Place directly into kitchen compost caddy or municipal green bin.',
        'Use certified biodegradable bags or loose binning.'
      ],
      impactHeadline: 'Diverted from anaerobic landfill; prevents methane greenhouse gas',
      decomposition: '2 to 4 Weeks',
      recyclability: 'Converts to nutrient-rich compost humus',
      commonMistakes: 'Wrapping fruit peelings inside conventional petroleum shopping bags.'
    },
    battery: {
      name: 'AA Alkaline Battery',
      material: 'Zinc-Manganese Dioxide / Heavy Metals',
      category: 'hazardous',
      categoryLabel: 'Hazardous / E-Waste',
      binName: 'Special Red Drop / E-Waste Bin',
      binRule: 'Never place into standard trash or single-stream recycling!',
      binColor: '#dc2626',
      confidence: '97.2%',
      steps: [
        'Cover positive (+) and negative (-) terminals with clear tape to prevent fires.',
        'Store in a cool, dry plastic container until drop-off.',
        'Drop off at certified e-waste or retail battery recycling bins.'
      ],
      impactHeadline: 'Prevents toxic heavy metals (mercury/cadmium) from leaching into groundwater',
      decomposition: '100+ Years (Toxic Leaching Risk)',
      recyclability: 'Recoverable Zinc, Steel & Manganese',
      commonMistakes: 'Tossing into household trash where compaction causes spark fires.'
    },
    coffee_cup: {
      name: 'Takeout Single-Use Coffee Cup',
      material: 'Paperboard with Polyethylene Plastic Lining',
      category: 'general',
      categoryLabel: 'General Waste',
      binName: 'Black / Grey General Trash',
      binRule: 'Plastic interior film prevents conventional paper repulping',
      binColor: '#475569',
      confidence: '94.6%',
      steps: [
        'Separate the plastic lid (check if marked #5 PP for blue recycling).',
        'Remove cardboard heat sleeve (place sleeve in Blue Bin).',
        'Place the paper cup body itself into the General Waste bin.'
      ],
      impactHeadline: 'Proper separation ensures cardboard sleeve is saved while avoiding mill pulp clogging',
      decomposition: '30 to 50 Years (Lined Cup)',
      recyclability: 'Requires specialized hydro-pulper infrastructure',
      commonMistakes: 'Assuming coffee cups are 100% paper and dumping them in the paper recycling bin.'
    },
    aluminum_can: {
      name: 'Aluminum Beverage Soda Can',
      material: 'High-Purity Alloy Aluminum (Al)',
      category: 'recyclable',
      categoryLabel: 'Recyclable Waste',
      binName: 'Blue Recycling Bin',
      binRule: 'Infinitely recyclable with 95% less energy than virgin bauxite mining',
      binColor: '#0284c7',
      confidence: '99.5%',
      steps: [
        'Pour out all remaining drink contents.',
        'Light rinse is recommended.',
        'Leave the pull-tab attached to the can body.',
        'Crush horizontally if desired to maximize bin volume.'
      ],
      impactHeadline: 'Saves 95% energy compared to raw metal processing; ready for shelf in 60 days',
      decomposition: '200 to 500 Years',
      recyclability: 'Infinite 100% Closed-Loop Recyclability',
      commonMistakes: 'Throwing away half-full cans which makes them too heavy for optical sorters.'
    },
    pizza_box: {
      name: 'Greasy Takeout Pizza Box',
      material: 'Corrugated Cardboard with Food Grease Contamination',
      category: 'organic',
      categoryLabel: 'Organic / Compost',
      binName: 'Green Compost Bin (Soiled Bottom) & Blue Bin (Clean Lid)',
      binRule: 'Grease and oil permanently saturate pulp fibers, spoiling paper recycling batches',
      binColor: '#16a34a',
      confidence: '96.2%',
      steps: [
        'Tear the box in half along the middle crease.',
        'Place the clean, unsoiled cardboard lid into the Blue Recycling Bin.',
        'Place the grease-soaked bottom half into the Green Compost Bin or General Waste.',
        'Remove wax paper liners, garlic sauce cups, and plastic pizza tables.'
      ],
      impactHeadline: 'Prevents grease contamination across hundreds of pounds of paper batches',
      decomposition: '2 to 3 Months (Industrial Composting)',
      recyclability: 'Compostable when greasy; recyclable when clean',
      commonMistakes: 'Putting grease-saturated cardboard into paper recycling, which can ruin hundreds of pounds of pulp.'
    }
  };

  return fallbacks[suggestedKey] || fallbacks.plastic_bottle;
}

/**
 * Main AI Classification Route
 * POST /api/classify
 */
app.post('/api/classify', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', sampleHint } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required "image" payload'
      });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const hasValidKey = Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');

    // Resolve base64 image data
    const resolvedImage = await resolveImageBase64(image, mimeType);

    if (hasValidKey) {
      console.log(`[EcoSort] Analyzing image with Gemini Flash (${resolvedImage.mimeType}, ~${Math.round(resolvedImage.base64Data.length * 0.75 / 1024)} KB)...`);
      const result = await callGeminiFlash(resolvedImage.base64Data, resolvedImage.mimeType, apiKey);

      return res.json({
        success: true,
        source: 'gemini-live',
        model: result.model,
        isGeminiKeyConfigured: true,
        data: result.data
      });
    } else {
      console.log('[EcoSort] GEMINI_API_KEY not set in .env. Serving local analysis fallback until key is added.');
      const fallbackData = getFallbackClassification(sampleHint || 'plastic_bottle');

      return res.json({
        success: true,
        source: 'local-fallback',
        model: 'gemini-2.5-flash (Awaiting API Key)',
        isGeminiKeyConfigured: false,
        notice: 'Gemini API Key is not yet set in .env. Paste your GEMINI_API_KEY in .env to activate live Google Gemini 2.5 Flash classification.',
        data: fallbackData
      });
    }
  } catch (err) {
    console.error('[EcoSort] Classification Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during classification'
    });
  }
});

// Fallback to index.html for single page navigation
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log('================================================================');
  console.log(` EcoSort Backend Server running on http://localhost:${PORT}`);
  console.log(` Model: Google Gemini 2.5 Flash / 1.5 Flash`);
  const apiKeySet = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  if (apiKeySet) {
    console.log(` Gemini API Key: [CONFIGURED] Live AI analysis active.`);
  } else {
    console.log(` Gemini API Key: [NOT CONFIGURED] Add your key to .env when ready.`);
  }
  console.log('================================================================');
});
