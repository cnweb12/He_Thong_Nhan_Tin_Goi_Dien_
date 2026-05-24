const { Router } = require("express");
const adminController = require("../controllers/admin.controller");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const { requireAdmin, requireSuperAdmin } = require("../../auth/middleware/authorization.middleware");
const config = require("../../../config/env");

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateJWT(config.jwtSecret));

// Apply admin role middleware to all admin routes
router.use(requireAdmin());

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/users/:userId", adminController.getUserById);
router.post("/users/:userId/lock", adminController.lockUser);
router.post("/users/:userId/unlock", adminController.unlockUser);

// Role change - super admin only
router.patch("/users/:userId/role", requireSuperAdmin(), adminController.changeUserRole);

// Message management routes
router.get("/messages", adminController.getAllMessages);
router.delete("/messages/:messageId", adminController.deleteMessage);

// System settings routes
router.get("/settings", adminController.getSystemSettings);
router.patch("/settings", adminController.updateSystemSettings);

// Banned keywords routes
router.get("/banned-keywords", adminController.getBannedKeywords);
router.post("/banned-keywords", adminController.addBannedKeyword);
router.delete("/banned-keywords/:keyword", adminController.removeBannedKeyword);

module.exports = router;
