const validators = require("../validators/conversation.validator");
const { conversationService } = require("../services/conversation.service");

function createValidationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

function createConversationController(dependencies = {}) {
  const service = dependencies.conversationService || conversationService;
  const conversationValidators = dependencies.validators || validators;

  async function createDirect(req, res, next) {
    try {
      const validation = conversationValidators.validateCreateDirectConversationRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const conversation = await service.createDirectConversation({
        userId: req.user.userId,
        peerUserId: req.body.peerUserId,
      });

      res.status(201).json({
        ok: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  async function markAsRead(req, res, next) {
    try {
      const validation = conversationValidators.validateMarkConversationAsReadRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const result = await service.markAsRead({
        conversationId: req.params.conversationId,
        userId: req.user.userId,
        lastSeenSeq: Number(req.body.lastSeenSeq),
      });

      res.json({
        ok: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async function getInbox(req, res, next) {
    try {
      const validation = conversationValidators.validateGetInboxRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const inbox = await service.getInbox({
        userId: req.user.userId,
        limit: req.query.limit === undefined ? 20 : Number(req.query.limit),
        skip: req.query.skip === undefined ? 0 : Number(req.query.skip),
      });

      res.json({
        ok: true,
        data: inbox,
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    createDirect,
    markAsRead,
    getInbox,
  };
}

module.exports = {
  createConversationController,
  conversationController: createConversationController(),
};
