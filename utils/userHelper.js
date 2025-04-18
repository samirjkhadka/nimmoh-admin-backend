const { pool } = require('../config/db');

// Get user by email
const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
  return result.rows[0];
};

// Get user by ID
const getUserById = async (id) => {
  const result = await pool.query('SELECT * FROM admin_users WHERE id = $1', [id]);
  return result.rows[0];
};

module.exports = {
  getUserByEmail,
  getUserById
};
