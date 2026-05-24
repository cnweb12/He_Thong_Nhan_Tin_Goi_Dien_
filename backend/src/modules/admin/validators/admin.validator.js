/**
 * Admin validators - Validate admin requests
 */

/**
 * Validate pagination parameters
 * @param {Object} req - Express request
 * @returns {Object} Validation result
 */
function validatePaginationParams(req) {
  const errors = [];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (page < 1) {
    errors.push({ field: "page", message: "Page must be greater than 0" });
  }

  if (limit < 1 || limit > 100) {
    errors.push({ field: "limit", message: "Limit must be between 1 and 100" });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: { page, limit },
  };
}

/**
 * Validate user lock/unlock request
 * @param {Object} req - Express request
 * @returns {Object} Validation result
 */
function validateUserLockRequest(req) {
  const errors = [];
  const { userId } = req.params;

  if (!userId || typeof userId !== "string") {
    errors.push({ field: "userId", message: "Valid userId is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate role change request
 * @param {Object} req - Express request
 * @returns {Object} Validation result
 */
function validateRoleChangeRequest(req) {
  const errors = [];
  const { userId } = req.params;
  const { role } = req.body;

  if (!userId || typeof userId !== "string") {
    errors.push({ field: "userId", message: "Valid userId is required" });
  }

  if (!role || typeof role !== "string") {
    errors.push({ field: "role", message: "Role is required" });
  } else if (!["user", "admin", "super_admin"].includes(role)) {
    errors.push({
      field: "role",
      message: "Role must be one of: user, admin, super_admin",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate message search filters
 * @param {Object} req - Express request
 * @returns {Object} Validation result
 */
function validateMessageSearchFilters(req) {
  const errors = [];
  const { conversationId, senderId, startDate, endDate } = req.query;

  if (conversationId && typeof conversationId !== "string") {
    errors.push({ field: "conversationId", message: "Invalid conversationId" });
  }

  if (senderId && typeof senderId !== "string") {
    errors.push({ field: "senderId", message: "Invalid senderId" });
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push({ field: "startDate", message: "Invalid startDate format" });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push({ field: "endDate", message: "Invalid endDate format" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate system settings update
 * @param {Object} req - Express request
 * @returns {Object} Validation result
 */
function validateSystemSettingsUpdate(req) {
  const errors = [];
  const { settings } = req.body;

  if (!settings || typeof settings !== "object") {
    errors.push({ field: "settings", message: "Settings object is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate banned keyword request
 * @param {Object} req - Express request
 * @returns {Object} Validation result
 */
function validateBannedKeywordRequest(req) {
  const errors = [];
  const { keyword } = req.body;

  if (!keyword || typeof keyword !== "string") {
    errors.push({ field: "keyword", message: "Keyword is required" });
  } else if (keyword.trim().length === 0) {
    errors.push({ field: "keyword", message: "Keyword cannot be empty" });
  } else if (keyword.length > 100) {
    errors.push({ field: "keyword", message: "Keyword must be less than 100 characters" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validatePaginationParams,
  validateUserLockRequest,
  validateRoleChangeRequest,
  validateMessageSearchFilters,
  validateSystemSettingsUpdate,
  validateBannedKeywordRequest,
};
