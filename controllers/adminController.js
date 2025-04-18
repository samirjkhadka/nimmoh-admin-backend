const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const transporter = require("../config/mail");
const sendResponse = require("../utils/responseUtils");
const generateAccessToken = require("../utils/jwtUtils");
const {
  passwordChangedEmail,
  passwordResetEmail,
} = require("../utils/emailTemplates");
const { getUserById, getUserByEmail } = require("../utils/userHelper");
const {
  checkIfEmailExists,
  insertPendingRequest,
  getPendingRequests,
  getPendingRequestById,
  applyApprovedAction,
  finalizeRequest,
  getUserEmailById
} = require('../models/adminUserModel');

// Get Profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    return sendResponse(res, "success", "Profile fetched successfully", 200, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;
  try {
    await pool.query("UPDATE admin_users SET full_name = $1 WHERE id = $2", [
      name,
      userId,
    ]);

    return sendResponse(res, "success", "Profile updated successfully", 200, {
      name,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const platform = req.headers["user-agent"] || "unknown";

  try {
    const user = await getUserById(userId);
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE admin_users SET password = $1, is_first_login = false WHERE id = $2",
      [hashedPassword, userId]
    );

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      ...passwordChangedEmail(user.name),
    });

    await pool.query(
      `INSERT INTO user_activity_logs (user_id, action, description, source_ip, platform) VALUES ($1, $2, $3, $4, $5)`,
      [userId, "password_change", "Password changed successfully", ip, platform]
    );

    return sendResponse(res, "success", "Password changed successfully", 200, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: {
        accessToken: generateAccessToken(user),
      },
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.requestCreateAdminUser = async (req, res) => {
  try {
    const { name, email, phone, role_id } = req.body;

    if (await checkIfEmailExists(email)) {
      return errorResponse(res, 'Email already exists', 400);
    }
console.log(req.body);
    
 // 1. Generate password
 const plainPassword = crypto.randomBytes(4).toString('hex'); // 8 char random password
 const hashedPassword = await bcrypt.hash(plainPassword, 10);


await insertPendingRequest('create', { name, email, phone, role_id, requested_by: req.user.id, password:hashedPassword });

    return sendResponse(res,'Success' ,'Create request submitted', 200);
  } catch (err) {
    console.error('Create request error:', err);
    return sendResponse(res, 'error','Create request error', 500);
  }
};

exports.listPendingUsers = async (req, res) => {
  try {
    const data = await getPendingRequests();
    return sendResponse(res, 'Pending users fetched', data);
  } catch (err) {
    console.error('List pending error:', err);
    return sendResponse(res);
  }
};


exports.approveOrRejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const record = await getPendingRequestById(id);
    if (!record) return sendResponse(res, 'Request not found', 404);

    if (action === 'approve') {
      await applyApprovedAction(record);
    }

    await finalizeRequest(id, action, req.user.id);
    return sendResponse(res, `Request ${action}d successfully`);
  } catch (err) {
    console.error('Approve/reject error:', err);
    return sendResponse(res);
  }
};


exports.requestUpdateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    await insertPendingRequest('update', {
      name, phone, target_user_id: id, requested_by: req.user.id
    });

    return sendResponse(res, 'Update request submitted');
  } catch (err) {
    console.error('Update request error:', err);
    return sendResponse(res);
  }
};


exports.requestBlockAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['block', 'unblock'].includes(action)) {
      return sendResponse(res, 'Invalid action', 400);
    }

    await insertPendingRequest(action, {
      target_user_id: id, requested_by: req.user.id
    });

    return sendResponse(res, `${action} request submitted`);
  } catch (err) {
    console.error('Block/unblock request error:', err);
    return sendResponse(res);
  }
};


exports.requestRoleChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    await insertPendingRequest('change_role', {
      role_id, target_user_id: id, requested_by: req.user.id
    });

    return sendResponse(res, 'Role change request submitted');
  } catch (err) {
    console.error('Role change request error:', err);
    return sendResponse(res);
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { id } = req.params;

    const email = await getUserEmailById(id);
    if (!email) return errorResponse(res, 'User not found', 404);

    await insertPendingRequest('reset_password', {
      email, target_user_id: id, requested_by: req.user.id
    });

    return sendResponse(res, 'Password reset request submitted');
  } catch (err) {
    console.error('Password reset request error:', err);
    return sendResponse(res);
  }
};