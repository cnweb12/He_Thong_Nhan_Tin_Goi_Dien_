const { mapMongoError } = require("../../../../database/mongo/mongo-error.mapper");
const { ConversationMemberModel } = require("../../conversations/models/conversation-member.model");
const { CallModel } = require("../models/call.model");

function createHttpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

function sanitizeCall(call) {
  if (!call) {
    return null;
  }

  if (typeof call.toObject === "function") {
    return call.toObject();
  }

  return call;
}

function normalizeParticipants(participants = [], initiatedBy, startedAt) {
  const mapByUser = new Map();

  if (initiatedBy) {
    mapByUser.set(String(initiatedBy), {
      userId: initiatedBy,
      joinedAt: startedAt || new Date(),
    });
  }

  for (const participant of participants) {
    if (!participant || !participant.userId) {
      continue;
    }

    const key = String(participant.userId);
    const existing = mapByUser.get(key) || {};
    mapByUser.set(key, {
      ...existing,
      userId: participant.userId,
      joinedAt: participant.joinedAt || existing.joinedAt,
      leftAt: participant.leftAt || existing.leftAt,
    });
  }

  return [...mapByUser.values()];
}

function createCallService(dependencies = {}) {
  const callModel = dependencies.CallModel || CallModel;
  const conversationMemberModel = dependencies.ConversationMemberModel || ConversationMemberModel;
  const mongoErrorMapper = dependencies.mapMongoError || mapMongoError;

  async function ensureActiveMembership(conversationId, userId) {
    const membership = await conversationMemberModel.findOne({
      conversationId,
      userId,
      isActive: true,
    });

    if (!membership) {
      throw createHttpError(403, "User is not an active conversation member");
    }

    return membership;
  }

  async function createCallLog(payload = {}) {
    try {
      const startedAt = payload.startedAt ? new Date(payload.startedAt) : undefined;
      await ensureActiveMembership(payload.conversationId, payload.initiatedBy);

      const participants = normalizeParticipants(payload.participants, payload.initiatedBy, startedAt);
      const call = await callModel.create({
        ...payload,
        participants,
      });

      return sanitizeCall(call);
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  async function getConversationCalls({ conversationId, userId, limit = 20, beforeStartedAt }) {
    try {
      await ensureActiveMembership(conversationId, userId);

      const filter = { conversationId };
      if (beforeStartedAt) {
        filter.startedAt = { $lt: beforeStartedAt };
      }

      const calls = await callModel
        .find(filter)
        .sort({ startedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      return calls.map(sanitizeCall);
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  async function updateCallStatus({ callId, userId, status, endedAt, durationSec }) {
    try {
      const call = await callModel.findById(callId);
      if (!call) {
        throw createHttpError(404, "Call not found");
      }

      await ensureActiveMembership(call.conversationId, userId);

      const normalizedEndedAt = endedAt ? new Date(endedAt) : undefined;
      const shouldAutofillEndedAt = ["completed", "cancelled", "rejected", "missed"].includes(status);
      const finalEndedAt = normalizedEndedAt || (shouldAutofillEndedAt ? new Date() : undefined);

      const update = {
        $set: {
          status,
        },
      };

      if (finalEndedAt) {
        update.$set.endedAt = finalEndedAt;
      }

      if (durationSec !== undefined) {
        update.$set.durationSec = durationSec;
      } else if (finalEndedAt && call.startedAt) {
        const autoDuration = Math.max(0, Math.floor((finalEndedAt.getTime() - call.startedAt.getTime()) / 1000));
        update.$set.durationSec = autoDuration;
      }

      const updated = await callModel.findByIdAndUpdate(callId, update, {
        new: true,
        runValidators: true,
      });

      return sanitizeCall(updated);
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  async function upsertParticipantState({ callId, userId, participantUserId, joinedAt, leftAt }) {
    try {
      const call = await callModel.findById(callId);
      if (!call) {
        throw createHttpError(404, "Call not found");
      }

      await ensureActiveMembership(call.conversationId, userId);
      await ensureActiveMembership(call.conversationId, participantUserId);

      const participants = Array.isArray(call.participants) ? [...call.participants] : [];
      const participantIndex = participants.findIndex((participant) => String(participant.userId) === String(participantUserId));

      const current = participantIndex >= 0 ? participants[participantIndex] : { userId: participantUserId };
      const nextValue = {
        ...current,
        userId: participantUserId,
      };

      if (joinedAt !== undefined) {
        nextValue.joinedAt = joinedAt;
      }

      if (leftAt !== undefined) {
        nextValue.leftAt = leftAt;
      }

      if (participantIndex >= 0) {
        participants[participantIndex] = nextValue;
      } else {
        participants.push(nextValue);
      }

      call.participants = participants;
      await call.save();
      return sanitizeCall(call);
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  return {
    createCallLog,
    getConversationCalls,
    updateCallStatus,
    upsertParticipantState,
    sanitizeCall,
  };
}

module.exports = {
  createCallService,
  callService: createCallService(),
};
