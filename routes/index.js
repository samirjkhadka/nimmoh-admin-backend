const express = require('express');
const router = express.Router();
const { checkPermission, logActivity } = require('../middlewares/rbac');
const authController = require('../controllers/auth');
const userController = require('../controllers/userController');
const merchantController = require('../controllers/merchantController');
const dashboardController = require('../controllers/dashboardController');

// Auth routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// User profile routes
router.get('/profile', logActivity, userController.getProfile);
router.put('/profile', logActivity, userController.updateProfile);

// User management routes (admin only)
router.get('/users', logActivity, checkPermission('user_manage'), userController.getAllUsers);
router.post('/users', logActivity, checkPermission('user_manage'), userController.createUser);
router.put('/users/:id', logActivity, checkPermission('user_manage'), userController.updateUser);
router.delete('/users/:id', logActivity, checkPermission('user_manage'), userController.deleteUser);

// Merchant management routes (admin only)
router.get('/merchants', logActivity, checkPermission('merchant_manage'), merchantController.getAllMerchants);
router.get('/merchants/:id', logActivity, checkPermission('merchant_manage'), merchantController.getMerchantById);
router.post('/merchants', logActivity, checkPermission('merchant_manage'), merchantController.createMerchant);
router.put('/merchants/:id', logActivity, checkPermission('merchant_manage'), merchantController.updateMerchant);
router.delete('/merchants/:id', logActivity, checkPermission('merchant_manage'), merchantController.deleteMerchant);

// Dashboard routes
router.get('/dashboard/stats', logActivity, checkPermission('dashboard_view'), dashboardController.getStatistics);
router.get('/dashboard/activity-logs', logActivity, checkPermission('activity_log_view'), dashboardController.getActivityLogs);

module.exports = router; 