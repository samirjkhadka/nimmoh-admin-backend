const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// Password complexity requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  maxHistory: 5 // Number of previous passwords to store
};

// Check password complexity
exports.checkPasswordComplexity = (password) => {
  const errors = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && 
      !new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars}]`).test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Check if password exists in history
exports.checkPasswordHistory = async (userId, newPassword) => {
  try {
    const result = await pool.query(
      `SELECT password_hash 
       FROM password_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, PASSWORD_REQUIREMENTS.maxHistory]
    );

    for (const record of result.rows) {
      const match = await bcrypt.compare(newPassword, record.password_hash);
      if (match) {
        return true; // Password found in history
      }
    }

    return false; // Password not found in history
  } catch (error) {
    console.error('Password history check error:', error);
    throw error;
  }
};

// Add password to history
exports.addToPasswordHistory = async (userId, passwordHash) => {
  try {
    // Get current history count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM password_history WHERE user_id = $1',
      [userId]
    );

    const count = parseInt(countResult.rows[0].count);

    // If we've reached the max history, delete the oldest entry
    if (count >= PASSWORD_REQUIREMENTS.maxHistory) {
      await pool.query(
        `DELETE FROM password_history 
         WHERE user_id = $1 
         AND created_at = (
           SELECT MIN(created_at) 
           FROM password_history 
           WHERE user_id = $1
         )`,
        [userId]
      );
    }

    // Add new password to history
    await pool.query(
      'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
      [userId, passwordHash]
    );
  } catch (error) {
    console.error('Add to password history error:', error);
    throw error;
  }
};

// Hash password
exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare passwords
exports.comparePasswords = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
