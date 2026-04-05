/**
 * Có nhiệm vụ chặn và kiểm tra request trước khi cho vào service 
 * trả về hoặc là isValid, hoặc là array các error theo field thể hiện vi phạm ở đâu
*/

/**
 * Hàm kiểm tra tham số cho request get user
 */
function validateGetUserParams(req) {
  const errors = [];
  const { userId } = req.params || {};

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    errors.push({ field: "userId", message: "User ID is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateSearchUsersQuery(req) {
  const errors = [];
  const q = typeof req.query?.q === "string" ? req.query.q.trim() : "";
  const rawLimit = req.query?.limit;

  if (!q) {
    errors.push({ field: "q", message: "Search query is required" });
  }

  if (q && q.length < 2) {
    errors.push({ field: "q", message: "Search query must be at least 2 characters" });
  }

  if (rawLimit !== undefined) {
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      errors.push({ field: "limit", message: "Limit must be an integer between 1 and 50" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateProfileRequest(req) {
  const errors = [];
  const { username, displayName, avatarUrl } = req.body || {};

  if (username !== undefined) {
    const normalized = String(username || "").trim();
    if (!normalized) {
      errors.push({ field: "username", message: "Username cannot be empty" });
    } else if (!/^[a-zA-Z0-9._]{3,30}$/.test(normalized)) {
      errors.push({
        field: "username",
        message: "Username must be 3-30 characters and only include letters, numbers, dot, or underscore",
      });
    }
  }

  if (displayName !== undefined) {
    const normalized = String(displayName || "").trim();
    if (normalized.length < 2 || normalized.length > 100) {
      errors.push({ field: "displayName", message: "Display name must be between 2 and 100 characters" });
    }
  }

  if (avatarUrl !== undefined && (typeof avatarUrl !== "string" || avatarUrl.trim().length === 0)) {
    errors.push({ field: "avatarUrl", message: "Avatar URL must be a non-empty string" });
  }

  if (username === undefined && displayName === undefined && avatarUrl === undefined) {
    errors.push({
      field: "body",
      message: "At least one profile field is required",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateSettingsRequest(req) {
  const errors = [];
  const body = req.body || {};
  const allowedKeys = ["theme", "language", "allowStrangerMessages"];
  const providedKeys = Object.keys(body);

  if (providedKeys.length === 0) {
    errors.push({ field: "body", message: "At least one settings field is required" });
  }

  const invalidKeys = providedKeys.filter((key) => !allowedKeys.includes(key));
  for (const key of invalidKeys) {
    errors.push({ field: key, message: "Unsupported settings field" });
  }

  if (body.theme !== undefined && !["light", "dark"].includes(body.theme)) {
    errors.push({ field: "theme", message: "Theme must be either 'light' or 'dark'" });
  }

  if (body.language !== undefined) {
    const normalized = String(body.language || "").trim();
    if (!normalized || normalized.length > 10) {
      errors.push({ field: "language", message: "Language must be a non-empty string up to 10 characters" });
    }
  }

  if (body.allowStrangerMessages !== undefined && typeof body.allowStrangerMessages !== "boolean") {
    errors.push({ field: "allowStrangerMessages", message: "allowStrangerMessages must be a boolean" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateGetUserParams,
  validateSearchUsersQuery,
  validateUpdateProfileRequest,
  validateUpdateSettingsRequest,
};
