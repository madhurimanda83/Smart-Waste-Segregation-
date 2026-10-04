import { db } from '../db.js';

export function requestCollection(req, res) {
  try {
    const { wasteJourneyId, pickupLocation, preferredDate, preferredTime } = req.body;

    if (!wasteJourneyId) {
      return res.status(400).json({
        success: false,
        error: 'wasteJourneyId is required to schedule a collection pickup.'
      });
    }

    const journey = db.getJourneyById(wasteJourneyId);
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Waste journey not found.' });
    }

    if (journey.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied to this waste journey.' });
    }

    const collection = db.createCollectionRequest({
      wasteJourneyId: journey.id,
      userId: req.user.id,
      pickupLocation: pickupLocation || journey.pickupAddress || req.user.location,
      preferredDate,
      preferredTime
    });

    db.createNotification(
      req.user.id,
      'COLLECTION_SCHEDULED',
      'Collection Pickup Scheduled',
      `Curbside pickup for ${journey.itemName} scheduled for ${collection.preferredDate} (${collection.preferredTime}).`
    );

    const vehicle = journey.vehicleId ? db.getVehicleById(journey.vehicleId) : null;

    return res.status(201).json({
      success: true,
      message: 'Collection pickup requested and scheduled successfully',
      collection,
      collectionRequest: collection,
      vehicle,
      journeyStatus: 'PICKUP_SCHEDULED'
    });
  } catch (err) {
    console.error('[Request Collection Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to request collection',
      details: err.message
    });
  }
}

export function getSchedules(req, res) {
  const { location } = req.query;
  const schedules = db.getSchedules(location);

  return res.json({
    success: true,
    total: schedules.length,
    locationQuery: location || 'All Municipal Zones',
    notice: 'Prototype municipal timetable. Connects to real municipal open data schedules in production.',
    prototypeDisclaimer: 'Prototype municipal timetable. Connects to real municipal open data schedules in production.',
    schedules
  });
}
