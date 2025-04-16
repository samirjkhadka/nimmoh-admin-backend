const db = require('../config/database');

const dashboardController = {
  // Get dashboard statistics
  getStatistics: async (req, res) => {
    try {
      // Get total users count
      const [usersCount] = await db.query(`
        SELECT COUNT(*) as total_users,
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
               SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users
        FROM users
      `);

      // Get total merchants count
      const [merchantsCount] = await db.query(`
        SELECT COUNT(*) as total_merchants,
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_merchants,
               SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_merchants
        FROM merchants
      `);

      // Get recent activity logs
      const [recentActivities] = await db.query(`
        SELECT al.*, u.email as user_email
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          users: usersCount[0],
          merchants: merchantsCount[0],
          recentActivities
        }
      });
    } catch (error) {
      console.error('Get dashboard statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get activity logs with filters
  getActivityLogs: async (req, res) => {
    try {
      const { startDate, endDate, userId, action } = req.query;
      let query = `
        SELECT al.*, u.email as user_email
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (startDate) {
        query += ' AND al.created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND al.created_at <= ?';
        params.push(endDate);
      }

      if (userId) {
        query += ' AND al.user_id = ?';
        params.push(userId);
      }

      if (action) {
        query += ' AND al.action LIKE ?';
        params.push(`%${action}%`);
      }

      query += ' ORDER BY al.created_at DESC';

      const [logs] = await db.query(query, params);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = dashboardController; 