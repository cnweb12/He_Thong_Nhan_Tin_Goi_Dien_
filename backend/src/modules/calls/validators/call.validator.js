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
  } else if (Array.isArray(body.participants)) {
    body.participants.forEach((participant, index) => {
      if (!participant || typeof participant !== "object") {
        errors.push({ field: `participants[${index}]`, message: "Participant must be an object" });
        return;
      }

      if (!participant.userId || typeof participant.userId !== "string" || participant.userId.trim().length === 0) {
        errors.push({ field: `participants[${index}].userId`, message: "Participant userId is required" });
      }

      if (participant.joinedAt !== undefined && Number.isNaN(Date.parse(participant.joinedAt))) {
        errors.push({ field: `participants[${index}].joinedAt`, message: "joinedAt must be a valid date string" });
      }

      if (participant.leftAt !== undefined && Number.isNaN(Date.parse(participant.leftAt))) {
        errors.push({ field: `participants[${index}].leftAt`, message: "leftAt must be a valid date string" });
      }
    });
  }

  if (
    body.startedAt !== undefined &&
    body.endedAt !== undefined &&
    !Number.isNaN(Date.parse(body.startedAt)) &&
    !Number.isNaN(Date.parse(body.endedAt))
  ) {
    if (new Date(body.endedAt).getTime() < new Date(body.startedAt).getTime()) {
      errors.push({ field: "endedAt", message: "Ended at must be later than or equal to started at" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateGetConversationCallsRequest(req) {
  const errors = [];
  const { conversationId } = req.params || {};
  const { limit, beforeStartedAt } = req.query || {};

  if (!conversationId || typeof conversationId !== "string" || conversationId.trim().length === 0) {
    errors.push({ field: "conversationId", message: "Conversation ID is required" });
  }

  if (limit !== undefined) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      errors.push({ field: "limit", message: "Limit must be an integer between 1 and 100" });
    }
  }

  if (beforeStartedAt !== undefined && Number.isNaN(Date.parse(beforeStartedAt))) {
    errors.push({ field: "beforeStartedAt", message: "beforeStartedAt must be a valid date string" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateCallStatusRequest(req) {
  const errors = [];
  const { callId } = req.params || {};
  const { status, endedAt, durationSec } = req.body || {};

  if (!callId || typeof callId !== "string" || callId.trim().length === 0) {
    errors.push({ field: "callId", message: "Call ID is required" });
  }

  if (!status || !["missed", "completed", "cancelled", "rejected"].includes(status)) {
    errors.push({ field: "status", message: "Call status is invalid" });
  }

  if (endedAt !== undefined && Number.isNaN(Date.parse(endedAt))) {
    errors.push({ field: "endedAt", message: "Ended at must be a valid date string" });
  }

  if (durationSec !== undefined) {
    const normalized = Number(durationSec);
    if (!Number.isInteger(normalized) || normalized < 0) {
      errors.push({ field: "durationSec", message: "Duration must be a non-negative integer" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpsertCallParticipantRequest(req) {
  const errors = [];
  const { callId } = req.params || {};
  const { participantUserId, joinedAt, leftAt } = req.body || {};

  if (!callId || typeof callId !== "string" || callId.trim().length === 0) {
    errors.push({ field: "callId", message: "Call ID is required" });
  }

  if (!participantUserId || typeof participantUserId !== "string" || participantUserId.trim().length === 0) {
    errors.push({ field: "participantUserId", message: "Participant user ID is required" });
  }

  if (joinedAt !== undefined && Number.isNaN(Date.parse(joinedAt))) {
    errors.push({ field: "joinedAt", message: "joinedAt must be a valid date string" });
  }

  if (leftAt !== undefined && Number.isNaN(Date.parse(leftAt))) {
    errors.push({ field: "leftAt", message: "leftAt must be a valid date string" });
  }

  if (joinedAt === undefined && leftAt === undefined) {
    errors.push({ field: "body", message: "At least joinedAt or leftAt is required" });
  }

  if (
    joinedAt !== undefined &&
    leftAt !== undefined &&
    !Number.isNaN(Date.parse(joinedAt)) &&
    !Number.isNaN(Date.parse(leftAt)) &&
    new Date(leftAt).getTime() < new Date(joinedAt).getTime()
  ) {
    errors.push({ field: "leftAt", message: "leftAt must be later than or equal to joinedAt" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCreateCallLogRequest,
  validateGetConversationCallsRequest,
  validateUpdateCallStatusRequest,
  validateUpsertCallParticipantRequest,
};