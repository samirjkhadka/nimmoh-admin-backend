const db = require('../config/database');
const { hashPassword, comparePasswords } = require('../utils/passwordUtils');
const { logActivity } = require('../middlewares/rbac');

const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const [user] = await db.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.last_login,
               r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `, [userId]);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { first_name, last_name } = req.body;

      await db.query(`
        UPDATE users
        SET first_name = ?, last_name = ?
        WHERE id = ?
      `, [first_name, last_name, userId]);

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all users (admin only)
  getAllUsers: async (req, res) => {
    try {
      const [users] = await db.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.last_login,
               r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
      `);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create new user (admin only)
  createUser: async (req, res) => {
    try {
      const { email, password, first_name, last_name, role_id } = req.body;

      // Check if user already exists
      const [existingUser] = await db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const [result] = await db.query(`
        INSERT INTO users (email, password, first_name, last_name, role_id)
        VALUES (?, ?, ?, ?, ?)
      `, [email, hashedPassword, first_name, last_name, role_id]);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        userId: result.insertId
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update user (admin only)
  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const { email, first_name, last_name, role_id, status } = req.body;

      await db.query(`
        UPDATE users
        SET email = ?, first_name = ?, last_name = ?, role_id = ?, status = ?
        WHERE id = ?
      `, [email, first_name, last_name, role_id, status, userId]);

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;

      await db.query('DELETE FROM users WHERE id = ?', [userId]);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = userController; 