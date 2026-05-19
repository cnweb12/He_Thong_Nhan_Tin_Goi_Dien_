function validateCreateDirectConversationRequest(req) {
  const errors = [];
  const body = req.body || {};

  if (!body.peerUserId || typeof body.peerUserId !== "string" || body.peerUserId.trim().length === 0) {
    errors.push({ field: "peerUserId", message: "Peer user ID is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateMarkConversationAsReadRequest(req) {
  const errors = [];
  const { conversationId } = req.params || {};
  const { lastSeenSeq } = req.body || {};

  if (!conversationId || typeof conversationId !== "string" || conversationId.trim().length === 0) {
    errors.push({ field: "conversationId", message: "Conversation ID is required" });
  }

  const normalizedLastSeenSeq = Number(lastSeenSeq);
  if (!Number.isInteger(normalizedLastSeenSeq) || normalizedLastSeenSeq < 0) {
    errors.push({ field: "lastSeenSeq", message: "lastSeenSeq must be a non-negative integer" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateGetInboxRequest(req) {
  const errors = [];
  const { limit, skip } = req.query || {};

  if (limit !== undefined) {
    const normalizedLimit = Number(limit);
    if (!Number.isInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > 100) {
      errors.push({ field: "limit", message: "Limit must be an integer between 1 and 100" });
    }
  }

  if (skip !== undefined) {
    const normalizedSkip = Number(skip);
    if (!Number.isInteger(normalizedSkip) || normalizedSkip < 0) {
      errors.push({ field: "skip", message: "Skip must be a non-negative integer" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCreateDirectConversationRequest,
  validateMarkConversationAsReadRequest,
  validateGetInboxRequest,
};
