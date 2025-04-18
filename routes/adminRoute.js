const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, check2FA } = require('../middlewares/auth');

// Login routes
router.get('/getprofile',authenticate, adminController.getProfile);
router.post('/updateProfile', authenticate, adminController.updateProfile);

// Password routes
router.post('/adminChangePassword',authenticate, adminController.changePassword);


module.exports = router; 