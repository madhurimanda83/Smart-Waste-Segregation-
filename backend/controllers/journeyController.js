import { db } from '../db.js';

const VALID_STATUSES = [
  'IDENTIFIED',
  'COLLECTION_REQUESTED',
  'PICKUP_SCHEDULED',
  'COLLECTED',
  'IN_TRANSIT',
  'AT_SORTING_CENTER',
  'AT_RECYCLING_FACILITY',
  'RECOVERED',
  'COMPLETED',
  'CANCELLED',
  'MARKED_FOR_REUSE',
  'DONATION_REQUESTED',
  'RECIPIENT_RECEIVED'
];

/**
 * POST /api/journeys
 */
export function createJourney(req, res) {
  try {
    const { wasteScanId, itemName, category, pickupAddress, destinationId, isReusable } = req.body;

    const journey = db.createWasteJourney({
      userId: req.user.id,
      wasteScanId: wasteScanId || null,
      itemName: itemName || 'Identified Waste Item',
      category: (category || 'RECYCLABLE').toUpperCase(),
      pickupAddress: pickupAddress || req.user.location || 'Residential Curbside Bay',
      destinationId: destinationId || null,
      isReusable: Boolean(isReusable)
    });

    db.createNotification(
      req.user.id,
      'JOURNEY_CREATED',
      'Waste Journey Initiated',
      `Tracking journey #${journey.journeyId} for ${journey.itemName}.`
    );

    return res.status(201).json({
      success: true,
      message: 'Waste journey initiated successfully',
      journey
    });
  } catch (err) {
    console.error('[Create Journey Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create waste journey',
      details: err.message
    });
  }
}

/**
 * GET /api/journeys
 */
export function getJourneys(req, res) {
  const journeys = db.getJourneysByUserId(req.user.id);
  return res.json({
    success: true,
    totalJourneys: journeys.length,
    journeys
  });
}

/**
 * GET /api/journeys/:id
 */
export function getJourneyById(req, res) {
  const journey = db.getJourneyById(req.params.id);
  if (!journey) {
    return res.status(404).json({ success: false, error: 'Journey not found' });
  }

  // Enforce ownership
  if (journey.userId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied. You can only view your own waste journeys.' });
  }

  const facility = journey.destinationId ? db.getFacilityById(journey.destinationId) : null;
  const vehicle = journey.vehicleId ? db.getVehicleById(journey.vehicleId) : null;

  return res.json({
    success: true,
    journey,
    facility,
    vehicle
  });
}

/**
 * PUT /api/journeys/:id/status
 */
export function updateJourneyStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`
      });
    }

    const journey = db.getJourneyById(req.params.id);
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    if (journey.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied. You can only update your own journeys.' });
    }

    const updated = db.updateJourneyStatus(journey.id, status.toUpperCase(), req.body.note);

    // Award collection points when collected
    if (updated.status === 'COLLECTED') {
      const ptRes = db.addPointTransaction(req.user.id, 'COLLECTION_COMPLETED', 20, journey.id);
      if (ptRes && !ptRes.duplicate) {
        db.createNotification(
          req.user.id,
          'COLLECTION_COMPLETED',
          'Waste Collected!',
          `Your ${journey.itemName} was collected by the curbside vehicle (+20 EcoPoints).`
        );
      }
    }

    // Award recovery points when completed
    if (['RECOVERED', 'COMPLETED'].includes(updated.status)) {
      const ptRes = db.addPointTransaction(req.user.id, 'RECOVERY_VERIFIED', 50, journey.id);
      if (ptRes && !ptRes.duplicate) {
        db.createNotification(
          req.user.id,
          'JOURNEY_VERIFIED',
          'Disposal Verified!',
          `Your ${journey.itemName} reached verified facility recovery (+50 EcoPoints).`
        );
      }
    }

    return res.json({
      success: true,
      message: `Journey status updated to ${updated.status}`,
      journey: updated
    });
  } catch (err) {
    console.error('[Update Journey Status Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update journey status',
      details: err.message
    });
  }
}

/**
 * GET /api/journeys/:id/tracking
 */
export function getJourneyTracking(req, res) {
  const journey = db.getJourneyById(req.params.id);
  if (!journey) {
    return res.status(404).json({ success: false, error: 'Journey not found' });
  }

  if (journey.userId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const vehicle = journey.vehicleId ? db.getVehicleById(journey.vehicleId) : db.getVehicles()[0];
  const facility = journey.destinationId ? db.getFacilityById(journey.destinationId) : db.getFacilities()[0];

  const stages = [
    { stage: 1, name: 'Waste Identified', status: 'COMPLETED' },
    { stage: 2, name: 'Collection Requested', status: 'COMPLETED' },
    { stage: 3, name: 'Pickup Scheduled', status: ['PICKUP_SCHEDULED', 'COLLECTED', 'IN_TRANSIT', 'AT_SORTING_CENTER', 'AT_RECYCLING_FACILITY', 'RECOVERED', 'COMPLETED'].includes(journey.status) ? 'COMPLETED' : 'PENDING' },
    { stage: 4, name: 'Collected by Vehicle', status: ['COLLECTED', 'IN_TRANSIT', 'AT_SORTING_CENTER', 'AT_RECYCLING_FACILITY', 'RECOVERED', 'COMPLETED'].includes(journey.status) ? 'COMPLETED' : journey.status === 'PICKUP_SCHEDULED' ? 'ACTIVE' : 'PENDING' },
    { stage: 5, name: 'Sorting / MRF Facility', status: ['AT_SORTING_CENTER', 'AT_RECYCLING_FACILITY', 'RECOVERED', 'COMPLETED'].includes(journey.status) ? 'COMPLETED' : ['COLLECTED', 'IN_TRANSIT'].includes(journey.status) ? 'ACTIVE' : 'PENDING' },
    { stage: 6, name: 'Recycled / Recovered', status: ['RECOVERED', 'COMPLETED'].includes(journey.status) ? 'COMPLETED' : journey.status === 'AT_RECYCLING_FACILITY' ? 'ACTIVE' : 'PENDING' },
    { stage: 7, name: 'EcoPoints Earned', status: journey.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING' }
  ];

  return res.json({
    success: true,
    journeyId: journey.journeyId,
    itemName: journey.itemName,
    category: journey.category,
    currentStatus: journey.status,
    isReusable: journey.isReusable,
    pickupOrigin: journey.pickupAddress,
    destination: facility ? facility.name : journey.destinationName,
    facilityLocation: facility ? facility.location : 'Sector 4 Industrial Park',
    vehicle: vehicle ? {
      vehicleNumber: vehicle.vehicleNumber,
      driverName: vehicle.driverName,
      currentLocation: vehicle.currentLocation,
      status: vehicle.currentStatus
    } : null,
    tracking: {
      status: journey.status,
      currentLocation: vehicle ? vehicle.currentLocation : { address: 'In transit to facility', lat: 17.44, lng: 78.38 }
    },
    estimatedArrival: 'Today • 3:45 PM',
    stages,
    prototypeDisclaimer: 'Prototype mock tracking feed • GPS and vehicle telematics ready for municipal API integration'
  });
}

/**
 * POST /api/journeys/:id/verify
 */
export function verifyJourney(req, res) {
  try {
    const journey = db.getJourneyById(req.params.id);
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }

    if (journey.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const verification = db.createVerification({
      journeyId: journey.id,
      verificationType: req.body.verificationType || 'FACILITY_RFID_CHECKIN',
      verifiedBy: req.body.verifiedBy || 'EcoSort Partner MRF Scanner #02'
    });

    // Advance journey to COMPLETED with note
    const updatedJourney = db.updateJourneyStatus(
      journey.id,
      'COMPLETED',
      `Verified by: ${verification.verifiedBy} (${verification.verificationType})`
    );

    // Award +50 EcoPoints upon verification (protected against duplicate rewards)
    const ptRes = db.addPointTransaction(req.user.id, 'RECOVERY_VERIFIED', 50, journey.id);

    if (ptRes && !ptRes.duplicate) {
      db.createNotification(
        req.user.id,
        'VERIFICATION_COMPLETE',
        'Disposal Journey Verified!',
        `Journey #${journey.journeyId} (${journey.itemName}) was verified by partner facility. +50 EcoPoints unlocked!`
      );
    }

    const pointsAwarded = (ptRes && !ptRes.duplicate) ? 50 : 0;

    return res.json({
      success: true,
      message: pointsAwarded > 0
        ? 'Waste journey successfully verified and EcoPoints awarded.'
        : 'Waste journey verified (points previously awarded for this journey).',
      verification,
      journey: updatedJourney || db.getJourneyById(journey.id),
      pointsAwarded,
      ecoPointsAwarded: pointsAwarded,
      newBalance: ptRes.currentBalance,
      currentBalance: ptRes.currentBalance,
      alreadyAwarded: Boolean(ptRes && ptRes.duplicate)
    });
  } catch (err) {
    console.error('[Verify Journey Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify waste journey',
      details: err.message
    });
  }
}
