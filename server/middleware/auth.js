const jwt = require('jsonwebtoken');
const { get } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'hostelease_super_secure_jwt_secret_key_2026_btech';

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get(
      `SELECT id, name, email, role, student_id, department, year_of_study, gender, phone, created_at 
       FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user account no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// Middleware to restrict route to specific roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This endpoint is restricted to: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
