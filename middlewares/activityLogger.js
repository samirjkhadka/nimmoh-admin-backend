const { pool, reconnect } = require('../config/db');

// Activity logger middleware
exports.activityLogger = async (req, res, next) => {
  // Only log activities for authenticated users
  if (!req.user) {
    return next();
  }

  const activity = {
    user_id: req.user.id,
    action: req.method + ' ' + req.url,
    description: JSON.stringify({
      params: req.params,
      query: req.query,
      body: req.method === 'GET' ? null : req.body
    }),
    source_ip: req.ip,
    source_platform: req.headers['user-agent'] || 'unknown'
  };

  // Log activity asynchronously
  pool.query(
    `INSERT INTO user_activity_logs 
     (user_id, action, description, source_ip, source_platform) 
     VALUES ($1, $2, $3, $4, $5)`,
    [
      activity.user_id,
      activity.action,
      activity.description,
      activity.source_ip,
      activity.source_platform
    ]
  ).catch(async (error) => {
    console.error('Activity logging error:', error);
    // Attempt to reconnect if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      await reconnect();
    }
  });

  next();
};
