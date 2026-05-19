const { mongoose } = require("../../../../database/mongo");
const { mapMongoError } = require("../../../../database/mongo/mongo-error.mapper");
const { normalizeDirectKey } = require("../../../../database/mongo/normalize");
const { ConversationModel } = require("../models/conversation.model");
const { ConversationMemberModel } = require("../models/conversation-member.model");
const { UserConversationInboxModel } = require("../models/user-conversation-inbox.model");
const { UserModel } = require("../../users/models/user.model");

function createHttpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

function toPlainObject(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toObject === "function") {
    return value.toObject();
  }

  return value;
}

function sanitizeConversation(conversation) {
  const value = toPlainObject(conversation);
  if (!value) {
    return null;
  }

  const { directKey, ...safeConversation } = value;
  return safeConversation;
}

function sanitizeInboxEntry(entry) {
  return toPlainObject(entry);
}

function createConversationService(dependencies = {}) {
  const mongooseLib = dependencies.mongoose || mongoose;
  const mongoErrorMapper = dependencies.mapMongoError || mapMongoError;
  const conversationModel = dependencies.ConversationModel || ConversationModel;
  const conversationMemberModel = dependencies.ConversationMemberModel || ConversationMemberModel;
  const inboxModel = dependencies.UserConversationInboxModel || UserConversationInboxModel;
  const userModel = dependencies.UserModel || UserModel;

  async function ensureUserExists(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return user;
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

  async function createDirectConversation({ userId, peerUserId, createdBy = userId }) {
    if (String(userId) === String(peerUserId)) {
      throw createHttpError(400, "Cannot create a direct conversation with the same user");
    }

    const [currentUser, peerUser] = await Promise.all([ensureUserExists(userId), ensureUserExists(peerUserId)]);
    const session = await mongooseLib.startSession();
    const directKey = normalizeDirectKey(userId, peerUserId);

    try {
      let conversation;

      await session.withTransaction(async () => {
        const existingQuery = conversationModel.findOne({ type: "direct", directKey });
        conversation =
          session && typeof existingQuery.session === "function" ? await existingQuery.session(session) : await existingQuery;

        if (conversation) {
          return;
        }

        const created = await conversationModel.create(
          [
            {
              type: "direct",
              directKey,
              createdBy,
              memberCount: 2,
            },
          ],
          { session }
        );

        conversation = created[0];

        await conversationMemberModel.insertMany(
          [
            { conversationId: conversation._id, userId, role: "owner" },
            { conversationId: conversation._id, userId: peerUserId, role: "member" },
          ],
          { session }
        );

        await inboxModel.insertMany(
          [
            {
              userId,
              conversationId: conversation._id,
              displayName: peerUser.displayName || "Direct chat",
              displayAvatarUrl: peerUser.avatarUrl,
              unreadCount: 0,
            },
            {
              userId: peerUserId,
              conversationId: conversation._id,
              displayName: currentUser.displayName || "Direct chat",
              displayAvatarUrl: currentUser.avatarUrl,
              unreadCount: 0,
            },
          ],
          { session }
        );
      });

      return sanitizeConversation(conversation);
    } catch (error) {
      if (!error.statusCode) {
        const mapped = mongoErrorMapper(error);
        error.statusCode = mapped.statusCode;
        error.details = mapped.details;
        error.message = mapped.message;
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  async function markAsRead({ conversationId, userId, lastSeenSeq }) {
    const session = await mongooseLib.startSession();

    try {
      await session.withTransaction(async () => {
        await ensureActiveMembership(conversationId, userId, session);

        await conversationMemberModel.updateOne(
          { conversationId, userId },
          {
            $set: {
              lastReadSeq: lastSeenSeq,
              unreadCount: 0,
            },
          },
          { session }
        );

        await inboxModel.updateOne(
          { conversationId, userId },
          {
            $set: {
              unreadCount: 0,
              lastMessageSeq: lastSeenSeq,
            },
          },
          { session }
        );
      });

      return {
        conversationId,
        userId,
        lastReadSeq: lastSeenSeq,
        unreadCount: 0,
      };
    } catch (error) {
      if (!error.statusCode) {
        const mapped = mongoErrorMapper(error);
        error.statusCode = mapped.statusCode;
        error.details = mapped.details;
        error.message = mapped.message;
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  async function getInbox({ userId, limit = 20, skip = 0 }) {
    const inbox = await inboxModel
      .find({ userId })
      .sort({ isPinned: -1, lastActivityAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return inbox.map(sanitizeInboxEntry);
  }

  return {
    createDirectConversation,
    markAsRead,
    getInbox,
    sanitizeConversation,
    sanitizeInboxEntry,
  };
}

module.exports = {
  createConversationService,
  conversationService: createConversationService(),
};
