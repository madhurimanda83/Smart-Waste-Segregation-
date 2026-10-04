import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ecosort_jwt_super_secret_hackathon_key_2026';

/**
 * Generate a JWT token for a user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      mobileNumber: user.mobileNumber,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Strict authentication middleware — rejects if token is invalid or missing
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User session expired or user no longer exists.'
      });
    }

    req.user = db.sanitizeUser(user);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
      details: err.message
    });
  }
}

/**
 * Optional authentication middleware — attaches req.user if token is present, but allows guests
 */
export function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findUserById(decoded.id);
      if (user) {
        req.user = db.sanitizeUser(user);
      }
    }
  } catch {
    // Ignore error for optional auth
  }
  next();
}
