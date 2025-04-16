// backend/middlewares/authMiddleware.js

const jwt = require("jsonwebtoken");
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../config/jwt');
const speakeasy = require('speakeasy');

// Middleware to protect routes and enforce inactivity timeout
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check for inactivity (15 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.iat && now - decoded.iat > 15 * 60) {
      return res.status(401).json({ message: 'Session expired due to inactivity' });
    }

    // Check if session is valid
    const sessionResult = await pool.query(
      'SELECT * FROM login_sessions WHERE token = $1 AND is_active = true AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // Attach user info to request
    req.user = decoded;
    req.session = sessionResult.rows[0];

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access control middleware
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// 2FA verification middleware
exports.check2FA = async (req, res, next) => {
  try {
    const { userId, token } = req.body;

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid 2FA token' });
    }

    next();
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
