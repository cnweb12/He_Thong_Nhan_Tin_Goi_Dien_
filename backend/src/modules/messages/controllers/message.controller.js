const validators = require("../validators/message.validator");
const { messageService } = require("../services/message.service");

function createValidationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

function createMessageController(dependencies = {}) {
  const service = dependencies.messageService || messageService;
  const messageValidators = dependencies.validators || validators;

  async function sendMessage(req, res, next) {
    try {
      const validation = messageValidators.validateSendMessageRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const message = await service.sendMessage({
        conversationId: req.body.conversationId,
        senderId: req.user.userId,
        type: req.body.type,
        text: req.body.text,
        clientMessageId: req.body.clientMessageId,
        attachments: req.body.attachments,
      });

      res.status(201).json({
        ok: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  async function getConversationMessages(req, res, next) {
    try {
      const validation = messageValidators.validateGetConversationMessagesRequest(req);
      if (!validation.isValid) {
        return next(createValidationError(validation.errors));
      }

      const messages = await service.getConversationMessages({
        conversationId: req.params.conversationId,
        userId: req.user.userId,
        limit: req.query.limit === undefined ? 20 : Number(req.query.limit),
        beforeSeq: req.query.beforeSeq === undefined ? undefined : Number(req.query.beforeSeq),
      });

      res.json({
        ok: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    sendMessage,
    getConversationMessages,
  };
}

module.exports = {
  createMessageController,
  messageController: createMessageController(),
};
