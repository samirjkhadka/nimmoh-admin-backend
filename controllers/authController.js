// backend/controllers/auth.controller.js

const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { JWT_SECRET, TOKEN_EXPIRY, BASE_URL } = require("../config/jwt");

const getUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM admin_users WHERE email = $1", [email]);
  return result.rows[0];
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const platform = req.headers["user-agent"] || "unknown";

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.two_fa_enabled) {
      const secret = speakeasy.generateSecret();
      await pool.query("UPDATE admin_users SET two_fa_secret = $1, two_fa_enabled = true WHERE id = $2", [secret.base32, user.id]);
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      return res.status(200).json({ twoFASetup: true, qrCodeUrl });
    }

    return res.status(200).json({ twoFAVerify: true, userId: user.id });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.verify2FA = async (req, res) => {
  const { userId, token } = req.body;
  const ip = req.ip;
  const platform = req.headers["user-agent"] || "unknown";

  try {
    const result = await pool.query("SELECT * FROM admin_users WHERE id = $1", [userId]);
    const user = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: "base32",
      token,
    });

    if (!verified) return res.status(401).json({ message: "Invalid 2FA token" });

    const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    await pool.query(
      "INSERT INTO user_activity_logs (user_id, activity, source_ip, platform) VALUES ($1, $2, $3, $4)",
      [userId, "Logged in", ip, platform]
    );

    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    console.error("2FA Verification Error:", error);
    res.status(500).json({ message: "2FA verification failed", error: error.message });
  }
};

exports.logout = async (req, res) => {
  const userId = req.user.id;
  const ip = req.ip;
  const platform = req.headers["user-agent"] || "unknown";

  try {
    await pool.query(
      "INSERT INTO user_activity_logs (user_id, activity, source_ip, platform) VALUES ($1, $2, $3, $4)",
      [userId, "Logged out", ip, platform]
    );
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const ip = req.ip;
  const platform = req.headers["user-agent"] || "unknown";

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      "UPDATE admin_users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expiry, email]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nimmoh@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `${BASE_URL}/reset-password?token=${token}`;
    const mailOptions = {
      from: "Nimmoh <nimmoh@gmail.com>",
      to: email,
      subject: "Password Reset",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to send reset email", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const ip = req.ip;
  const platform = req.headers["user-agent"] || "unknown";

  try {
    const result = await pool.query(
      "SELECT * FROM admin_users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE admin_users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashed, user.id]
    );

    await pool.query(
      "INSERT INTO user_activity_logs (user_id, activity, source_ip, platform) VALUES ($1, $2, $3, $4)",
      [user.id, "Password Reset", ip, platform]
    );

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};
