const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateToken, check2FA } = require("../middlewares/authMiddleware");

//Auth Routes
router.post("/login", authController.login);
router.post("/verify-2fa", authController.verify2FA);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", validateToken, authController.changePassword);
router.post("/logout", validateToken, authController.logout);

module.exports = router;
