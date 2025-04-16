const express = require('express');
const router = express.Router();
const { rateLimiter, resetRateLimit } = require('../middlewares/rateLimiter');
const { login } = require('../controllers/auth');

router.post('/login', rateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    
    if (result.success) {
      // Reset rate limit on successful login
      await resetRateLimit(email, req.ip);
    }
    
    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}); 