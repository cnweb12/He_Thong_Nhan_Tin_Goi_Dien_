function validateCreateCallLogRequest(req) {
  const errors = [];
  const body = req.body || {};

  if (!body.conversationId || typeof body.conversationId !== "string" || body.conversationId.trim().length === 0) {
    errors.push({ field: "conversationId", message: "Conversation ID is required" });
  }

  if (!body.type || !["audio", "video"].includes(body.type)) {
    errors.push({ field: "type", message: "Call type must be either 'audio' or 'video'" });
  }

  if (!body.status || !["missed", "completed", "cancelled", "rejected"].includes(body.status)) {
    errors.push({ field: "status", message: "Call status is invalid" });
  }

  if (body.startedAt !== undefined && Number.isNaN(Date.parse(body.startedAt))) {
    errors.push({ field: "startedAt", message: "Started at must be a valid date string" });
  }

  if (body.endedAt !== undefined && Number.isNaN(Date.parse(body.endedAt))) {
    errors.push({ field: "endedAt", message: "Ended at must be a valid date string" });
  }

  if (body.durationSec !== undefined) {
    const durationSec = Number(body.durationSec);
    if (!Number.isInteger(durationSec) || durationSec < 0) {
      errors.push({ field: "durationSec", message: "Duration must be a non-negative integer" });
    }
  }

  if (body.participants !== undefined && !Array.isArray(body.participants)) {
    errors.push({ field: "participants", message: "Participants must be an array" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCreateCallLogRequest,
};