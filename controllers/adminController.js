const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const transporter = require('../config/mail');
const sendResponse = require('../utils/responseUtils');
const generateAccessToken = require('../utils/jwtUtils');
const { passwordChangedEmail } = require('../utils/emailTemplates');
const { getUserById, getUserByEmail } = require('../utils/userHelper');

// Get Profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    return sendResponse(res, 'success', 'Profile fetched successfully', 200, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;
  try {
    await pool.query('UPDATE admin_users SET full_name = $1 WHERE id = $2', [name, userId]);

    return sendResponse(res, 'success', 'Profile updated successfully', 200, { name });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const platform = req.headers['user-agent'] || 'unknown';

  try {
    const user = await getUserById(userId);
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admin_users SET password = $1, is_first_login = false WHERE id = $2', [hashedPassword, userId]);

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      ...passwordChangedEmail(user.name)
    });

    await pool.query(
      `INSERT INTO user_activity_logs (user_id, action, description, source_ip, platform) VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'password_change', 'Password changed successfully', ip, platform]
    );

    return sendResponse(res, 'success', 'Password changed successfully', 200, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: {
        accessToken: generateAccessToken(user)
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
