const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, check2FA } = require('../middlewares/auth');

// Login routes
router.post('/login', authController.login);
router.post('/verify-2fa', check2FA, authController.verify2FA);

// Password routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);

// Logout route
router.post('/logout', authenticate, authController.logout);

module.exports = router; 