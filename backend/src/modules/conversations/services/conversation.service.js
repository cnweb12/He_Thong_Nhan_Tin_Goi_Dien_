const { mongoose } = require("../../../../database/mongo");
const { normalizeDirectKey } = require("../../../../database/mongo/normalize");
const { ConversationModel } = require("../models/conversation.model");
const { ConversationMemberModel } = require("../models/conversation-member.model");
const { UserConversationInboxModel } = require("../models/user-conversation-inbox.model");

async function createDirectConversation({ userId, peerUserId, createdBy = userId, displayNameMap = {} }) {
  const session = await mongoose.startSession();
  const directKey = normalizeDirectKey(userId, peerUserId);

  try {
    let conversation;

    await session.withTransaction(async () => {
      conversation = await ConversationModel.findOne({ type: "direct", directKey }).session(session);
      if (conversation) {
        return;
      }

      const created = await ConversationModel.create(
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

      await ConversationMemberModel.insertMany(
        [
          { conversationId: conversation._id, userId, role: "owner" },
          { conversationId: conversation._id, userId: peerUserId, role: "member" },
        ],
        { session }
      );

      await UserConversationInboxModel.insertMany(
        [
          {
            userId,
            conversationId: conversation._id,
            displayName: displayNameMap[userId] || "Direct chat",
            unreadCount: 0,
          },
          {
            userId: peerUserId,
            conversationId: conversation._id,
            displayName: displayNameMap[peerUserId] || "Direct chat",
            unreadCount: 0,
          },
        ],
        { session }
      );
    });

    return conversation;
  } finally {
    await session.endSession();
  }
}

async function markAsRead({ conversationId, userId, lastSeenSeq }) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await ConversationMemberModel.updateOne(
        { conversationId, userId },
        {
          $set: {
            lastReadSeq: lastSeenSeq,
            unreadCount: 0,
          },
        },
        { session }
      );

      await UserConversationInboxModel.updateOne(
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
  } finally {
    await session.endSession();
  }
}

async function getInbox({ userId, limit = 20, skip = 0 }) {
  return UserConversationInboxModel.find({ userId })
    .sort({ isPinned: -1, lastActivityAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

module.exports = {
  createDirectConversation,
  markAsRead,
  getInbox,
};
