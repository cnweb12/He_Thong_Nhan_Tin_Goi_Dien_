const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { authenticateJWT } = require("../middleware/auth.middleware");
const { authLimiter } = require("../../../middleware/rate-limit.middleware");
const config = require("../../../config/env");

const router = Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", authController.refreshAccessToken);

// Protected routes
router.post("/logout", authenticateJWT(config.jwtSecret), authController.logout);
router.post("/logout-all", authenticateJWT(config.jwtSecret), authController.logoutAll);
router.get("/me", authenticateJWT(config.jwtSecret), authController.getProfile);
router.patch("/profile", authenticateJWT(config.jwtSecret), authController.updateProfile);
router.post("/change-password", authenticateJWT(config.jwtSecret), authController.changePassword);

module.exports = router;
