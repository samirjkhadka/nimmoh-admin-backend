const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const transporter = require('../config/mail');
const { passwordResetEmail, passwordChangedEmail } = require('../utils/emailTemplates');
const { JWT_SECRET, TOKEN_EXPIRY, BASE_URL } = require('../config/jwt');
const sendResponse = require('../utils/responseUtils');

// Helper function to get user by email
const getUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM admin_users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

// Login controller
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const platform = req.headers['user-agent'] || 'unknown';



  try {
    // Get user from database
    const user = await getUserByEmail(email);
  
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }


    console.log(user.password)
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (!user.two_fa_secret) {
      // Generate 2FA secret
      const secret = speakeasy.generateSecret({
        name: `Nimmoh:${user.email}`
      });

      // Update user with 2FA secret
      await pool.query(
        'UPDATE admin_users SET two_fa_secret = $1 WHERE id = $2',
        [secret.base32, user.id]
      );

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      return res.status(200).json({
        message: '2FA setup required',
        twoFASetup: true,
        qrCodeUrl,
        userId: user.id
      });
    }

    // If 2FA is enabled, return success with 2FA verification required
    return res.status(200).json({
      message: '2FA verification required',
      twoFAVerify: true,
      userId: user.id
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 2FA verification controller
exports.verify2FA = async (req, res) => {
  const { userId, token } = req.body;
  const ip = req.ip;
  const platform = req.headers['user-agent'] || 'unknown';

  try {
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

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Create login session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

 
    await pool.query(
      `INSERT INTO login_sessions 
       (user_id, token, expires_at, source_ip, source_platform) 
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, jwtToken, expiresAt, ip, platform]
    );


    // If first login, require password change
    if (user.is_first_login) {
      return res.status(200).json({
        message: 'First login detected. Please change your password.',
        firstLogin: true,
        token: jwtToken
      });
    }

    // Return success with token and user info
    return res.status(200).json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout controller
exports.logout = async (req, res) => {
  const userId = req.user.id;
  const token = req.headers.authorization.split(' ')[1];
  const ip = req.ip;
  const platform = req.headers['user-agent'] || 'unknown';

  try {
    // Update login session
    await pool.query(
      'UPDATE login_sessions SET expires_at = NOW() WHERE user_id = $1 AND token = $2',
      [userId, token]
    );

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Forgot password controller
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const ip = req.ip;
  const platform = req.headers['user-agent'] || 'unknown';

  try {
    // Get user from database
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    // Update user with reset token
    await pool.query(
      'UPDATE admin_users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Generate reset link
    const resetLink = `${BASE_URL}/reset-password?token=${resetToken}`;

    // Send reset email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      ...passwordResetEmail(user.name, resetLink)
    };

    await transporter.sendMail(mailOptions);

    // Log activity
    await pool.query(
      `INSERT INTO user_activity_logs 
       (user_id, action, description, source_ip, source_platform) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'forgot_password_request',
        'Password reset requested',
        ip,
        platform
      ]
    );

    return res.status(200).json({ 
      message: 'Password reset email sent successfully' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset password controller
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const ip = req.ip;
  const platform = req.headers['user-agent'] || 'unknown';

  try {
    // Get user with valid reset token
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await pool.query(
      `UPDATE admin_users 
       SET password_hash = $1, 
           reset_token = NULL, 
           reset_token_expiry = NULL,
           is_first_login = false 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Send password changed notification
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      ...passwordChangedEmail(user.name)
    };

    await transporter.sendMail(mailOptions);

    // Log activity
    await pool.query(
      `INSERT INTO user_activity_logs 
       (user_id, action, description, source_ip, source_platform) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'password_reset',
        'Password reset successful',
        ip,
        platform
      ]
    );

    return res.status(200).json({ 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Change password controller
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const platform = req.headers['user-agent'] || 'unknown';

  try {
    // Get user from database
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      'UPDATE admin_users SET password = $1, is_first_login = false WHERE id = $2',
      [hashedPassword, userId]
    );

    // Send password changed notification
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      ...passwordChangedEmail(user.name)
    };

    await transporter.sendMail(mailOptions);

    // Log activity
    await pool.query(
      `INSERT INTO user_activity_logs 
       (user_id, action, description, source_ip, platform) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'password_change',
        'Password changed successfully',
        ip,
        platform
      ]
    );

    return sendResponse (res, 'success', 'Password changed successfully', 200, {
      user:{
        id: user.id,
        name: user.name,
      email: user.email, role: user.role},
   
    
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 