const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate, check2FA } = require("../middlewares/auth");

//Auth Routes
router.post("/login", authController.login);
router.post("/verify-2fa", authController.verify2FA);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", authenticate, authController.changePassword);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
