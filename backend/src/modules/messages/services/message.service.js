const { mongoose } = require("../../../../database/mongo");
const { mapMongoError } = require("../../../../database/mongo/mongo-error.mapper");
const { ConversationModel } = require("../../conversations/models/conversation.model");
const { ConversationMemberModel } = require("../../conversations/models/conversation-member.model");
const { UserConversationInboxModel } = require("../../conversations/models/user-conversation-inbox.model");
const { MessageModel } = require("../models/message.model");

async function sendMessage({ conversationId, senderId, type = "text", text, clientMessageId, attachments = [] }) {
  const session = await mongoose.startSession();

  try {
    let createdMessage;

    await session.withTransaction(async () => {
      const membership = await ConversationMemberModel.findOne({
        conversationId,
        userId: senderId,
        isActive: true,
      }).session(session);

      if (!membership) {
        const error = new Error("Sender is not an active conversation member");
        error.statusCode = 403;
        throw error;
      }

      const conversation = await ConversationModel.findOneAndUpdate(
        { _id: conversationId },
        { $inc: { lastMessageSeq: 1 } },
        { new: true, session }
      );

      if (!conversation) {
        const error = new Error("Conversation not found");
        error.statusCode = 404;
        throw error;
      }

      createdMessage = await MessageModel.create(
        [
          {
            conversationId,
            senderId,
            seq: conversation.lastMessageSeq,
            clientMessageId,
            type,
            text,
            attachments,
          },
        ],
        { session }
      );

      const message = createdMessage[0];
      const lastActivityAt = message.createdAt || new Date();

      await ConversationModel.updateOne(
        { _id: conversationId },
        {
          $set: {
            lastMessage: {
              seq: message.seq,
              senderId,
              type,
              text,
              createdAt: lastActivityAt,
            },
            lastActivityAt,
          },
        },
        { session }
      );

      await ConversationMemberModel.updateMany(
        { conversationId, userId: { $ne: senderId }, isActive: true },
        { $inc: { unreadCount: 1 } },
        { session }
      );

      await UserConversationInboxModel.updateMany(
        { conversationId },
        {
          $set: {
            lastMessage: text || type,
            lastMessageSeq: message.seq,
            lastActivityAt,
          },
          $inc: { unreadCount: 1 },
        },
        { session }
      );

      await UserConversationInboxModel.updateOne(
        { conversationId, userId: senderId },
        {
          $set: {
            lastMessage: text || type,
            lastMessageSeq: message.seq,
            unreadCount: 0,
            lastActivityAt,
          },
        },
        { session }
      );
    });

    return createdMessage?.[0] || null;
  } catch (error) {
    const mapped = mapMongoError(error);
    error.statusCode = error.statusCode || mapped.statusCode;
    error.details = error.details || mapped.details;
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  sendMessage,
};
