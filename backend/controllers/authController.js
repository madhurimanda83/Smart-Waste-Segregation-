import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken } from '../middleware/auth.js';

export async function register(req, res) {
  try {
    const { fullName, mobileNumber, location, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email address, and password are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check existing mobile number
    const existingMobile = mobileNumber ? db.findUserByMobile(mobileNumber.trim()) : null;
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        error: 'A user with this mobile number already exists.'
      });
    }

    // Check existing email if provided
    if (email) {
      const existingEmail = db.findUserByEmail(email.trim());
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: 'A user with this email address already exists.'
        });
      }
    }

    // Securely hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = db.createUser({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber ? mobileNumber.trim() : null,
      location: (location || 'Curbside Zone A').trim(),
      email: email ? email.trim() : null,
      passwordHash
    });

    // Welcome bonus notification
    db.createNotification(
      newUser.id,
      'WELCOME',
      'Welcome to EcoSort!',
      'Your account is active. Scan waste items to verify responsible disposal and earn EcoPoints.'
    );

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
      details: err.message
    });
  }
}

export async function login(req, res) {
  try {
    const { identifier, mobileNumber, email, password } = req.body;
    const loginId = (identifier || mobileNumber || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email or mobile number, and password.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (loginId.includes('@') && !emailRegex.test(loginId)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    // Search user by mobile or email
    let user = db.findUserByEmail(loginId) || db.findUserByMobile(loginId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/mobile number or password.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/mobile number or password.'
      });
    }

    const safeUser = db.sanitizeUser(user);
    const token = generateToken(safeUser);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      details: err.message
    });
  }
}

export function logout(_req, res) {
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
}

export function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}
