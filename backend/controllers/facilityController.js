import { db } from '../db.js';

export function getFacilities(_req, res) {
  return res.json({
    success: true,
    facilities: db.getFacilities(),
    prototypeNotice: 'Prototype partner facilities • Replaceable with certified regional circular partners'
  });
}

export function getFacilityById(req, res) {
  const facility = db.getFacilityById(req.params.id);
  if (!facility) {
    return res.status(404).json({ success: false, error: 'Facility not found' });
  }
  return res.json({ success: true, facility });
}

export function getVehicles(_req, res) {
  return res.json({
    success: true,
    vehicles: db.getVehicles(),
    prototypeNotice: 'Prototype fleet telematics • Connects with GPS IoT devices in production'
  });
}

export function getVehicleById(req, res) {
  const vehicle = db.getVehicleById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }
  return res.json({ success: true, vehicle });
}
