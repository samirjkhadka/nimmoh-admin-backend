const db = require('../config/database');

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get user's role and permissions
      const [userPermissions] = await db.query(`
        SELECT p.name as permission_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ?
      `, [userId]);

      const hasPermission = userPermissions.some(
        permission => permission.permission_name === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

const logActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const action = req.method + ' ' + req.originalUrl;
    const ipAddress = req.ip;

    // Log the activity
    await db.query(`
      INSERT INTO activity_logs (user_id, action, ip_address, details)
      VALUES (?, ?, ?, ?)
    `, [userId, action, ipAddress, JSON.stringify(req.body)]);

    next();
  } catch (error) {
    console.error('Activity logging error:', error);
    next();
  }
};

module.exports = {
  checkPermission,
  logActivity
}; 