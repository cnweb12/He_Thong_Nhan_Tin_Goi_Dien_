const { mongoose } = require("../../../../database/mongo");
const { mapMongoError } = require("../../../../database/mongo/mongo-error.mapper");
const { ConversationModel } = require("../../conversations/models/conversation.model");
const { ConversationMemberModel } = require("../../conversations/models/conversation-member.model");
const { UserConversationInboxModel } = require("../../conversations/models/user-conversation-inbox.model");
const { MessageModel } = require("../models/message.model");
const { UserModel } = require("../../users/models/user.model");

function createHttpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }

  return error;
}

function sanitizeMessage(message) {
  if (!message) {
    return null;
  }

  if (typeof message.toObject === "function") {
    return message.toObject();
  }

  return message;
}

function createMessageService(dependencies = {}) {
  const mongooseLib = dependencies.mongoose || mongoose;
  const mongoErrorMapper = dependencies.mapMongoError || mapMongoError;
  const conversationModel = dependencies.ConversationModel || ConversationModel;
  const conversationMemberModel = dependencies.ConversationMemberModel || ConversationMemberModel;
  const inboxModel = dependencies.UserConversationInboxModel || UserConversationInboxModel;
  const messageModel = dependencies.MessageModel || MessageModel;
  const userModel = dependencies.UserModel || UserModel;
  const transactionMode = String(dependencies.transactionMode || process.env.TRANSACTION_MODE || "transaction").toLowerCase();
  const useTransactions = dependencies.useTransactions ?? transactionMode !== "local";

  async function getConversationWithMembers(conversationId, session) {
    const aggregation = [
      { $match: { _id: new mongooseLib.Types.ObjectId(conversationId) } },
      {
        $lookup: {
          from: 'conversation_members',
          localField: '_id',
          foreignField: 'conversationId',
          as: 'members'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members.userId',
          foreignField: '_id',
          as: 'memberUsers'
        }
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              as: 'member',
              in: {
                $mergeObjects: [
                  '$$member',
                  {
                    user: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$memberUsers',
                            as: 'user',
                            cond: { $eq: ['$$user._id', '$$member.userId'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          'members.user.password': 0,
          'members.user.phone': 0,
          'members.user.email': 0,
          'memberUsers': 0,
        }
      }
    ];

    const results = await conversationModel.aggregate(aggregation).session(session || null);
    return results[0] || null;
  }

  async function ensureActiveMembership(conversationId, userId, session) {
    const query = conversationMemberModel.findOne({
      conversationId,
      userId,
      isActive: true,
    });

    const membership = session && typeof query.session === "function" ? await query.session(session) : await query;

    if (!membership) {
      throw createHttpError(403, "User is not an active conversation member");
    }

    return membership;
  }

  async function ensureNoSuperAdminInConversation(conversationId, session) {
    const membersQuery = conversationMemberModel.find({ conversationId, isActive: true });
    const members = session && typeof membersQuery.session === "function" ? await membersQuery.session(session) : await membersQuery;
    
    if (members && members.length > 0) {
      const memberIds = members.map(m => m.userId);
      const superAdminQuery = userModel.exists({ _id: { $in: memberIds }, role: { $in: ["super_admin", "admin"] } });
      const hasSuperAdmin = session && typeof superAdminQuery.session === "function" ? await superAdminQuery.session(session) : await superAdminQuery;
      
      if (hasSuperAdmin) {
        throw createHttpError(403, "Cannot send messages to a conversation involving an administrator.");
      }
    }
  }

  async function sendMessageWithoutTransaction({ conversationId, senderId, type = "text", text, clientMessageId, attachments = [] }) {
    await ensureActiveMembership(conversationId, senderId);
    await ensureNoSuperAdminInConversation(conversationId);

    const conversation = await conversationModel.findOneAndUpdate(
      { _id: conversationId },
      { $inc: { lastMessageSeq: 1 } },
      { new: true }
    );

    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const createdMessage = await messageModel.create({
      conversationId,
      senderId,
      seq: conversation.lastMessageSeq,
      clientMessageId,
      type,
      text,
      attachments,
    });

    const lastActivityAt = createdMessage.createdAt || new Date();

    await conversationModel.updateOne(
      { _id: conversationId },
      {
        $set: {
          lastMessage: {
            seq: createdMessage.seq,
            senderId,
            type,
            text,
            createdAt: lastActivityAt,
          },
          lastActivityAt,
        },
      }
    );

    await conversationMemberModel.updateMany(
      { conversationId, userId: { $ne: senderId }, isActive: true },
      { $inc: { unreadCount: 1 } }
    );

    await inboxModel.updateMany(
      { conversationId },
      {
        $set: {
          lastMessage: text || type,
          lastMessageSeq: createdMessage.seq,
          lastActivityAt,
        },
        $inc: { unreadCount: 1 },
      }
    );

    await inboxModel.updateOne(
      { conversationId, userId: senderId },
      {
        $set: {
          lastMessage: text || type,
          lastMessageSeq: createdMessage.seq,
          unreadCount: 0,
          lastActivityAt,
        },
      }
    );

    const conversationWithMembers = await getConversationWithMembers(conversationId);

    return {
      message: sanitizeMessage(createdMessage),
      conversation: conversationWithMembers,
    };
  }

  async function sendMessage({ conversationId, senderId, type = "text", text, clientMessageId, attachments = [] }) {
    if (!useTransactions) {
      return sendMessageWithoutTransaction({
        conversationId,
        senderId,
        type,
        text,
        clientMessageId,
        attachments,
      });
    }

    const session = await mongooseLib.startSession();

    try {
      let createdMessage;
      let conversationWithMembers;

      await session.withTransaction(async () => {
        await ensureActiveMembership(conversationId, senderId, session);
        await ensureNoSuperAdminInConversation(conversationId, session);

        const conversation = await conversationModel.findOneAndUpdate(
          { _id: conversationId },
          { $inc: { lastMessageSeq: 1 } },
          { new: true, session }
        );

        if (!conversation) {
          throw createHttpError(404, "Conversation not found");
        }

        const created = await messageModel.create(
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
        createdMessage = created[0];

        const lastActivityAt = createdMessage.createdAt || new Date();

        await conversationModel.updateOne(
          { _id: conversationId },
          {
            $set: {
              lastMessage: {
                seq: createdMessage.seq,
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

        await conversationMemberModel.updateMany(
          { conversationId, userId: { $ne: senderId }, isActive: true },
          { $inc: { unreadCount: 1 } },
          { session }
        );

        await inboxModel.updateMany(
          { conversationId },
          {
            $set: {
              lastMessage: text || type,
              lastMessageSeq: createdMessage.seq,
              lastActivityAt,
            },
            $inc: { unreadCount: 1 },
          },
          { session }
        );

        await inboxModel.updateOne(
          { conversationId, userId: senderId },
          {
            $set: {
              lastMessage: text || type,
              lastMessageSeq: createdMessage.seq,
              unreadCount: 0,
              lastActivityAt,
            },
          },
          { session }
        );
        
        conversationWithMembers = await getConversationWithMembers(conversationId, session);
      });

      return {
        message: sanitizeMessage(createdMessage),
        conversation: conversationWithMembers,
      };
    } catch (error) {
      const mapped = mongoErrorMapper(error);
      error.statusCode = error.statusCode || mapped.statusCode;
      error.details = error.details || mapped.details;
      error.message = error.statusCode === 500 ? mapped.message : error.message;
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async function getConversationMessages({ conversationId, userId, limit = 20, beforeSeq }) {
    try {
      const membership = await ensureActiveMembership(conversationId, userId);

      const filter = {
        conversationId,
      };

      if (membership.clearedAt) {
        filter.createdAt = { $gt: membership.clearedAt };
      }

      if (beforeSeq !== undefined && beforeSeq !== null) {
        filter.seq = { $lt: beforeSeq };
      }

      const messages = await messageModel.find(filter).sort({ seq: -1 }).limit(limit).lean();
      return messages.reverse().map((msg) => {
        const sanitized = sanitizeMessage(msg);
        if (sanitized.deletedAt) {
          sanitized.text = "";
          sanitized.attachments = [];
          sanitized.type = "system"; // Optional: Can change to 'system' or leave it and let frontend handle it
        }
        return sanitized;
      });
    } catch (error) {
      if (!error.statusCode) {
        const mapped = mongoErrorMapper(error);
        error.statusCode = mapped.statusCode;
        error.details = mapped.details;
        error.message = mapped.message;
      }

      throw error;
    }
  }

  async function recallMessage({ messageId, userId }) {
    try {
      const message = await messageModel.findById(messageId);
      if (!message) {
        throw createHttpError(404, "Message not found");
      }

      // Check if user is the sender
      if (message.senderId.toString() !== userId) {
        // Option: we could also check if user is admin of conversation.
        // For now, strict check: only sender can recall.
        throw createHttpError(403, "You do not have permission to recall this message");
      }

      if (message.deletedAt) {
        throw createHttpError(400, "Message is already recalled");
      }

      const updatedMessage = await messageModel.findOneAndUpdate(
        { _id: messageId },
        { $set: { deletedAt: new Date() } },
        { new: true }
      );

      return sanitizeMessage(updatedMessage);
    } catch (error) {
      if (!error.statusCode) {
        const mapped = mongoErrorMapper(error);
        error.statusCode = mapped.statusCode;
        error.details = mapped.details;
        error.message = mapped.message;
      }

      throw error;
    }
  }

  return {
    sendMessage,
    getConversationMessages,
    recallMessage,
    sanitizeMessage,
  };
}

module.exports = {
  createMessageService,
  messageService: createMessageService(),
};
