/**
 * Auth controllers - Handle authentication endpoints
 */

const { UserModel } = require("../../users/models/user.model");
const { RefreshTokenModel } = require("../models/refresh-token.model");
const { UserDeviceModel } = require("../../devices/models/user-device.model");
const authService = require("../services/auth.service");
const authMiddleware = require("../middleware/auth.middleware");
const validators = require("../validators/auth.validator");
const config = require("../../../config/env");

/**
 * Register new user
 * @route POST /auth/register
 */
async function register(req, res, next) {
  try {
    const validation = validators.validateRegisterRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { phone, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ phone });
    if (existingUser) {
      const error = new Error("User with this phone already exists");
      error.statusCode = 409;
      return next(error);
    }

    // Hash password
    const passwordHash = authMiddleware.hashToken(password);

    // Create user
    const now = new Date();
    const user = await UserModel.create({
      phone,
      username: phone, // Use phone as default username
      displayName,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({
      ok: true,
      data: {
        userId: user._id,
        phone: user.phone,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * @route POST /auth/login
 */
async function login(req, res, next) {
  try {
    const validation = validators.validateLoginRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { phone, password, deviceId, platform = "web" } = req.body;

    // Find user
    const user = await UserModel.findOne({ phone });
    if (!user) {
      const error = new Error("Invalid phone or password");
      error.statusCode = 401;
      return next(error);
    }

    // Verify password
    const passwordHash = authMiddleware.hashToken(password);
    if (passwordHash !== user.passwordHash) {
      const error = new Error("Invalid phone or password");
      error.statusCode = 401;
      return next(error);
    }

    // Create or update device
    await UserDeviceModel.updateOne(
      { userId: user._id, deviceId },
      {
        $set: {
          userId: user._id,
          deviceId,
          platform,
          isOnline: true,
          lastActiveAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Generate tokens
    const accessToken = authMiddleware.generateJWTToken(
      { userId: user._id.toString(), phone },
      config.jwtSecret,
      3600 // 1 hour
    );

    const refreshToken = authMiddleware.generateToken(32);
    const refreshTokenHash = authMiddleware.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save refresh token
    await authService.createRefreshToken({
      userId: user._id,
      deviceId,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    res.json({
      ok: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          userId: user._id,
          phone: user.phone,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * @route POST /auth/refresh
 */
async function refreshAccessToken(req, res, next) {
  try {
    const validation = validators.validateRefreshTokenRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { refreshToken, deviceId } = req.body;

    // Verify refresh token
    const refreshTokenHash = authMiddleware.hashToken(refreshToken);
    const storedToken = await RefreshTokenModel.findOne({
      deviceId,
      tokenHash: refreshTokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      const error = new Error("Invalid or expired refresh token");
      error.statusCode = 401;
      return next(error);
    }

    // Find user
    const user = await UserModel.findById(storedToken.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    // Generate new access token
    const accessToken = authMiddleware.generateJWTToken(
      { userId: user._id.toString(), phone: user.phone },
      config.jwtSecret,
      3600 // 1 hour
    );

    res.json({
      ok: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout from current device
 * @route POST /auth/logout
 * @auth required
 */
async function logout(req, res, next) {
  try {
    const { userId } = req.user;
    const { deviceId } = req.body;

    if (!deviceId) {
      const error = new Error("Device ID is required");
      error.statusCode = 400;
      return next(error);
    }

    // Revoke refresh token
    await authService.revokeRefreshToken(userId, deviceId);

    res.json({
      ok: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout from all devices
 * @route POST /auth/logout-all
 * @auth required
 */
async function logoutAll(req, res, next) {
  try {
    const { userId } = req.user;

    // Revoke all refresh tokens
    await authService.revokeAllUserRefreshTokens(userId);

    res.json({
      ok: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 * @route GET /auth/me
 * @auth required
 */
async function getProfile(req, res, next) {
  try {
    const { userId } = req.user;

    const user = await UserModel.findById(userId).select("-passwordHash");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      ok: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 * @route PATCH /auth/profile
 * @auth required
 */
async function updateProfile(req, res, next) {
  try {
    const { userId } = req.user;

    const validation = validators.validateUpdateProfileRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const updateData = {};
    if (req.body.displayName) updateData.displayName = req.body.displayName;
    if (req.body.avatarUrl) updateData.avatarUrl = req.body.avatarUrl;

    const user = await UserModel.findByIdAndUpdate(userId, updateData, { new: true }).select("-passwordHash");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      ok: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 * @route POST /auth/change-password
 * @auth required
 */
async function changePassword(req, res, next) {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      const error = new Error("All password fields are required");
      error.statusCode = 400;
      return next(error);
    }

    if (newPassword.length < 6) {
      const error = new Error("New password must be at least 6 characters");
      error.statusCode = 400;
      return next(error);
    }

    if (newPassword !== confirmPassword) {
      const error = new Error("Passwords do not match");
      error.statusCode = 400;
      return next(error);
    }

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    // Verify current password
    const currentPasswordHash = authMiddleware.hashToken(currentPassword);
    if (currentPasswordHash !== user.passwordHash) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 401;
      return next(error);
    }

    // Update password
    const newPasswordHash = authMiddleware.hashToken(newPassword);
    await UserModel.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });

    // Revoke all refresh tokens for security
    await authService.revokeAllUserRefreshTokens(userId);

    res.json({
      ok: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
};
