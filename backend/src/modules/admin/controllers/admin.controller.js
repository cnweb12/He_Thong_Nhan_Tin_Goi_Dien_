const adminService = require("../services/admin.service");
const validators = require("../validators/admin.validator");
const { UserModel } = require("../../users/models/user.model");

/**
 * Get all users with pagination and filters
 * @route GET /api/admin/users
 */
async function getAllUsers(req, res, next) {
  try {
    const validation = validators.validatePaginationParams(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { page, limit } = validation.data;
    const { role, search } = req.query;

    const result = await adminService.getAllUsers({ page, limit, role, search });

    res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID
 * @route GET /api/admin/users/:userId
 */
async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId) {
      const error = new Error("userId is required");
      error.statusCode = 400;
      return next(error);
    }

    const user = await adminService.getUserById(userId);

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
 * Lock user account
 * @route POST /api/admin/users/:userId/lock
 */
async function lockUser(req, res, next) {
  try {
    const validation = validators.validateUserLockRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { userId } = req.params;

    // Prevent locking self
    if (userId === req.user.userId) {
      const error = new Error("Cannot lock yourself");
      error.statusCode = 400;
      return next(error);
    }

    const user = await adminService.lockUser(userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      ok: true,
      data: user,
      message: "User locked successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unlock user account
 * @route POST /api/admin/users/:userId/unlock
 */
async function unlockUser(req, res, next) {
  try {
    const validation = validators.validateUserLockRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { userId } = req.params;

    const user = await adminService.unlockUser(userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      ok: true,
      data: user,
      message: "User unlocked successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change user role (super admin only)
 * @route PATCH /api/admin/users/:userId/role
 */
async function changeUserRole(req, res, next) {
  try {
    const validation = validators.validateRoleChangeRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { userId } = req.params;
    const { role } = req.body;

    // Prevent changing own role
    if (userId === req.user.userId) {
      const error = new Error("Cannot change your own role");
      error.statusCode = 400;
      return next(error);
    }

    const user = await adminService.changeUserRole(userId, role, req.user.role);

    res.json({
      ok: true,
      data: user,
      message: "User role changed successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all messages with filters
 * @route GET /api/admin/messages
 */
async function getAllMessages(req, res, next) {
  try {
    const validation = validators.validatePaginationParams(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const filterValidation = validators.validateMessageSearchFilters(req);
    if (!filterValidation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = filterValidation.errors;
      return next(error);
    }

    const { page, limit } = validation.data;
    const { conversationId, senderId, startDate, endDate } = req.query;

    const result = await adminService.getAllMessages({
      page,
      limit,
      conversationId,
      senderId,
      startDate,
      endDate,
    });

    res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete message
 * @route DELETE /api/admin/messages/:messageId
 */
async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      const error = new Error("messageId is required");
      error.statusCode = 400;
      return next(error);
    }

    const message = await adminService.deleteMessage(messageId);

    if (!message) {
      const error = new Error("Message not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      ok: true,
      data: message,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system settings
 * @route GET /api/admin/settings
 */
async function getSystemSettings(req, res, next) {
  try {
    const settings = await adminService.getSystemSettings();

    res.json({
      ok: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update system settings
 * @route PATCH /api/admin/settings
 */
async function updateSystemSettings(req, res, next) {
  try {
    const validation = validators.validateSystemSettingsUpdate(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { settings } = req.body;

    const updatedSettings = await adminService.updateSystemSettings(settings);

    res.json({
      ok: true,
      data: updatedSettings,
      message: "System settings updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get banned keywords
 * @route GET /api/admin/banned-keywords
 */
async function getBannedKeywords(req, res, next) {
  try {
    const keywords = await adminService.getBannedKeywords();

    res.json({
      ok: true,
      data: keywords,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add banned keyword
 * @route POST /api/admin/banned-keywords
 */
async function addBannedKeyword(req, res, next) {
  try {
    const validation = validators.validateBannedKeywordRequest(req);
    if (!validation.isValid) {
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = validation.errors;
      return next(error);
    }

    const { keyword } = req.body;

    const newKeyword = await adminService.addBannedKeyword(keyword, req.user.userId);

    res.status(201).json({
      ok: true,
      data: newKeyword,
      message: "Banned keyword added successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove banned keyword
 * @route DELETE /api/admin/banned-keywords/:keyword
 */
async function removeBannedKeyword(req, res, next) {
  try {
    const { keyword } = req.params;

    if (!keyword) {
      const error = new Error("keyword is required");
      error.statusCode = 400;
      return next(error);
    }

    const removedKeyword = await adminService.removeBannedKeyword(keyword);

    if (!removedKeyword) {
      const error = new Error("Banned keyword not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      ok: true,
      data: removedKeyword,
      message: "Banned keyword removed successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  lockUser,
  unlockUser,
  changeUserRole,
  getAllMessages,
  deleteMessage,
  getSystemSettings,
  updateSystemSettings,
  getBannedKeywords,
  addBannedKeyword,
  removeBannedKeyword,
};
