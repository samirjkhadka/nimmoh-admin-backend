const { pool, reconnect } = require('../config/db');
const crypto = require('crypto');

// Request logger middleware
exports.requestLogger = async (req, res, next) => {
  const start = Date.now();

  try {
    // Log request
    await pool.query(
      `INSERT INTO request_logs 
       (endpoint, method, request_payload, user_id, source_ip, source_platform) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.url,
        req.method,
        JSON.stringify({
          headers: req.headers,
          body: req.body,
          query: req.query,
          params: req.params
        }),
        req.user?.id || null,
        req.ip,
        req.headers['user-agent']
      ]
    ).catch(async (error) => {
      console.error('Request logging error:', error);
      // Attempt to reconnect if it's a connection error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        await reconnect();
      }
    });

    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to log response
    res.json = function (body) {
      const responseTime = Date.now() - start;
      
      // Log response
      pool.query(
        `UPDATE request_logs 
         SET response_payload = $1, 
             status_code = $2
         WHERE endpoint = $3 
         AND method = $4 
         AND created_at = (
           SELECT MAX(created_at) 
           FROM request_logs 
           WHERE endpoint = $3 
           AND method = $4
         )`,
        [
          JSON.stringify(body),
          res.statusCode,
          req.url,
          req.method
        ]
      ).catch(async (error) => {
        console.error('Response logging error:', error);
        // Attempt to reconnect if it's a connection error
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          await reconnect();
        }
      });

      return originalJson.call(this, body);
    };

    res.send = function (body) {
      const responseTime = Date.now() - start;
      
      // Log response
      pool.query(
        `UPDATE request_logs 
         SET response_payload = $1, 
             status_code = $2
         WHERE endpoint = $3 
         AND method = $4 
         AND created_at = (
           SELECT MAX(created_at) 
           FROM request_logs 
           WHERE endpoint = $3 
           AND method = $4
         )`,
        [
          body,
          res.statusCode,
          req.url,
          req.method
        ]
      ).catch(async (error) => {
        console.error('Response logging error:', error);
        // Attempt to reconnect if it's a connection error
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          await reconnect();
        }
      });

      return originalSend.call(this, body);
    };

    next();
  } catch (error) {
    console.error('Request logger error:', error);
    next();
  }
};
