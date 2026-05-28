const validators = require("../validators/message.validator");
const { messageService } = require("../services/message.service");
const { getIO } = require("../../../socket/socket");
const { ConversationMemberModel } = require("../../conversations/models/conversation-member.model");

function createValidationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

function createMessageController(dependencies = {}) {
  const service = dependencies.messageService || messageService;
  const messageValidators = dependencies.validators || validators;
  const memberModel = dependencies.ConversationMemberModel || ConversationMemberModel;

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

      // Emit new_message event to the conversation room and personal user rooms
      try {
        const io = getIO();
        console.log('🔴 [DEBUG SERVER] Bắt đầu emit new_message cho conversationId:', req.body.conversationId);
        
        // Broadcast to conversation room (includes sender)
        io.to(req.body.conversationId).emit("new_message", message);
        
        // Push notification to members' personal room to ensure delivery for new conversations
        const members = await memberModel.find({ conversationId: req.body.conversationId, isActive: true }, 'userId');
        console.log(`🔴 [DEBUG SERVER] Đang emit new_message cho các user cá nhân:`, members.map(m => m.userId.toString()));
        
        members.forEach(member => {
          io.to(member.userId.toString()).emit("new_message", message);
        });
      } catch (socketError) {
        console.error("🔴 [DEBUG SERVER] [message] Failed to emit new_message event:", socketError);
      }

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
