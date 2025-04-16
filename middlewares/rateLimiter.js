const db = require('../config/database');

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const rateLimiter = async (req, res, next) => {
  const { email } = req.body;
  const ipAddress = req.ip;

  try {
    // Check for existing attempts
    const [attempts] = await db.query(
      `SELECT COUNT(*) as count, MAX(created_at) as last_attempt 
       FROM login_attempts 
       WHERE (email = ? OR ip_address = ?) 
       AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [email, ipAddress]
    );

    const count = attempts[0].count;
    const lastAttempt = attempts[0].last_attempt;

    if (count >= MAX_ATTEMPTS) {
      // Check if account is locked
      const [locked] = await db.query(
        `SELECT locked_until FROM login_attempts 
         WHERE (email = ? OR ip_address = ?) 
         ORDER BY created_at DESC LIMIT 1`,
        [email, ipAddress]
      );

      if (locked.length > 0 && locked[0].locked_until > new Date()) {
        const remainingTime = Math.ceil((locked[0].locked_until - new Date()) / 1000 / 60);
        return res.status(429).json({
          success: false,
          message: `Too many login attempts. Account locked for ${remainingTime} minutes.`,
          locked: true
        });
      }
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
};

const resetRateLimit = async (email, ipAddress) => {
  try {
    await db.query(
      `DELETE FROM login_attempts 
       WHERE email = ? OR ip_address = ?`,
      [email, ipAddress]
    );
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
};

const recordFailedAttempt = async (email, ipAddress) => {
  try {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
    
    await db.query(
      `INSERT INTO login_attempts (email, ip_address, created_at, locked_until) 
       VALUES (?, ?, NOW(), ?)`,
      [email, ipAddress, lockedUntil]
    );
  } catch (error) {
    console.error('Error recording failed attempt:', error);
  }
};

module.exports = {
  rateLimiter,
  resetRateLimit,
  recordFailedAttempt
}; 