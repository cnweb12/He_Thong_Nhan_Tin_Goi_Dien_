const validators = require("../validators/call.validator");
const { callService } = require("../services/call.service");

function createValidationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

function createCallController(dependencies = {}) {
  const service = dependencies.callService || callService;
  const callValidators = dependencies.validators || validators;

  async function create(req, res, next) {
    try {
      const validation = callValidators.validateCreateCallLogRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const call = await service.createCallLog({
        ...req.body,
        initiatedBy: req.user?.userId || req.body.initiatedBy,
      });

      res.status(201).json({ ok: true, data: call });
    } catch (error) {
      next(error);
    }
  }

  async function getConversationCalls(req, res, next) {
    try {
      const validation = callValidators.validateGetConversationCallsRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const calls = await service.getConversationCalls({
        conversationId: req.params.conversationId,
        userId: req.user.userId,
        limit: req.query.limit === undefined ? 20 : Number(req.query.limit),
        beforeStartedAt: req.query.beforeStartedAt ? new Date(req.query.beforeStartedAt) : undefined,
      });

      res.json({ ok: true, data: calls });
    } catch (error) {
      next(error);
    }
  }

  async function updateStatus(req, res, next) {
    try {
      const validation = callValidators.validateUpdateCallStatusRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const call = await service.updateCallStatus({
        callId: req.params.callId,
        userId: req.user.userId,
        status: req.body.status,
        endedAt: req.body.endedAt ? new Date(req.body.endedAt) : undefined,
        durationSec: req.body.durationSec === undefined ? undefined : Number(req.body.durationSec),
      });

      res.json({ ok: true, data: call });
    } catch (error) {
      next(error);
    }
  }

  async function updateParticipant(req, res, next) {
    try {
      const validation = callValidators.validateUpsertCallParticipantRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const call = await service.upsertParticipantState({
        callId: req.params.callId,
        userId: req.user.userId,
        participantUserId: req.body.participantUserId,
        joinedAt: req.body.joinedAt ? new Date(req.body.joinedAt) : undefined,
        leftAt: req.body.leftAt ? new Date(req.body.leftAt) : undefined,
      });

      res.json({ ok: true, data: call });
    } catch (error) {
      next(error);
    }
  }

  return {
    create,
    getConversationCalls,
    updateStatus,
    updateParticipant,
  };
}

module.exports = {
  createCallController,
  callController: createCallController(),
};