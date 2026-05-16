function validateUpsertCurrentDeviceRequest(req) {
  const errors = [];
  const body = req.body || {};

  if (!body.deviceId || typeof body.deviceId !== "string" || body.deviceId.trim().length === 0) {
    errors.push({ field: "deviceId", message: "Device ID is required" });
  }

  if (!body.platform || !["web", "android", "ios"].includes(body.platform)) {
    errors.push({ field: "platform", message: "Platform must be one of: web, android, ios" });
  }

  if (body.pushToken !== undefined && (typeof body.pushToken !== "string" || body.pushToken.trim().length === 0)) {
    errors.push({ field: "pushToken", message: "Push token must be a non-empty string" });
  }

  if (body.isOnline !== undefined && typeof body.isOnline !== "boolean") {
    errors.push({ field: "isOnline", message: "isOnline must be a boolean" });
  }

  if (body.lastActiveAt !== undefined && Number.isNaN(Date.parse(body.lastActiveAt))) {
    errors.push({ field: "lastActiveAt", message: "lastActiveAt must be a valid date string" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateCurrentDevicePresenceRequest(req) {
  const errors = [];
  const body = req.body || {};

  if (!body.deviceId || typeof body.deviceId !== "string" || body.deviceId.trim().length === 0) {
    errors.push({ field: "deviceId", message: "Device ID is required" });
  }

  if (typeof body.isOnline !== "boolean") {
    errors.push({ field: "isOnline", message: "isOnline must be a boolean" });
  }

  if (body.lastActiveAt !== undefined && Number.isNaN(Date.parse(body.lastActiveAt))) {
    errors.push({ field: "lastActiveAt", message: "lastActiveAt must be a valid date string" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateUpsertCurrentDeviceRequest,
  validateUpdateCurrentDevicePresenceRequest,
};
