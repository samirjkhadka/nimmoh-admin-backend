const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate, check2FA } = require("../middlewares/auth");
const { logActivity, checkPermission } = require("../middlewares/rbac");

// profile routes
router.get("/getprofile", authenticate, adminController.getProfile);
router.post("/updateProfile", authenticate, adminController.updateProfile);

// Password routes
router.post(
  "/adminChangePassword",
  authenticate,
  adminController.changePassword
);

//maker create request
router.post(
  "/request-create",
  authenticate,
  checkPermission("admin:create_request"),
  logActivity,
  adminController.requestCreateAdminUser
);

//list all pending users
router.get(
  "/pendingRequests",
  authenticate,
  checkPermission("admin:view_pending"),
  logActivity,
  adminController.listPendingUsers
);

//approve/reject request
router.post(
  "/actionRequest/:id",
  authenticate,
  checkPermission("admin:approve_reject"),
  logActivity,
  adminController.approveOrRejectUser
);

//request update
router.post(
  "/updateRequest/:id",
  authenticate,
  checkPermission("admin:update_request"),
  logActivity,
  adminController.requestUpdateAdminUser
);

//request block/unblock
router.post(
  "/blockRequest/:id",
  authenticate,
  checkPermission("admin:block_request"),
  logActivity,
  adminController.requestBlockAdminUser
);

//request role change
router.post(
  "/roleChangeRequest/:id",
  authenticate,
  checkPermission("admin:role_change_request"),
  logActivity,
  adminController.requestRoleChange
)

//request password reset
router.post(
  "/passwordResetRequest/:id",
  authenticate,
  checkPermission("admin:password_reset_request"),
  logActivity,
  adminController.requestPasswordReset
)


module.exports = router;
