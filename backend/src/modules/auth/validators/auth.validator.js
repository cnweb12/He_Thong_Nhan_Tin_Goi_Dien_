/**
 * Auth validators - Request validation schemas and functions
 */

function validateRegisterRequest(req) {
  const { phone, password, passwordConfirm, displayName } = req.body;
  const errors = [];

  if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
    errors.push({ field: "phone", message: "Phone is required and must be a non-empty string" });
  }

  if (!displayName || typeof displayName !== "string" || displayName.trim().length < 2) {
    errors.push({ field: "displayName", message: "Display name is required and must be at least 2 characters" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push({ field: "password", message: "Password is required and must be at least 6 characters" });
  }

  if (password !== passwordConfirm) {
    errors.push({ field: "passwordConfirm", message: "Passwords do not match" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateLoginRequest(req) {
  const { phone, password, deviceId } = req.body;
  const errors = [];

  if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
    errors.push({ field: "phone", message: "Phone is required" });
  }

  if (!password || typeof password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (!deviceId || typeof deviceId !== "string" || deviceId.trim().length === 0) {
    errors.push({ field: "deviceId", message: "Device ID is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateRefreshTokenRequest(req) {
  const { refreshToken, deviceId } = req.body;
  const errors = [];

  if (!refreshToken || typeof refreshToken !== "string") {
    errors.push({ field: "refreshToken", message: "Refresh token is required" });
  }

  if (!deviceId || typeof deviceId !== "string" || deviceId.trim().length === 0) {
    errors.push({ field: "deviceId", message: "Device ID is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateProfileRequest(req) {
  const { displayName, avatarUrl } = req.body;
  const errors = [];

  if (displayName !== undefined && (!displayName || typeof displayName !== "string" || displayName.trim().length < 2)) {
    errors.push({ field: "displayName", message: "Display name must be at least 2 characters" });
  }

  if (avatarUrl !== undefined && (!avatarUrl || typeof avatarUrl !== "string")) {
    errors.push({ field: "avatarUrl", message: "Avatar URL must be a valid string" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateRegisterRequest,
  validateLoginRequest,
  validateRefreshTokenRequest,
  validateUpdateProfileRequest,
};
