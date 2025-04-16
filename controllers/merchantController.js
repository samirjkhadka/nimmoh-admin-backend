const db = require('../config/database');
const { logActivity } = require('../middlewares/rbac');

const merchantController = {
  // Get all merchants
  getAllMerchants: async (req, res) => {
    try {
      const [merchants] = await db.query(`
        SELECT m.*, u.email as created_by_email
        FROM merchants m
        LEFT JOIN users u ON m.created_by = u.id
        ORDER BY m.created_at DESC
      `);

      res.json({
        success: true,
        data: merchants
      });
    } catch (error) {
      console.error('Get all merchants error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get merchant by ID
  getMerchantById: async (req, res) => {
    try {
      const merchantId = req.params.id;
      const [merchant] = await db.query(`
        SELECT m.*, u.email as created_by_email
        FROM merchants m
        LEFT JOIN users u ON m.created_by = u.id
        WHERE m.id = ?
      `, [merchantId]);

      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant not found'
        });
      }

      res.json({
        success: true,
        data: merchant
      });
    } catch (error) {
      console.error('Get merchant error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create new merchant
  createMerchant: async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;
      const createdBy = req.user.id;

      // Check if merchant already exists
      const [existingMerchant] = await db.query(
        'SELECT id FROM merchants WHERE email = ?',
        [email]
      );

      if (existingMerchant.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Merchant already exists'
        });
      }

      // Create merchant
      const [result] = await db.query(`
        INSERT INTO merchants (name, email, phone, address, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [name, email, phone, address, createdBy]);

      res.status(201).json({
        success: true,
        message: 'Merchant created successfully',
        merchantId: result.insertId
      });
    } catch (error) {
      console.error('Create merchant error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update merchant
  updateMerchant: async (req, res) => {
    try {
      const merchantId = req.params.id;
      const { name, email, phone, address, status } = req.body;

      await db.query(`
        UPDATE merchants
        SET name = ?, email = ?, phone = ?, address = ?, status = ?
        WHERE id = ?
      `, [name, email, phone, address, status, merchantId]);

      res.json({
        success: true,
        message: 'Merchant updated successfully'
      });
    } catch (error) {
      console.error('Update merchant error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete merchant
  deleteMerchant: async (req, res) => {
    try {
      const merchantId = req.params.id;

      await db.query('DELETE FROM merchants WHERE id = ?', [merchantId]);

      res.json({
        success: true,
        message: 'Merchant deleted successfully'
      });
    } catch (error) {
      console.error('Delete merchant error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = merchantController; 