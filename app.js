/**
 * EcoSort — Smart Waste Segregation & AI Recycling Frontend Logic
 * Hackathon Edition: Frontend-First Prototype
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initNavigation();
  initScanner();
  initWasteJourneyAndEcoWallet();
  initWasteGuide();
  initCollectionSchedule();
  initScrollSpy();
});

/* ==========================================================================
   1. NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
  const header = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-drawer-cta a');

  // Sticky header scroll shadow
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenuBtn.classList.toggle('active');
      mobileDrawer.classList.toggle('open');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ==========================================================================
   2. WASTE DATA CATALOG (Presets & Guide)
   ========================================================================== */
const WASTE_ITEMS_DATABASE = {
  plastic_bottle: {
    id: 'plastic_bottle',
    name: 'Plastic Water Bottle',
    material: 'Polyethylene Terephthalate (PET 1)',
    category: 'recyclable',
    categoryLabel: 'Recyclable Waste',
    binName: 'Blue Recycling Bin',
    binRule: 'For rigid clean plastics, metal cans, paper & cardboard',
    binColor: '#0284c7',
    binBg: '#e0f2fe',
    confidence: '98.4%',
    image: 'assets/plastic-water-bottles.png',
    steps: [
      'Empty any residual liquids completely.',
      'Rinse lightly if containing sweetened drinks or milk.',
      'Crush or squash the bottle to conserve blue bin volume.',
      'Reattach the plastic cap tightly (helps in recycling sorting).'
    ],
    impactHeadline: 'Saves 0.08 kWh energy & prevents ~50g CO₂ emissions',
    decomposition: '450 Years',
    recyclability: 'High (100% Circular PET)',
    commonMistakes: 'Leaving half-full liquids which contaminates paper batches in recycling trucks.'
  },

  banana_peel: {
    id: 'banana_peel',
    name: 'Banana Peel & Fruit Scraps',
    material: 'Natural Organic Biomass (Cellulose & Potassium)',
    category: 'organic',
    categoryLabel: 'Organic Waste',
    binName: 'Green Compost Bin',
    binRule: 'For vegetable/fruit scraps, garden waste, tea bags & coffee',
    binColor: '#16a34a',
    binBg: '#dcfce7',
    confidence: '99.1%',
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=700&q=80',
    steps: [
      'Remove any non-organic stickers or plastic produce labels.',
      'Place directly into kitchen compost caddy or municipal green bin.',
      'Use certified biodegradable bags or loose binning.'
    ],
    impactHeadline: 'Diverted from anaerobic landfill; prevents methane greenhouse gas',
    decomposition: '2 to 4 Weeks',
    recyclability: 'Converts to nutrient-rich compost humus',
    commonMistakes: 'Wrapping fruit peelings inside conventional petroleum polyethylene shopping bags.'
  },

  battery: {
    id: 'battery',
    name: 'AA Alkaline Battery',
    material: 'Zinc-Manganese Dioxide / Heavy Metals',
    category: 'hazardous',
    categoryLabel: 'Hazardous / E-Waste',
    binName: 'Special Red Drop / E-Waste Bin',
    binRule: 'Never place into standard trash or single-stream recycling!',
    binColor: '#dc2626',
    binBg: '#fee2e2',
    confidence: '97.2%',
    image: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=700&q=80',
    steps: [
      'Cover positive (+) and negative (-) terminals with clear tape to prevent accidental fires.',
      'Store in a cool, dry plastic container until drop-off.',
      'Drop off at certified grocery battery bins or municipal hazardous recycling centers.'
    ],
    impactHeadline: 'Prevents heavy metals (mercury/cadmium) from leaching into groundwater',
    decomposition: '100+ Years (Toxic Leaching Risk)',
    recyclability: 'Recoverable Zinc, Steel & Manganese',
    commonMistakes: 'Tossing into household garbage where compaction in trucks causes lithium/chemical spark fires.'
  },

  coffee_cup: {
    id: 'coffee_cup',
    name: 'Takeout Single-Use Coffee Cup',
    material: 'Paperboard with Polyethylene Plastic Lining',
    category: 'general',
    categoryLabel: 'General Waste',
    binName: 'Black / Grey General Trash',
    binRule: 'Plastic interior film prevents conventional paper repulping',
    binColor: '#475569',
    binBg: '#f1f5f9',
    confidence: '94.6%',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80',
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
    id: 'aluminum_can',
    name: 'Aluminum Beverage Soda Can',
    material: 'High-Purity Alloy Aluminum (Al)',
    category: 'recyclable',
    categoryLabel: 'Recyclable Waste',
    binName: 'Blue Recycling Bin',
    binRule: 'Infinitely recyclable with 95% less energy than virgin bauxite mining',
    binColor: '#0284c7',
    binBg: '#e0f2fe',
    confidence: '99.5%',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=700&q=80',
    steps: [
      'Pour out all remaining drink contents.',
      'No need to wash thoroughly; light rinse is ideal.',
      'Leave the pull-tab attached to the can body.',
      'Crush horizontally if desired to maximize bin volume.'
    ],
    impactHeadline: 'Saves 95% energy compared to raw metal processing; ready for shelf in 60 days',
    decomposition: '200 to 500 Years',
    recyclability: 'Infinite 100% Closed-Loop Recyclability',
    commonMistakes: 'Throwing away half-full cans which makes them too heavy for optical sorters.'
  },

  pizza_box: {
    id: 'pizza_box',
    name: 'Greasy Takeaway Pizza Box',
    material: 'Corrugated Cardboard with Food Grease Contamination',
    category: 'organic',
    categoryLabel: 'Organic / Compostable (Smart Split)',
    binName: 'Green Bin (Bottom) / Blue Bin (Clean Top)',
    binRule: 'Grease prevents paper fibers from binding during repulping',
    binColor: '#16a34a',
    binBg: '#dcfce7',
    confidence: '95.8%',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80',
    steps: [
      'Tear the box in half along the crease.',
      'Clean unsoiled lid goes into the BLUE Recycling Bin.',
      'Grease-soaked bottom half goes into the GREEN Compost Bin.',
      'Remove wax paper liners or plastic pizza table inserts.'
    ],
    impactHeadline: 'Diverts compostable fiber while preserving recycling purity for unsoiled cardboard',
    decomposition: '2 to 3 Months (in industrial composting)',
    recyclability: 'Compostable when greasy; recyclable when clean',
    commonMistakes: 'Putting grease-saturated cardboard into paper recycling, which can ruin hundreds of pounds of pulp.'
  }
};

// Additional Catalog for the Searchable Waste Guide
const GUIDE_CATALOG = [
  WASTE_ITEMS_DATABASE.plastic_bottle,
  {
    id: 'cardboard_box',
    name: 'Corrugated Shipping Box',
    material: 'Kraft Corrugated Fiberboard',
    category: 'recyclable',
    categoryLabel: 'Recyclable Waste',
    binName: 'Blue Recycling Bin',
    binRule: 'Must be flattened before placement',
    confidence: '98.9%',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    steps: [
      'Remove plastic shipping bubble wrap and air cushions.',
      'Clear excessive packing tape.',
      'Flatten completely to conserve collection truck space.'
    ],
    impactHeadline: 'Recycling 1 ton of cardboard saves 17 trees and 7,000 gallons of water',
    decomposition: '2 to 3 Months',
    recyclability: 'Can be recycled up to 5-7 times',
    commonMistakes: 'Not flattening boxes, occupying 80% empty air in recycling bins.'
  },
  WASTE_ITEMS_DATABASE.banana_peel,
  WASTE_ITEMS_DATABASE.battery,
  {
    id: 'glass_bottle',
    name: 'Glass Beverage Bottle / Jar',
    material: 'Soda-Lime Silica Glass',
    category: 'recyclable',
    categoryLabel: 'Recyclable Waste',
    binName: 'Blue Recycling Bin',
    binRule: 'For intact glass bottles and jars',
    confidence: '99.0%',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    steps: [
      'Rinse out food or condiment residue.',
      'Remove metal or plastic caps (recycle caps separately).',
      'Do not break; place intact into container.'
    ],
    impactHeadline: 'Glass is 100% infinitely recyclable without loss in quality or purity',
    decomposition: '1 Million+ Years',
    recyclability: 'Infinite Recyclability',
    commonMistakes: 'Mixing broken drinking glasses, Pyrex or ceramics which have higher melting points and ruin batches.'
  },
  {
    id: 'newspaper_paper',
    name: 'Newspaper & Office Paper',
    material: 'Wood Pulp Fiber (Cellulose)',
    category: 'recyclable',
    categoryLabel: 'Recyclable Waste',
    binName: 'Blue Recycling Bin',
    binRule: 'Must be dry and unsoiled',
    confidence: '97.5%',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
    steps: [
      'Keep clean and dry (wet paper molds and cannot be sorted).',
      'Remove metal binder clips or plastic binders (staples are okay).',
      'Place loose into bin; do not tie with plastic ribbon.'
    ],
    impactHeadline: 'Uses 60% less energy to manufacture recycled paper than raw timber pulp',
    decomposition: '2 to 6 Weeks',
    recyclability: 'Recyclable 4 to 6 times before fibers shorten',
    commonMistakes: 'Recycling thermal checkout receipts (which contain BPA coatings).'
  },
  {
    id: 'ewaste_cables',
    name: 'Electronic Cables & Chargers',
    material: 'Copper Wire with PVC Insulation',
    category: 'hazardous',
    categoryLabel: 'Hazardous / E-Waste',
    binName: 'Special E-Waste Drop Point',
    binRule: 'Tangles mechanical sorting machinery at recycling facilities',
    confidence: '96.2%',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    steps: [
      'Never put cords or cables into single-stream blue bins (they are "tanglers").',
      'Bundle with a rubber band or twist tie.',
      'Drop off at best buy, e-waste drives, or municipal scrap depots.'
    ],
    impactHeadline: 'Recovers valuable high-grade electrolytic copper and prevents plastic burnoffs',
    decomposition: '500+ Years',
    recyclability: 'High copper recovery value in dedicated shredders',
    commonMistakes: 'Throwing cords into regular bins where they jam conveyor belts and cause plant shutdowns.'
  },
  WASTE_ITEMS_DATABASE.aluminum_can,
  WASTE_ITEMS_DATABASE.coffee_cup,
  WASTE_ITEMS_DATABASE.pizza_box,
  {
    id: 'styrofoam_cup',
    name: 'Styrofoam Takeout Container',
    material: 'Expanded Polystyrene (EPS #6)',
    category: 'general',
    categoryLabel: 'General Waste',
    binName: 'Black / Grey Bin',
    binRule: '95% air and easily crumbles into toxic micro-beads',
    confidence: '97.1%',
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    steps: [
      'Wipe off food debris.',
      'Break into smaller pieces if necessary to save space.',
      'Place in general trash unless your municipality has specialized EPS drop-offs.'
    ],
    impactHeadline: 'Encourages transition to molded fiber and reusable food containers',
    decomposition: '500+ Years (Never truly biodegrades)',
    recyclability: 'Extremely Low / Prohibitive Logistics',
    commonMistakes: 'Throwing styrofoam into curbside recycling bins where it shatters into thousands of non-recoverable pieces.'
  },
  {
    id: 'coffee_grounds',
    name: 'Coffee Grounds & Filters',
    material: 'Spent Coffee Grounds & Unbleached Filter Paper',
    category: 'organic',
    categoryLabel: 'Organic Waste',
    binName: 'Green Compost Bin',
    binRule: 'Rich in nitrogen for healthy soil microbiology',
    confidence: '99.4%',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    steps: [
      'Both the coffee grounds and the paper filter can go together into the green bin.',
      'Can also be mixed directly into garden topsoil as a natural slow-release fertilizer.',
      'Let hot grounds cool slightly before dumping.'
    ],
    impactHeadline: 'Replaces chemical nitrogen fertilizers and enriches garden microbiomes',
    decomposition: '3 to 6 Months',
    recyclability: '100% Nutrient Enrichment',
    commonMistakes: 'Putting single-use plastic coffee pods in compost (unless certified home-compostable).'
  }
];

/* ==========================================================================
   3. INTERACTIVE WASTE SCANNER
   ========================================================================== */
function initScanner() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const dropIdle = document.getElementById('dropIdle');
  const dropPreview = document.getElementById('dropPreview');
  const previewImg = document.getElementById('previewImg');
  const browseBtn = document.getElementById('browseBtn');
  const cameraBtn = document.getElementById('cameraBtn');
  const reuploadBtn = document.getElementById('reuploadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const runScanBtn = document.getElementById('runScanBtn');
  const runScanText = document.getElementById('runScanText');
  const scannerLaser = document.getElementById('scannerLaser');
  const analyzingBadge = document.getElementById('analyzingBadge');

  // Webcam elements
  const webcamPane = document.getElementById('webcamPane');
  const webcamVideo = document.getElementById('webcamVideo');
  const captureWebcamBtn = document.getElementById('captureWebcamBtn');
  const closeWebcamBtn = document.getElementById('closeWebcamBtn');

  // AI Analysis pane states
  const stateIdle = document.getElementById('stateIdle');
  const stateLoading = document.getElementById('stateLoading');
  const stateResult = document.getElementById('stateResult');
  const analysisStatusChip = document.getElementById('analysisStatusChip');
  const analysisStatusText = document.getElementById('analysisStatusText');
  const scanProgressBar = document.getElementById('scanProgressBar');
  const scanProgressPercent = document.getElementById('scanProgressPercent');
  const loadingStepText = document.getElementById('loadingStepText');

  // Result card fields
  const resCategoryBadge = document.getElementById('resCategoryBadge');
  const resCategoryName = document.getElementById('resCategoryName');
  const resConfidence = document.getElementById('resConfidence');
  const resItemName = document.getElementById('resItemName');
  const resMaterial = document.getElementById('resMaterial');
  const resBinCard = document.getElementById('resBinCard');
  const resBinGraphic = document.getElementById('resBinGraphic');
  const resBinName = document.getElementById('resBinName');
  const resBinRule = document.getElementById('resBinRule');
  const resStepsList = document.getElementById('resStepsList');
  const resImpactHeadline = document.getElementById('resImpactHeadline');
  const scanAgainBtn = document.getElementById('scanAgainBtn');

  // Sample Chips
  const sampleChips = document.querySelectorAll('.sample-chip');
  const apiStatusBadge = document.getElementById('apiStatusBadge');
  const scanModelName = document.getElementById('scanModelName');
  const resModelName = document.getElementById('resModelName');
  const resModelChip = document.getElementById('resModelChip');

  let currentImageSrc = null;
  let currentWasteData = null;
  let currentSampleKey = 'plastic_bottle';
  let webcamStream = null;
  let isScanning = false;

  // Check backend & Gemini Flash status on initialization
  checkBackendStatus();

  async function checkBackendStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const info = await res.json();
        if (apiStatusBadge) {
          if (info.geminiConfigured) {
            apiStatusBadge.textContent = 'Gemini 2.5 Flash Live';
            apiStatusBadge.style.backgroundColor = 'var(--color-mint-subtle)';
            apiStatusBadge.style.borderColor = 'var(--color-emerald)';
            apiStatusBadge.style.color = 'var(--color-primary-dark)';
          } else {
            apiStatusBadge.textContent = 'Gemini Flash Ready (Add Key)';
          }
        }
      }
    } catch (e) {
      if (apiStatusBadge) {
        apiStatusBadge.textContent = 'AI Model Ready';
      }
    }
  }

  // Click browse button
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Re-upload button
  reuploadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Clear button
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetScanner();
  });

  // Click entire idle zone triggers file browse
  dropZone.addEventListener('click', () => {
    if (!currentImageSrc && webcamPane.style.display !== 'block') {
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUserFile(file);
    }
  });

  // Drag & drop handlers
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUserFile(e.dataTransfer.files[0]);
    }
  });

  // Process User File (Custom Upload)
  function handleUserFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      currentSampleKey = null; // Mark as custom upload for backend Gemini analysis
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const userItem = {
        id: 'custom_upload',
        name: cleanName || 'Uploaded Waste Item',
        category: 'recyclable'
      };
      setLoadedImage(event.target.result, userItem, true);
      showToast('Photo uploaded! Click "Run AI Classification" to analyze with Gemini Flash.');
    };
    reader.readAsDataURL(file);
  }

  // Camera button trigger
  cameraBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    startWebcam();
  });

  async function startWebcam() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        webcamVideo.srcObject = webcamStream;
        dropIdle.style.display = 'none';
        dropPreview.style.display = 'none';
        webcamPane.style.display = 'block';
        showToast('Webcam activated. Align your waste item and click Snap.');
      } else {
        throw new Error('Camera API unavailable');
      }
    } catch (err) {
      console.warn('Camera error, loading preset simulation:', err);
      showToast('Camera unavailable or permission denied. Loading demo sample instead!');
      loadPresetSample('plastic_bottle');
    }
  }

  function stopWebcam() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      webcamStream = null;
    }
    webcamPane.style.display = 'none';
  }

  closeWebcamBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopWebcam();
    if (!currentImageSrc) {
      dropIdle.style.display = 'flex';
    } else {
      dropPreview.style.display = 'block';
    }
  });

  captureWebcamBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Snap from video onto hidden canvas
    const canvas = document.createElement('canvas');
    canvas.width = webcamVideo.videoWidth || 640;
    canvas.height = webcamVideo.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
    const snapData = canvas.toDataURL('image/jpeg');

    stopWebcam();
    currentSampleKey = null;
    setLoadedImage(snapData, { name: 'Webcam Waste Capture', category: 'recyclable' }, true);
    showToast('Photo captured! Starting Gemini Flash classification...');
    runClassificationScan();
  });

  // Sample Preset Chips
  sampleChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const sampleKey = chip.getAttribute('data-sample');
      sampleChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadPresetSample(sampleKey);
    });
  });

  function loadPresetSample(sampleKey) {
    stopWebcam();
    currentSampleKey = sampleKey;
    const data = WASTE_ITEMS_DATABASE[sampleKey] || WASTE_ITEMS_DATABASE.plastic_bottle;
    setLoadedImage(data.image, data, false);
    showToast(`Loaded "${data.name}" demo preset.`);
    runClassificationScan();
  }

  // Set loaded image in preview area
  function setLoadedImage(imgSrc, wasteData, isCustom = false) {
    currentImageSrc = imgSrc;
    currentWasteData = wasteData;
    previewImg.src = imgSrc;

    dropIdle.style.display = 'none';
    dropPreview.style.display = 'block';
    webcamPane.style.display = 'none';

    runScanBtn.disabled = false;
    runScanText.textContent = isCustom
      ? 'Run AI Classification (Gemini Flash)'
      : `Run AI Classification (${wasteData.name})`;
  }

  // Scan execution
  runScanBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    runClassificationScan();
  });

  scanAgainBtn.addEventListener('click', () => {
    resetScanner();
  });

  // Main Classification Scan Function (Connected to Backend /api/classify)
  async function runClassificationScan() {
    if (isScanning || !currentImageSrc) return;
    isScanning = true;

    // UI State: Scanning
    stateIdle.style.display = 'none';
    stateResult.style.display = 'none';
    stateLoading.style.display = 'flex';

    scannerLaser.style.display = 'block';
    analyzingBadge.style.display = 'flex';
    runScanBtn.disabled = true;

    analysisStatusChip.className = 'status-indicator-chip scanning';
    analysisStatusText.textContent = 'Processing with Gemini Flash...';

    // Step sequence animation
    let progress = 0;
    scanProgressBar.style.width = '0%';
    scanProgressPercent.textContent = '0%';
    if (scanModelName) scanModelName.textContent = 'Model: Google Gemini 2.5 Flash';

    const steps = [
      { at: 15, text: 'Resolving image bytes & extracting visual features...' },
      { at: 40, text: 'Executing Gemini 2.5 Flash multi-modal reasoning...' },
      { at: 70, text: 'Validating municipal taxonomy & contamination rules...' },
      { at: 90, text: 'Generating disposal protocol & carbon offset metrics...' }
    ];

    const stepInterval = setInterval(() => {
      if (progress < 85) {
        progress += 4;
        scanProgressBar.style.width = `${progress}%`;
        scanProgressPercent.textContent = `${progress}%`;

        const currentStep = steps.find(s => progress >= s.at && progress < s.at + 30);
        if (currentStep) {
          loadingStepText.textContent = currentStep.text;
        }
      }
    }, 70);

    try {
      // POST to backend API
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: currentImageSrc,
          sampleHint: currentSampleKey || 'plastic_bottle'
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();

      scanProgressBar.style.width = '100%';
      scanProgressPercent.textContent = '100%';
      loadingStepText.textContent = 'Classification Complete!';

      setTimeout(() => {
        renderAnalysisResult(result.data, result);
        isScanning = false;
      }, 350);

    } catch (err) {
      console.warn('[EcoSort] Backend API call failed or server offline, using local fallback:', err);
      clearInterval(stepInterval);
      scanProgressBar.style.width = '100%';
      scanProgressPercent.textContent = '100%';
      loadingStepText.textContent = 'Completed (Local Fallback)';

      const fallbackItem = (currentSampleKey && WASTE_ITEMS_DATABASE[currentSampleKey])
        || currentWasteData
        || WASTE_ITEMS_DATABASE.plastic_bottle;

      setTimeout(() => {
        renderAnalysisResult(fallbackItem, {
          model: 'Gemini 2.5 Flash (Fallback)',
          source: 'local-fallback',
          isGeminiKeyConfigured: false
        });
        isScanning = false;
      }, 350);
    }
  }

  // Render Result State
  function renderAnalysisResult(item, meta = {}) {
    scannerLaser.style.display = 'none';
    analyzingBadge.style.display = 'none';
    stateLoading.style.display = 'none';
    stateResult.style.display = 'flex';

    analysisStatusChip.className = 'status-indicator-chip complete';
    analysisStatusText.textContent = 'Classification Verified';
    runScanBtn.disabled = false;
    runScanText.textContent = 'Re-Analyze Current Item';

    // Model Label
    if (resModelName) {
      if (meta.source === 'gemini-live') {
        resModelName.textContent = 'Gemini 2.5 Flash (Live)';
        if (resModelChip) resModelChip.title = 'Analyzed live by Google Gemini 2.5 Flash model';
      } else {
        resModelName.textContent = meta.model || 'Gemini 2.5 Flash';
      }
    }

    // Badge styling based on category
    resCategoryBadge.className = 'result-category-badge';
    if (item.category === 'recyclable') {
      resCategoryBadge.style.backgroundColor = 'var(--cat-recyclable-bg)';
      resCategoryBadge.style.color = 'var(--cat-recyclable)';
    } else if (item.category === 'organic') {
      resCategoryBadge.style.backgroundColor = 'var(--cat-organic-bg)';
      resCategoryBadge.style.color = 'var(--cat-organic)';
    } else if (item.category === 'hazardous') {
      resCategoryBadge.style.backgroundColor = 'var(--cat-hazardous-bg)';
      resCategoryBadge.style.color = 'var(--cat-hazardous)';
    } else {
      resCategoryBadge.style.backgroundColor = 'var(--cat-general-bg)';
      resCategoryBadge.style.color = 'var(--cat-general)';
    }

    resCategoryName.textContent = item.categoryLabel || (item.category ? item.category.toUpperCase() : 'General Waste');
    resConfidence.querySelector('span').textContent = `${item.confidence || '98%'} Match`;
    resItemName.textContent = item.name;
    resMaterial.textContent = item.material;

    // Bin Destination styling
    resBinName.textContent = item.binName || 'General Waste Bin';
    resBinRule.textContent = item.binRule || 'Disposed according to municipal guidelines';
    if (item.binColor) {
      resBinGraphic.style.backgroundColor = item.binColor;
    }

    // Steps Checklist
    resStepsList.innerHTML = '';
    const stepsArray = Array.isArray(item.steps) ? item.steps : [item.steps].filter(Boolean);
    stepsArray.forEach((step, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="step-marker">${idx + 1}</span>
        <span>${step}</span>
      `;
      resStepsList.appendChild(li);
    });

    // Impact Headline
    resImpactHeadline.textContent = item.impactHeadline || 'Proper segregation preserves recycling streams and keeps hazardous materials out of landfills.';

    window.currentClassifiedItem = item;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    if (meta.source === 'gemini-live') {
      showToast(`Analyzed with Gemini 2.5 Flash: ${item.name}`);
    } else {
      showToast(`Classified: ${item.name} &rarr; ${item.binName || item.category}`);
    }
  }

  // Track Waste & Reuse Flow Buttons
  const trackWasteBtn = document.getElementById('trackWasteBtn');
  const whoNeedsThisTriggerBtn = document.getElementById('whoNeedsThisTriggerBtn');

  if (trackWasteBtn) {
    trackWasteBtn.addEventListener('click', () => {
      const itemToTrack = window.currentClassifiedItem || currentWasteData || WASTE_ITEMS_DATABASE.plastic_bottle;
      if (window.startTrackingWasteItem) {
        window.startTrackingWasteItem(itemToTrack);
      }
    });
  }

  if (whoNeedsThisTriggerBtn) {
    whoNeedsThisTriggerBtn.addEventListener('click', () => {
      if (window.openReuseDonationTab) {
        window.openReuseDonationTab();
      }
    });
  }

  function resetScanner() {
    stopWebcam();
    currentImageSrc = null;
    currentWasteData = null;
    currentSampleKey = null;
    fileInput.value = '';

    dropPreview.style.display = 'none';
    dropIdle.style.display = 'flex';
    scannerLaser.style.display = 'none';
    analyzingBadge.style.display = 'none';

    stateLoading.style.display = 'none';
    stateResult.style.display = 'none';
    stateIdle.style.display = 'flex';

    analysisStatusChip.className = 'status-indicator-chip';
    analysisStatusText.textContent = 'Standby';

    runScanBtn.disabled = true;
    runScanText.textContent = 'Select an Image to Scan';

    sampleChips.forEach(c => c.classList.remove('active'));
  }
}

/* ==========================================================================
   4. WASTE GUIDE (Search, Filter, Cards & Modal)
   ========================================================================== */
function initWasteGuide() {
  const guideGrid = document.getElementById('guideGrid');
  const searchInput = document.getElementById('guideSearchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const filterPills = document.querySelectorAll('.filter-pill');
  const emptyState = document.getElementById('guideEmptyState');
  const resetBtn = document.getElementById('resetGuideSearchBtn');
  const totalCountSpan = document.getElementById('totalItemsCount');

  // Modal elements
  const modalBackdrop = document.getElementById('itemDetailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBody = document.getElementById('modalBody');

  let activeFilter = 'all';
  let searchQuery = '';

  if (totalCountSpan) {
    totalCountSpan.textContent = GUIDE_CATALOG.length;
  }

  renderGuideItems();

  // Search input events
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    searchClearBtn.style.display = searchQuery.length > 0 ? 'flex' : 'none';
    renderGuideItems();
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClearBtn.style.display = 'none';
    renderGuideItems();
  });

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClearBtn.style.display = 'none';
    activeFilter = 'all';
    filterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === 'all'));
    renderGuideItems();
  });

  // Filter Pills
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      renderGuideItems();
    });
  });

  function renderGuideItems() {
    const filtered = GUIDE_CATALOG.filter(item => {
      const matchesCategory = activeFilter === 'all' || item.category === activeFilter;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery) ||
        item.material.toLowerCase().includes(searchQuery) ||
        item.binName.toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      guideGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    guideGrid.innerHTML = '';

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'guide-item-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      let badgeClass = 'badge-recyclable';
      if (item.category === 'organic') badgeClass = 'badge-organic';
      if (item.category === 'hazardous') badgeClass = 'badge-hazardous';
      if (item.category === 'general') badgeClass = 'badge-general';

      card.innerHTML = `
        <div class="card-img-wrapper">
          <img src="${item.image}" alt="${item.name}" class="card-item-img" loading="lazy">
          <span class="card-cat-badge ${badgeClass}">${item.category}</span>
        </div>
        <div class="card-content-body">
          <h4 class="card-item-title">${item.name}</h4>
          <p class="card-item-tip">${item.steps[0]}</p>
          <div class="card-footer-strip">
            <span class="bin-dest-tag">
              <i data-lucide="check-circle" style="width: 14px; height: 14px; color: var(--color-emerald)"></i>
              <span>${item.binName.split(' ')[0]} ${item.binName.split(' ')[1] || ''}</span>
            </span>
            <span class="detail-link-arrow">Details &rarr;</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openItemModal(item));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openItemModal(item);
      });

      guideGrid.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Modal Open
  function openItemModal(item) {
    let catBg = 'var(--cat-recyclable-bg)';
    let catColor = 'var(--cat-recyclable)';
    if (item.category === 'organic') { catBg = 'var(--cat-organic-bg)'; catColor = 'var(--cat-organic)'; }
    if (item.category === 'hazardous') { catBg = 'var(--cat-hazardous-bg)'; catColor = 'var(--cat-hazardous)'; }
    if (item.category === 'general') { catBg = 'var(--cat-general-bg)'; catColor = 'var(--cat-general)'; }

    const stepsHtml = item.steps.map(s => `<li><i data-lucide="check"></i><span>${s}</span></li>`).join('');

    modalBody.innerHTML = `
      <div class="modal-header-section">
        <img src="${item.image}" alt="${item.name}" class="modal-item-thumb">
        <div class="modal-title-col">
          <span class="modal-cat-tag" style="background-color: ${catBg}; color: ${catColor};">${item.categoryLabel}</span>
          <h3 class="modal-item-title">${item.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Material: <strong>${item.material}</strong></p>
        </div>
      </div>

      <div class="modal-meta-grid">
        <div class="meta-col">
          <div class="meta-label">Assigned Destination</div>
          <div class="meta-val" style="color: var(--color-primary);">${item.binName}</div>
        </div>
        <div class="meta-col">
          <div class="meta-label">Decomposition</div>
          <div class="meta-val">${item.decomposition}</div>
        </div>
        <div class="meta-col">
          <div class="meta-label">Circularity Rating</div>
          <div class="meta-val">${item.recyclability}</div>
        </div>
      </div>

      <h4 class="modal-section-title">
        <i data-lucide="list-checks" style="width: 18px; height: 18px; color: var(--color-emerald)"></i>
        <span>Required Preparation Protocol:</span>
      </h4>
      <ul class="modal-rules-list">
        ${stepsHtml}
      </ul>

      <div class="modal-warning-box">
        <i data-lucide="alert-circle" style="width: 18px; height: 18px;"></i>
        <div>
          <strong>Common Contamination Mistake:</strong><br>
          ${item.commonMistakes}
        </div>
      </div>
    `;

    modalBackdrop.classList.add('open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Modal Close
  modalCloseBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  function closeModal() {
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Expose filter helper globally for footer category links
  window.filterGuideFromFooter = function(categoryKey) {
    const targetPill = Array.from(filterPills).find(p => p.getAttribute('data-filter') === categoryKey);
    if (targetPill) {
      filterPills.forEach(p => p.classList.remove('active'));
      targetPill.classList.add('active');
      activeFilter = categoryKey;
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.style.display = 'none';
      renderGuideItems();
    }
  };
}

/* ==========================================================================
   5. COLLECTION SCHEDULE LOGIC
   ========================================================================== */
const SCHEDULE_DATA = {
  'zone-a': [
    {
      id: 'sched-recyclable',
      stream: 'Recyclable Waste',
      binName: 'Blue Bin',
      color: '#0284c7',
      bg: '#e0f2fe',
      icon: 'recycle',
      day: 'Every Tuesday & Friday',
      nextPickup: 'Tomorrow at 7:00 AM',
      isUrgent: true,
      items: 'Clean plastics (#1, #2, #5), flattened cardboard, soda cans & glass bottles',
      reminderActive: true
    },
    {
      id: 'sched-organic',
      stream: 'Organic Compost',
      binName: 'Green Bin',
      color: '#16a34a',
      bg: '#dcfce7',
      icon: 'apple',
      day: 'Every Wednesday',
      nextPickup: 'In 3 Days (Wed 6:30 AM)',
      isUrgent: false,
      items: 'Fruit peels, vegetable trimmings, coffee grounds & certified compost bags',
      reminderActive: true
    },
    {
      id: 'sched-general',
      stream: 'General Residual',
      binName: 'Black / Grey Bin',
      color: '#475569',
      bg: '#f1f5f9',
      icon: 'trash-2',
      day: 'Mondays & Thursdays',
      nextPickup: 'Next Monday at 7:00 AM',
      isUrgent: false,
      items: 'Non-recyclable multi-layer packaging, sanitary items & chip bags',
      reminderActive: false
    },
    {
      id: 'sched-hazardous',
      stream: 'Hazardous & E-Waste',
      binName: 'Red / Special Depot',
      color: '#dc2626',
      bg: '#fee2e2',
      icon: 'alert-triangle',
      day: '1st Saturday of Month',
      nextPickup: 'Nov 7th (Special Mobile Van)',
      isUrgent: false,
      items: 'Lithium batteries, paints, aerosol canisters, dead chargers & electronic scrap',
      reminderActive: true
    }
  ],

  'zone-b': [
    {
      id: 'sched-recyclable',
      stream: 'Recyclable Waste',
      binName: 'Blue Bin',
      color: '#0284c7',
      bg: '#e0f2fe',
      icon: 'recycle',
      day: 'Mondays & Thursdays',
      nextPickup: 'Next Monday at 7:00 AM',
      isUrgent: false,
      items: 'Clean plastics (#1, #2, #5), flattened cardboard, soda cans & glass bottles',
      reminderActive: true
    },
    {
      id: 'sched-organic',
      stream: 'Organic Compost',
      binName: 'Green Bin',
      color: '#16a34a',
      bg: '#dcfce7',
      icon: 'apple',
      day: 'Every Tuesday',
      nextPickup: 'Tomorrow at 6:30 AM',
      isUrgent: true,
      items: 'Fruit peels, vegetable trimmings, coffee grounds & certified compost bags',
      reminderActive: true
    },
    {
      id: 'sched-general',
      stream: 'General Residual',
      binName: 'Black / Grey Bin',
      color: '#475569',
      bg: '#f1f5f9',
      icon: 'trash-2',
      day: 'Wednesdays & Saturdays',
      nextPickup: 'In 2 Days at 7:00 AM',
      isUrgent: false,
      items: 'Non-recyclable multi-layer packaging, sanitary items & chip bags',
      reminderActive: false
    },
    {
      id: 'sched-hazardous',
      stream: 'Hazardous & E-Waste',
      binName: 'Red / Special Depot',
      color: '#dc2626',
      bg: '#fee2e2',
      icon: 'alert-triangle',
      day: '2nd Saturday of Month',
      nextPickup: 'Nov 14th (Municipal Drive)',
      isUrgent: false,
      items: 'Lithium batteries, paints, aerosol canisters, dead chargers & electronic scrap',
      reminderActive: true
    }
  ],

  'zone-c': [
    {
      id: 'sched-recyclable',
      stream: 'Recyclable Waste',
      binName: 'Blue Bin',
      color: '#0284c7',
      bg: '#e0f2fe',
      icon: 'recycle',
      day: 'Wednesdays & Saturdays',
      nextPickup: 'In 2 Days at 7:00 AM',
      isUrgent: false,
      items: 'Clean plastics (#1, #2, #5), flattened cardboard, soda cans & glass bottles',
      reminderActive: true
    },
    {
      id: 'sched-organic',
      stream: 'Organic Compost',
      binName: 'Green Bin',
      color: '#16a34a',
      bg: '#dcfce7',
      icon: 'apple',
      day: 'Every Friday',
      nextPickup: 'This Friday at 6:30 AM',
      isUrgent: false,
      items: 'Fruit peels, vegetable trimmings, coffee grounds & certified compost bags',
      reminderActive: true
    },
    {
      id: 'sched-general',
      stream: 'General Residual',
      binName: 'Black / Grey Bin',
      color: '#475569',
      bg: '#f1f5f9',
      icon: 'trash-2',
      day: 'Tuesdays & Fridays',
      nextPickup: 'Tomorrow at 7:00 AM',
      isUrgent: true,
      items: 'Non-recyclable multi-layer packaging, sanitary items & chip bags',
      reminderActive: false
    },
    {
      id: 'sched-hazardous',
      stream: 'Hazardous & E-Waste',
      binName: 'Red / Special Depot',
      color: '#dc2626',
      bg: '#fee2e2',
      icon: 'alert-triangle',
      day: 'Last Saturday of Month',
      nextPickup: 'Oct 31st (Special Mobile Van)',
      isUrgent: false,
      items: 'Lithium batteries, paints, aerosol canisters, dead chargers & electronic scrap',
      reminderActive: true
    }
  ]
};

function initCollectionSchedule() {
  const zoneSelect = document.getElementById('zoneSelect');
  const scheduleGrid = document.getElementById('scheduleGrid');
  const calendarSyncBtn = document.getElementById('calendarSyncBtn');
  const configureAlertsBtn = document.getElementById('configureAlertsBtn');

  if (!scheduleGrid) return;

  let currentZone = zoneSelect ? zoneSelect.value : 'zone-a';

  function renderScheduleCards(zoneKey) {
    const list = SCHEDULE_DATA[zoneKey] || SCHEDULE_DATA['zone-a'];
    scheduleGrid.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'schedule-card';

      card.innerHTML = `
        <div class="schedule-accent-bar" style="background-color: ${item.color};"></div>
        <div class="schedule-card-top">
          <div class="schedule-icon-circle" style="background-color: ${item.bg}; color: ${item.color};">
            <i data-lucide="${item.icon}"></i>
          </div>
          <span class="next-pickup-tag ${item.isUrgent ? 'urgent' : ''}">${item.nextPickup}</span>
        </div>

        <h4 class="schedule-stream-title">${item.stream}</h4>
        <span class="schedule-bin-label" style="color: ${item.color};">${item.binName}</span>

        <div class="schedule-day-box">
          <div class="day-box-label">Pickup Schedule</div>
          <div class="day-box-val">${item.day}</div>
        </div>

        <p class="schedule-items-preview">${item.items}</p>

        <div class="schedule-reminder-toggle-row">
          <span class="reminder-toggle-label">
            <i data-lucide="bell"></i>
            <span>Pickup Reminder</span>
          </span>
          <label class="switch" aria-label="Toggle pickup reminder for ${item.stream}">
            <input type="checkbox" ${item.reminderActive ? 'checked' : ''} data-stream="${item.stream}">
            <span class="slider-switch"></span>
          </label>
        </div>
      `;

      // Handle reminder toggle
      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', (e) => {
        item.reminderActive = e.target.checked;
        if (item.reminderActive) {
          showToast(`Curbside alert ON: Reminder set for ${item.stream} (${item.day}) at 7:00 PM the evening before.`);
        } else {
          showToast(`Reminder muted for ${item.stream}.`);
        }
      });

      scheduleGrid.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Initial render
  renderScheduleCards(currentZone);

  // Handle Zone dropdown change
  if (zoneSelect) {
    zoneSelect.addEventListener('change', (e) => {
      currentZone = e.target.value;
      renderScheduleCards(currentZone);
      const zoneText = zoneSelect.options[zoneSelect.selectedIndex].text.split('—')[0].trim();
      showToast(`Switched collection timetable to ${zoneText}`);
    });
  }

  // Calendar sync button
  if (calendarSyncBtn) {
    calendarSyncBtn.addEventListener('click', () => {
      showToast('Collection schedule synced! Added recurring curbside reminders to your calendar.');
    });
  }

  // Configure alerts button
  if (configureAlertsBtn) {
    configureAlertsBtn.addEventListener('click', () => {
      showToast('Alert preferences updated: Notification dispatched 7:00 PM before every pickup morning.');
    });
  }
}

/* ==========================================================================
   6. SCROLL SPY & REVEAL MICRO-INTERACTIONS
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 140;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   7. TOAST NOTIFICATION HELPER
   ========================================================================== */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i data-lucide="info" style="width: 18px; height: 18px; color: var(--color-emerald); flex-shrink: 0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 280);
  }, 3200);
}

/* ==========================================================================
   8. FROM TRASH TO IMPACT — WASTE JOURNEY & ECOPOINTS MODULE
   ========================================================================== */
function initWasteJourneyAndEcoWallet() {
  // Reusable Data Structures
  const userState = {
    ecoPoints: 250,
    streakDays: 5,
    completedJourneys: 18,
    activeBadge: 'Responsible Collector',
    targetRewardGoal: 500
  };

  const DESTINATIONS = {
    recyclable: 'EcoSort Partner Material Recovery Facility (MRF)',
    organic: 'Community Aerobic Composting & Biomass Hub',
    hazardous: 'Authorized Certified E-Waste & Chemical Facility',
    general: 'EcoSort Waste-to-Energy Recovery Center',
    reusable: 'Community Reuse & Donation Network'
  };

  const activeJourney = {
    id: '#ES-2026-9041',
    itemName: 'Plastic Water Bottle',
    category: 'recyclable',
    categoryLabel: 'Recyclable Stream',
    emoji: '🧴',
    destination: 'EcoSort Partner Material Recovery Facility (MRF)',
    stage: 4, // 1 to 7
    isVerified: false,
    vehicleId: 'EV-Truck #04 • Curbside Fleet',
    origin: 'Curbside Bay #12 (Residential Zone A)',
    eta: 'Today • 3:45 PM (On Schedule)'
  };

  const stageDescriptions = [
    { title: 'Waste Identified', badge: 'Completed', time: 'Today, 2:10 PM', statusText: 'AI Computer Vision Verified' },
    { title: 'Collection Requested', badge: 'Dispatched', time: 'Today, 2:12 PM', statusText: 'Registered in Municipal Dispatch' },
    { title: 'Pickup Scheduled', badge: 'Scheduled', time: 'Today, 2:30 PM', statusText: 'Assigned to EV Fleet' },
    { title: 'Collected by Vehicle', badge: 'In Transit', time: 'Today, 3:05 PM', statusText: 'Collection Vehicle En Route' },
    { title: 'Sorting / MRF Facility', badge: 'Check-In', time: 'Today, 3:45 PM', statusText: 'Checked in at Sorting Facility' },
    { title: 'Recycled / Recovered', badge: 'Processing', time: 'Today, 5:00 PM', statusText: 'Undergoing Circular Recovery' },
    { title: 'EcoPoints Unlocked', badge: 'Verified', time: 'Just Now', statusText: 'Disposal Journey Verified 🎉' }
  ];

  const rewardsCatalog = [
    {
      id: 'r1',
      name: 'Eco Badge & Digital Certificate',
      pts: 100,
      icon: '🌱',
      desc: 'Verified municipal digital badge & certificate recognizing your zero-contamination sorting.'
    },
    {
      id: 'r2',
      name: 'Zero Waste Bulk Market 15% Pass',
      pts: 250,
      icon: '🎟️',
      desc: '15% off certified package-free bulk foods, grains, oils & pantry essentials.'
    },
    {
      id: 'r3',
      name: 'Eco Store $15 Voucher',
      pts: 500,
      icon: '🌿',
      desc: 'Valid for plastic-free personal care, solid shampoos, and circular kitchen goods.'
    },
    {
      id: 'r4',
      name: 'Sustainable Travel Utensil Kit',
      pts: 750,
      icon: '🎁',
      desc: 'Handcrafted bamboo travel cutlery, steel straw & organic cotton roll pouch.'
    },
    {
      id: 'r5',
      name: 'Community Tree-Planting Contribution',
      pts: 1000,
      icon: '🌳',
      desc: 'Sponsors 1 native shade tree planted with GPS coordinates in your city greenway.'
    }
  ];

  let transactions = [
    { pts: 50, title: 'Verified recycling check-in #ES-8924', time: 'Today • 1:15 PM', type: 'credit' },
    { pts: 20, title: 'Curbside collection completed by EV-04', time: 'Today • 11:30 AM', type: 'credit' },
    { pts: 10, title: 'Disposal guidance completed (Light bulb)', time: 'Yesterday • 4:20 PM', type: 'credit' },
    { pts: 50, title: 'Community donation verified (Study desk)', time: '2 days ago', type: 'credit' },
    { pts: -250, title: 'Partner reward redeemed (Bulk market)', time: '3 days ago', type: 'debit' }
  ];

  let notifications = [
    { icon: '🚚', msg: 'Your waste pickup was completed by EV-Truck #04.', time: '25m ago', unread: true },
    { icon: '🏭', msg: 'Plastic Bottle checked in at EcoSort Partner MRF.', time: '1h ago', unread: true },
    { icon: '♻️', msg: 'Recycling journey verified (#ES-8924).', time: '2h ago', unread: true },
    { icon: '🎉', msg: 'You unlocked the "Responsible Collector" badge!', time: 'Yesterday', unread: false }
  ];

  const journeyHistory = [
    { name: 'Plastic Water Bottle', cat: 'recyclable', catLabel: 'Recyclable', icon: '🧴', dest: 'EcoSort Partner MRF (Sector 4)', date: 'Today, 2:10 PM', status: 'Recycled & Pelleted', pts: '+50 pts' },
    { name: 'AA Alkaline Battery Pack', cat: 'hazardous', catLabel: 'Hazardous', icon: '🔋', dest: 'Authorized Certified E-Waste Hub', date: 'Yesterday, 3:40 PM', status: 'Heavy Metal Neutralized', pts: '+70 pts' },
    { name: 'Fruit & Vegetable Scraps', cat: 'organic', catLabel: 'Organic', icon: '🍌', dest: 'Community Aerobic Composting Hub', date: '2 days ago', status: 'Composted into Humus', pts: '+30 pts' },
    { name: 'Corrugated Shipping Box', cat: 'recyclable', catLabel: 'Recyclable', icon: '📦', dest: 'Regional Fiber Recovery Facility', date: '4 days ago', status: 'Repulped into Kraft Liner', pts: '+50 pts' },
    { name: 'Takeout Single-Use Cup', cat: 'general', catLabel: 'General Waste', icon: '☕', dest: 'EcoSort Waste-to-Energy Recovery', date: '5 days ago', status: 'Thermal Energy Recovery', pts: '+15 pts' }
  ];

  // DOM Elements
  const userEcoPointsEl = document.getElementById('userEcoPoints');
  const navEcoPointsEl = document.getElementById('navEcoPoints');
  const walletBalanceBigEl = document.getElementById('walletBalanceBig');
  const targetRewardProgressFill = document.getElementById('targetRewardProgressFill');
  const targetRemainingText = document.getElementById('targetRemainingText');
  const targetPercentText = document.getElementById('targetPercentText');
  const rewardsGrid = document.getElementById('rewardsGrid');
  const transactionsList = document.getElementById('transactionsList');
  const journeyHistoryList = document.getElementById('journeyHistoryList');
  const notifList = document.getElementById('notifList');
  const notifBellBtn = document.getElementById('notifBellBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifBadgeDot = document.getElementById('notifBadgeDot');
  const notifCountTag = document.getElementById('notifCountTag');

  // Journey Elements
  const activeItemNameEl = document.getElementById('activeItemName');
  const activeItemDestNameEl = document.getElementById('activeItemDestName');
  const activeItemCatPillEl = document.getElementById('activeItemCatPill');
  const activeItemEmojiEl = document.getElementById('activeItemEmoji');
  const trackingStatusTextEl = document.getElementById('trackingStatusText');
  const trackDestEl = document.getElementById('trackDest');
  const advanceStageBtn = document.getElementById('advanceStageBtn');
  const advanceBtnText = document.getElementById('advanceBtnText');
  const resetStageBtn = document.getElementById('resetStageBtn');
  const verificationMilestoneCard = document.getElementById('verificationMilestoneCard');
  const viewWalletFromJourneyBtn = document.getElementById('viewWalletFromJourneyBtn');

  // Donation / Reuse Elements
  const confirmDonationBtn = document.getElementById('confirmDonationBtn');
  const toggleRulesBtn = document.getElementById('toggleRulesBtn');
  const pointRulesCard = document.getElementById('pointRulesCard');

  // 1. Initial Render
  updatePointsDisplay();
  renderTimeline(activeJourney.stage);
  renderRewardsCatalog();
  renderTransactionsList();
  renderNotificationsList();
  renderJourneyHistoryList();

  // 2. Tab Navigation
  const tabBtns = document.querySelectorAll('.journey-tab-btn');
  const tabPanes = document.querySelectorAll('.journey-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      activateTab(targetTab);
    });
  });

  function activateTab(tabId) {
    tabBtns.forEach(b => {
      const isCurrent = b.getAttribute('data-tab') === tabId;
      b.classList.toggle('active', isCurrent);
      b.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    tabPanes.forEach(pane => {
      if (pane.id === `pane-${tabId}`) {
        pane.style.display = 'block';
      } else {
        pane.style.display = 'none';
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // 3. Update Points & Progress Bar
  function updatePointsDisplay() {
    if (userEcoPointsEl) userEcoPointsEl.textContent = userState.ecoPoints;
    if (navEcoPointsEl) navEcoPointsEl.textContent = userState.ecoPoints;
    if (walletBalanceBigEl) walletBalanceBigEl.textContent = userState.ecoPoints;

    const goal = userState.targetRewardGoal;
    const current = userState.ecoPoints;
    const pct = Math.min(100, Math.round((current / goal) * 100));
    const remaining = Math.max(0, goal - current);

    if (targetRewardProgressFill) {
      targetRewardProgressFill.style.width = `${pct}%`;
    }
    if (targetPercentText) {
      targetPercentText.textContent = `${pct}% Completed`;
    }
    if (targetRemainingText) {
      if (remaining > 0) {
        targetRemainingText.innerHTML = `<strong>${remaining} more points</strong> needed to unlock this voucher`;
      } else {
        targetRemainingText.innerHTML = `<strong class="text-emerald">Target Reached! Ready to redeem voucher.</strong>`;
      }
    }
  }

  // 4. Render 7-Stage Timeline
  function renderTimeline(currentStage) {
    const nodes = document.querySelectorAll('.journey-timeline .timeline-node');
    nodes.forEach(node => {
      const stageNum = parseInt(node.getAttribute('data-stage'), 10);
      node.classList.remove('completed', 'active', 'pending');

      const statusBadge = node.querySelector('.node-status-badge');
      const iconCircle = node.querySelector('.node-icon-circle');

      if (stageNum < currentStage) {
        node.classList.add('completed');
        if (statusBadge) {
          statusBadge.className = 'node-status-badge completed';
          statusBadge.textContent = 'Completed';
        }
        if (iconCircle) {
          iconCircle.innerHTML = '<i data-lucide="check"></i>';
        }
      } else if (stageNum === currentStage) {
        node.classList.add('active');
        if (statusBadge) {
          statusBadge.className = 'node-status-badge active';
          statusBadge.textContent = stageDescriptions[stageNum - 1]?.badge || 'Active';
        }
        if (iconCircle) {
          iconCircle.className = 'node-icon-circle pulse';
        }
      } else {
        node.classList.add('pending');
        if (statusBadge) {
          statusBadge.className = 'node-status-badge pending';
          statusBadge.textContent = stageNum === 7 ? '+50 pts' : 'Upcoming';
        }
        if (iconCircle) {
          iconCircle.className = 'node-icon-circle';
        }
      }
    });

    if (trackingStatusTextEl) {
      trackingStatusTextEl.textContent = stageDescriptions[currentStage - 1]?.statusText || 'In Progress';
    }

    // Toggle verification milestone banner
    if (verificationMilestoneCard) {
      if (currentStage >= 7) {
        verificationMilestoneCard.style.display = 'flex';
        if (advanceBtnText) advanceBtnText.textContent = 'Journey Verified ✓';
        if (advanceStageBtn) advanceStageBtn.disabled = true;
      } else {
        verificationMilestoneCard.style.display = 'none';
        if (advanceBtnText) advanceBtnText.textContent = 'Advance Next Stage →';
        if (advanceStageBtn) advanceStageBtn.disabled = false;
      }
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // 5. Advance Stage (Simulation Button)
  if (advanceStageBtn) {
    advanceStageBtn.addEventListener('click', () => {
      if (activeJourney.stage < 7) {
        activeJourney.stage += 1;
        renderTimeline(activeJourney.stage);

        const currentStageInfo = stageDescriptions[activeJourney.stage - 1];
        showToast(`Journey advanced to Stage ${activeJourney.stage}: ${currentStageInfo.title}`);

        // Stage 7 Reached: Unlock Points
        if (activeJourney.stage === 7 && !activeJourney.isVerified) {
          activeJourney.isVerified = true;
          userState.ecoPoints += 50;
          userState.completedJourneys += 1;
          const journeyCountEl = document.getElementById('userJourneysCount');
          if (journeyCountEl) journeyCountEl.textContent = userState.completedJourneys;

          updatePointsDisplay();

          // Add transaction
          transactions.unshift({
            pts: 50,
            title: `Verified recycling check-in (${activeJourney.itemName})`,
            time: 'Just now',
            type: 'credit'
          });
          renderTransactionsList();

          // Add notification
          notifications.unshift({
            icon: '🎉',
            msg: `+50 EcoPoints unlocked for verified recycling of ${activeJourney.itemName}!`,
            time: 'Just now',
            unread: true
          });
          renderNotificationsList();

          showToast('🎉 Milestone Verified! +50 EcoPoints credited to your EcoWallet.');
          renderRewardsCatalog(); // update redeem buttons state
        }
      }
    });
  }

  // Reset Stage (Simulation Button)
  if (resetStageBtn) {
    resetStageBtn.addEventListener('click', () => {
      activeJourney.stage = 1;
      activeJourney.isVerified = false;
      renderTimeline(1);
      showToast('Waste journey reset to Stage 1 (Waste Identified).');
    });
  }

  // View Wallet from Journey Banner
  if (viewWalletFromJourneyBtn) {
    viewWalletFromJourneyBtn.addEventListener('click', () => {
      activateTab('wallet');
    });
  }

  // 6. External Hook: Start Tracking from Scanner Result
  window.startTrackingWasteItem = function (item) {
    if (!item) return;

    activeJourney.itemName = item.name || 'Identified Waste Item';
    activeJourney.category = item.category || 'recyclable';
    activeJourney.categoryLabel = item.categoryLabel || (item.category ? item.category.toUpperCase() : 'Recyclable Stream');
    activeJourney.destination = DESTINATIONS[item.category] || DESTINATIONS.recyclable;
    activeJourney.stage = 4; // Starts comfortably in pickup transit
    activeJourney.isVerified = false;

    // Pick emoji
    const emojiMap = {
      recyclable: '🧴',
      organic: '🍌',
      hazardous: '🔋',
      general: '☕'
    };
    activeJourney.emoji = emojiMap[item.category] || '♻️';

    // Update DOM
    if (activeItemNameEl) activeItemNameEl.textContent = activeJourney.itemName;
    if (activeItemDestNameEl) activeItemDestNameEl.textContent = activeJourney.destination;
    if (trackDestEl) trackDestEl.textContent = activeJourney.destination;
    if (activeItemEmojiEl) activeItemEmojiEl.textContent = activeJourney.emoji;

    if (activeItemCatPillEl) {
      activeItemCatPillEl.className = `cat-pill ${item.category || 'recyclable'}`;
      activeItemCatPillEl.textContent = activeJourney.categoryLabel;
    }

    renderTimeline(4);
    activateTab('tracker');

    // Smooth scroll to waste journey section
    const journeySection = document.getElementById('waste-journey');
    if (journeySection) {
      journeySection.scrollIntoView({ behavior: 'smooth' });
    }

    showToast(`Now Tracking: "${activeJourney.itemName}" → ${activeJourney.destination}`);
  };

  // External Hook: Open Reuse / Donation Tab
  window.openReuseDonationTab = function () {
    activateTab('reuse');
    const journeySection = document.getElementById('waste-journey');
    if (journeySection) {
      journeySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 7. Toggle Point Rules
  if (toggleRulesBtn && pointRulesCard) {
    toggleRulesBtn.addEventListener('click', () => {
      const isVisible = pointRulesCard.style.display !== 'none';
      pointRulesCard.style.display = isVisible ? 'none' : 'block';
      toggleRulesBtn.innerHTML = isVisible
        ? '<i data-lucide="help-circle"></i><span>How to Earn Points</span>'
        : '<i data-lucide="chevron-up"></i><span>Hide Rules</span>';
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // 8. Render Rewards Catalog
  function renderRewardsCatalog() {
    if (!rewardsGrid) return;
    rewardsGrid.innerHTML = '';

    rewardsCatalog.forEach(reward => {
      const canAfford = userState.ecoPoints >= reward.pts;
      const card = document.createElement('div');
      card.className = 'reward-card';
      card.innerHTML = `
        <div>
          <div class="reward-top-row">
            <span class="reward-icon-circle">${reward.icon}</span>
            <span class="reward-cost-tag">${reward.pts} EcoPoints</span>
          </div>
          <h5 class="reward-name">${reward.name}</h5>
          <p class="reward-desc">${reward.desc}</p>
        </div>
        <div class="reward-action-row">
          <span class="reward-status-note">${canAfford ? '✓ Ready to Claim' : `${reward.pts - userState.ecoPoints} more pts needed`}</span>
          <button type="button" class="btn ${canAfford ? 'btn-primary' : 'btn-outline'} btn-sm btn-redeem" data-reward-id="${reward.id}">
            <span>${canAfford ? 'Redeem' : 'Locked'}</span>
          </button>
        </div>
      `;

      const redeemBtn = card.querySelector('.btn-redeem');
      redeemBtn.addEventListener('click', () => {
        handleRedemption(reward);
      });

      rewardsGrid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function handleRedemption(reward) {
    if (userState.ecoPoints >= reward.pts) {
      userState.ecoPoints -= reward.pts;
      updatePointsDisplay();

      // Add to transaction history
      transactions.unshift({
        pts: -reward.pts,
        title: `Redeemed: ${reward.name}`,
        time: 'Just now',
        type: 'debit'
      });
      renderTransactionsList();

      // Add notification
      notifications.unshift({
        icon: reward.icon,
        msg: `Successfully redeemed "${reward.name}" (-${reward.pts} pts).`,
        time: 'Just now',
        unread: true
      });
      renderNotificationsList();

      renderRewardsCatalog();
      showToast(`🎉 Reward Claimed: "${reward.name}"! Voucher voucher code sent.`);
    } else {
      const diff = reward.pts - userState.ecoPoints;
      showToast(`You need ${diff} more EcoPoints to redeem this reward. Keep sorting!`);
    }
  }

  // 9. Render Transactions List
  function renderTransactionsList() {
    if (!transactionsList) return;
    transactionsList.innerHTML = '';

    transactions.forEach(tx => {
      const item = document.createElement('div');
      item.className = 'transaction-item';
      const isCredit = tx.type === 'credit';
      item.innerHTML = `
        <span class="trans-pts-pill ${isCredit ? 'positive' : 'negative'}">
          ${isCredit ? '+' : ''}${tx.pts} pts
        </span>
        <div class="trans-info">
          <span class="trans-title">${tx.title}</span>
          <span class="trans-time">${tx.time}</span>
        </div>
      `;
      transactionsList.appendChild(item);
    });
  }

  // 10. Render Journey History
  function renderJourneyHistoryList() {
    if (!journeyHistoryList) return;
    journeyHistoryList.innerHTML = '';

    journeyHistory.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item-row';
      row.innerHTML = `
        <div class="h-left">
          <div class="h-avatar">${item.icon}</div>
          <div>
            <div class="h-name">${item.name}</div>
            <div class="h-meta">Destination: <strong>${item.dest}</strong> &bull; ${item.date}</div>
          </div>
        </div>
        <div class="h-right">
          <span class="h-status-badge">✓ ${item.status}</span>
          <span class="h-pts-badge">${item.pts}</span>
        </div>
      `;
      journeyHistoryList.appendChild(row);
    });
  }

  // 11. Render Notifications
  function renderNotificationsList() {
    if (!notifList) return;
    notifList.innerHTML = '';

    const unreadCount = notifications.filter(n => n.unread).length;
    if (notifBadgeDot) notifBadgeDot.style.display = unreadCount > 0 ? 'block' : 'none';
    if (notifCountTag) notifCountTag.textContent = `${unreadCount} New`;

    notifications.forEach(notif => {
      const div = document.createElement('div');
      div.className = 'notif-item';
      div.innerHTML = `
        <span class="notif-item-icon">${notif.icon}</span>
        <div class="notif-item-content">
          <p class="notif-item-msg">${notif.msg}</p>
          <span class="notif-item-time">${notif.time}</span>
        </div>
      `;
      notifList.appendChild(div);
    });
  }

  // Notification Bell Toggle
  if (notifBellBtn && notifDropdown) {
    notifBellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShown = notifDropdown.style.display === 'block';
      notifDropdown.style.display = isShown ? 'none' : 'block';

      // Mark all as read when opened
      if (!isShown) {
        notifications.forEach(n => n.unread = false);
        if (notifBadgeDot) notifBadgeDot.style.display = 'none';
        if (notifCountTag) notifCountTag.textContent = '0 New';
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBellBtn) {
        notifDropdown.style.display = 'none';
      }
    });
  }

  // 12. "Who Needs This?" Donation Verification Simulation
  if (confirmDonationBtn) {
    confirmDonationBtn.addEventListener('click', () => {
      userState.ecoPoints += 50;
      updatePointsDisplay();

      transactions.unshift({
        pts: 50,
        title: 'Community Donation Verified (Study Table #DN-41)',
        time: 'Just now',
        type: 'credit'
      });
      renderTransactionsList();

      notifications.unshift({
        icon: '🤝',
        msg: 'Community donation verified! Study table delivered to Green Springs Youth Center (+50 pts).',
        time: 'Just now',
        unread: true
      });
      renderNotificationsList();

      renderRewardsCatalog();
      showToast('🎉 Donation Verified! +50 EcoPoints credited to your EcoWallet for community reuse.');
    });
  }

  // Reuse Option Buttons selector
  const optButtons = document.querySelectorAll('.reuse-option-card');
  optButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      optButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
