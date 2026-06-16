const { mongoose } = require("../../../../database/mongo");
const { mapMongoError } = require("../../../../database/mongo/mongo-error.mapper");
const { normalizeDirectKey, normalizePhone } = require("../../../../database/mongo/normalize");
const { ConversationModel } = require("../models/conversation.model");
const { ConversationMemberModel } = require("../models/conversation-member.model");
const { UserConversationInboxModel } = require("../models/user-conversation-inbox.model");
const { UserModel } = require("../../users/models/user.model");
const { FriendModel } = require("../../users/models/friend.model");

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

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createConversationService(dependencies = {}) {
  const mongooseLib = dependencies.mongoose || mongoose;
  const mongoErrorMapper = dependencies.mapMongoError || mapMongoError;
  const conversationModel = dependencies.ConversationModel || ConversationModel;
  const conversationMemberModel = dependencies.ConversationMemberModel || ConversationMemberModel;
  const inboxModel = dependencies.UserConversationInboxModel || UserConversationInboxModel;
  const userModel = dependencies.UserModel || UserModel;
  const friendModel = dependencies.FriendModel || FriendModel;
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

  async function createDirectConversationWithoutTransaction({ userId, peerUserId, createdBy = userId, currentUser, peerUser, directKey }) {
    const existingConversation = await conversationModel.findOne({ type: "direct", directKey });
    if (existingConversation) {
      const fullConversation = await getConversationWithMembers(existingConversation._id);
      return sanitizeConversation(fullConversation);
    }

    const createdConversation = await conversationModel.create([
      {
        type: "direct",
        directKey,
        createdBy,
        memberCount: 2,
      },
    ]);

    const conversation = createdConversation[0];

    const isSelf = String(userId) === String(peerUserId);
    const membersToInsert = [{ conversationId: conversation._id, userId, role: "owner" }];
    if (!isSelf) {
      membersToInsert.push({ conversationId: conversation._id, userId: peerUserId, role: "member" });
    }
    await conversationMemberModel.insertMany(membersToInsert);

    const inboxToInsert = [
      {
        userId,
        conversationId: conversation._id,
        displayName: isSelf ? "Cloud của tôi" : (peerUser.displayName || "Direct chat"),
        displayAvatarUrl: isSelf ? null : peerUser.avatarUrl,
        unreadCount: 0,
      }
    ];
    if (!isSelf) {
      inboxToInsert.push({
        userId: peerUserId,
        conversationId: conversation._id,
        displayName: currentUser.displayName || "Direct chat",
        displayAvatarUrl: currentUser.avatarUrl,
        unreadCount: 0,
      });
    }
    await inboxModel.insertMany(inboxToInsert);

    const fullConversation = await getConversationWithMembers(conversation._id);
    return sanitizeConversation(fullConversation);
  }

  async function markAsReadWithoutTransaction({ conversationId, userId, lastSeenSeq }) {
    await ensureActiveMembership(conversationId, userId);

    await conversationMemberModel.updateOne(
      { conversationId, userId },
      {
        $set: {
          lastReadSeq: lastSeenSeq,
          unreadCount: 0,
        },
      }
    );

    await inboxModel.updateOne(
      { conversationId, userId },
      {
        $set: {
          unreadCount: 0,
          lastMessageSeq: lastSeenSeq,
        },
      }
    );

    return {
      conversationId,
      userId,
      lastReadSeq: lastSeenSeq,
      unreadCount: 0,
    };
  }

  async function createDirectConversation({ userId, peerUserId, createdBy = userId }) {
    const [currentUser, peerUser] = await Promise.all([ensureUserExists(userId), ensureUserExists(peerUserId)]);
    
    // Prevent conversations involving super admins, but allow self-conversation (Personal Cloud)
    if (["super_admin", "admin"].includes(currentUser.role) || ["super_admin", "admin"].includes(peerUser.role)) {
       if (String(userId) !== String(peerUserId)) {
         throw createHttpError(403, "Cannot create or engage in a conversation with an administrator.");
       }
    }

    const directKey = normalizeDirectKey(userId, peerUserId);

    if (!useTransactions) {
      return createDirectConversationWithoutTransaction({
        userId,
        peerUserId,
        createdBy,
        currentUser,
        peerUser,
        directKey,
      });
    }

    const session = await mongooseLib.startSession();

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

        const isSelf = String(userId) === String(peerUserId);
        const membersToInsert = [{ conversationId: conversation._id, userId, role: "owner" }];
        if (!isSelf) {
          membersToInsert.push({ conversationId: conversation._id, userId: peerUserId, role: "member" });
        }
        await conversationMemberModel.insertMany(membersToInsert, { session });

        const inboxToInsert = [
          {
            userId,
            conversationId: conversation._id,
            displayName: isSelf ? "Cloud của tôi" : (peerUser.displayName || "Direct chat"),
            displayAvatarUrl: isSelf ? null : peerUser.avatarUrl,
            unreadCount: 0,
          }
        ];
        if (!isSelf) {
          inboxToInsert.push({
            userId: peerUserId,
            conversationId: conversation._id,
            displayName: currentUser.displayName || "Direct chat",
            displayAvatarUrl: currentUser.avatarUrl,
            unreadCount: 0,
          });
        }
        await inboxModel.insertMany(inboxToInsert, { session });
      });

      const fullConversation = await getConversationWithMembers(conversation._id, session);
      return sanitizeConversation(fullConversation);
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
    if (!useTransactions) {
      return markAsReadWithoutTransaction({
        conversationId,
        userId,
        lastSeenSeq,
      });
    }

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

  async function getInbox({ userId, limit = 20, skip = 0, q }) {
    let matchPeerId = null;

    // Step 1: Pre-query for phone number validation
    if (q) {
      // Check if q is a valid phone number (10 digits or starts with 84 + 9 digits)
      const phoneRegex = /^(0\d{9}|84\d{9})$/;
      if (phoneRegex.test(q)) {
        // Normalize the phone number
        const normalizedPhone = normalizePhone(q);
        
        // Find user by phone
        const peerUser = await userModel.findOne({ phone: normalizedPhone });
        
        if (peerUser) {
          // Check if they are friends
          const friendship = await friendModel.findOne({
            $or: [
              { userId, friendId: peerUser._id },
              { userId: peerUser._id, friendId: userId }
            ],
            status: 'accepted'
          });
          
          if (friendship) {
            matchPeerId = peerUser._id.toString();
          }
        }
      }
    }

    // Step 2: Build aggregation pipeline
    const pipeline = [
      // Initial match: user's inbox entries
      {
        $match: { userId: new mongooseLib.Types.ObjectId(userId) }
      },
      // Lookup conversation details
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversationId',
          foreignField: '_id',
          as: 'conversation'
        }
      },
      {
        $unwind: '$conversation'
      },
      // For direct chats, include the other participant so the client can call them.
      {
        $lookup: {
          from: 'conversation_members',
          let: {
            conversationId: '$conversationId',
            currentUserId: '$userId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$conversationId', '$$conversationId'] },
                    { $ne: ['$userId', '$$currentUserId'] },
                    { $eq: ['$isActive', true] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'peerMember'
        }
      },
      {
        $unwind: {
          path: '$peerMember',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'peerMember.userId',
          foreignField: '_id',
          as: 'peerUser'
        }
      },
      {
        $unwind: {
          path: '$peerUser',
          preserveNullAndEmptyArrays: true
        }
      },
      // Chi join bang conversation_members neu tim thay friend qua SDT (giup tiet kiem tai nguyen)
      ...(matchPeerId ? [{
        $lookup: {
          from: 'conversation_members',
          localField: 'conversationId',
          foreignField: 'conversationId',
          as: 'members'
        }
      }] : []),
      // Filter results based on search query
      ...(q ? [{
        $match: {
          $or: [
            // Search by conversation title (for group chats)
            {
              'conversation.title': {
                $regex: escapeRegex(q),
                $options: 'i'
              }
            },
            // Search by displayName (for direct chats)
            {
              displayName: {
                $regex: escapeRegex(q),
                $options: 'i'
              }
            },
            // Exact match by peer userId (if phone number search found a friend)
            ...(matchPeerId ? [{
              'members.userId': new mongooseLib.Types.ObjectId(matchPeerId)
            }] : [])
          ]
        }
      }] : []),
      // Sort by pinned status and last activity
      {
        $sort: { isPinned: -1, lastActivityAt: -1 }
      },
      // Pagination
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      // Project output
      {
        $project: {
          _id: 1,
          userId: 1,
          conversationId: 1,
          displayName: 1,
          displayAvatarUrl: 1,
          lastMessage: 1,
          lastMessageSeq: 1,
          unreadCount: 1,
          isPinned: 1,
          isMuted: 1,
          lastActivityAt: 1,
          createdAt: 1,
          updatedAt: 1,
          conversation: {
            _id: 1,
            type: 1,
            title: 1,
            avatarUrl: 1,
            memberCount: 1,
            lastMessage: 1,
            lastMessageSeq: 1,
            lastActivityAt: 1
          },
          peer: {
            userId: '$peerUser._id',
            displayName: '$peerUser.displayName',
            phone: '$peerUser.phone',
            username: '$peerUser.username',
            avatarUrl: '$peerUser.avatarUrl'
          }
        }
      }
    ];

    const inbox = await inboxModel.aggregate(pipeline);

    return inbox.map(sanitizeInboxEntry);
  }

  async function clearHistory({ conversationId, userId }) {
    try {
      await ensureActiveMembership(conversationId, userId);

      const clearedAt = new Date();

      // Update the member's clearedAt timestamp
      await conversationMemberModel.updateOne(
        { conversationId, userId },
        { $set: { clearedAt } }
      );

      // Optionally: reset inbox unreadCount
      await inboxModel.updateOne(
        { conversationId, userId },
        {
          $set: {
            unreadCount: 0,
          },
        }
      );

      return {
        conversationId,
        userId,
        clearedAt,
      };
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
    createDirectConversation,
    markAsRead,
    getInbox,
    clearHistory,
    sanitizeConversation,
    sanitizeInboxEntry,
  };
}

module.exports = {
  createConversationService,
  conversationService: createConversationService(),
};
