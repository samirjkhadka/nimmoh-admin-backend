const { pool } = require("../config/db");

const checkIfEmailExists = async (email) => {
  const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
  return result.rows.length > 0;
};

const insertPendingRequest = async (action, payload) => {
  const {
    name = null, email = null, phone = null,
    role_id = null, target_user_id = null,
    requested_by, password
  } = payload;

  return pool.query(`
    INSERT INTO admin_users_pending (action, name, email, phone, role_id, target_user_id, created_by, password)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [action, name, email, phone, role_id, target_user_id, requested_by, password]);
};

const getPendingRequests = async () => {
  const [rows] = await pool.query('SELECT * FROM admin_users_pending WHERE status = $1', ['pending']);
  return rows;
};

const getPendingRequestById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM admin_users_pending WHERE id = $1 AND status = $2', [id, 'pending']);
  return rows[0];
};

const applyApprovedAction = async (record) => {
  if (record.action === 'create') {
    const password = Math.random().toString(36).slice(-8);
    const hashed = await require('bcrypt').hash(password, 10);
    await pool.query(`
      INSERT INTO users (name, email, phone, role_id, password)
      VALUES ($1, $2, $3, $4, $5)
    `, [record.name, record.email, record.phone, record.role_id, hashed]);

    await require('../utils/emailTemplates').sendPasswordResetEmail(record.email, password);
  }

  if (record.action === 'update') {
    await pool.query('UPDATE users SET name = $1, phone = $2 WHERE id = $3', [record.name, record.phone, record.target_user_id]);
  }

  if (record.action === 'block') {
    await pool.query('UPDATE users SET is_blocked = true WHERE id = $1', [record.target_user_id]);
  }

  if (record.action === 'unblock') {
    await pool.query('UPDATE users SET is_blocked = false WHERE id = $1', [record.target_user_id]);
  }

  if (record.action === 'change_role') {
    await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [record.role_id, record.target_user_id]);
  }

  if (record.action === 'reset_password') {
    const newPass = Math.random().toString(36).slice(-8);
    const hashed = await require('bcrypt').hash(newPass, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, record.target_user_id]);
    await require('../utils/emailTemplates').sendPasswordResetEmail(record.email, newPass);
  }
};

const finalizeRequest = async (id, action, reviewed_by) => {
  await pool.query(`
    UPDATE admin_users_pending
    SET status = $1, reviewed_by = $2, reviewed_at = NOW()
    WHERE id = $3
  `, [action, reviewed_by, id]);
};

const getUserEmailById = async (id) => {
  const [rows] = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
  return rows[0]?.email || null;
};

module.exports = {
  checkIfEmailExists,
  insertPendingRequest,
  getPendingRequests,
  getPendingRequestById,
  applyApprovedAction,
  finalizeRequest,
  getUserEmailById
};
