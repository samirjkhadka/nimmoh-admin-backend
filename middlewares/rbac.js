const { pool } = require("../config/db");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get user's role and permissions
      const result = await pool.query(
        `
        SELECT p.name as permission_name
        FROM admin_users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1
      `,
        [userId]
      );

      const userPermissions = result.rows || result[0]; // depending on how your db.query is returning

      const hasPermission = userPermissions.some(
        (permission) => permission.permission_name === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "RBAC: Internal server error",
      });
    }
  };
};

const logActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const action = req.method + " " + req.originalUrl;
    const ipAddress = req.ip;

    // Log the activity into the activity logs table
    await pool.query(
      `
      INSERT INTO user_activity_logs (user_id, action, source_ip, request_payload)
      VALUES ($1, $2, $3, $4)
    `,
      [userId, action, ipAddress, JSON.stringify(req.body)]
    );

    next();
  } catch (error) {
    console.error("Activity logging error:", error);
    next();
  }
};

module.exports = {
  checkPermission,
  logActivity,
};
