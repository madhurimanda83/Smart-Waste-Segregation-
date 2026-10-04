import { db } from '../db.js';

export function getProfile(req, res) {
  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.json({
    success: true,
    user: db.sanitizeUser(user)
  });
}

export function updateProfile(req, res) {
  try {
    const { fullName, mobileNumber, email, location } = req.body;

    // Check if new mobile is already taken by someone else
    if (mobileNumber && mobileNumber !== req.user.mobileNumber) {
      const existing = db.findUserByMobile(mobileNumber.trim());
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ success: false, error: 'Mobile number is already in use by another account.' });
      }
    }

    // Check if new email is already taken by someone else
    if (email && email !== req.user.email) {
      const existing = db.findUserByEmail(email.trim());
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ success: false, error: 'Email address is already in use by another account.' });
      }
    }

    const updated = db.updateUser(req.user.id, {
      fullName,
      mobileNumber,
      email,
      location
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated
    });
  } catch (err) {
    console.error('[Update Profile Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: err.message
    });
  }
}
