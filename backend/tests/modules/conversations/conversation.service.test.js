const test = require("node:test");
const assert = require("node:assert/strict");

const { createConversationService } = require("../../../src/modules/conversations/services/conversation.service");

function createSession() {
  return {
    ended: false,
    async withTransaction(fn) {
      await fn();
    },
    async endSession() {
      this.ended = true;
    },
  };
}

function createQueryWithSession(result) {
  return {
    session: async () => result,
  };
}

function createInboxQuery(items) {
  return {
    sort(sortArg) {
      this.sortArg = sortArg;
      return this;
    },
    skip(skipArg) {
      this.skipArg = skipArg;
      return this;
    },
    limit(limitArg) {
      this.limitArg = limitArg;
      return {
        lean: async () => items,
      };
    },
  };
}

test("createDirectConversation creates member and inbox records", async () => {
  const session = createSession();
  const calls = {
    members: null,
    inbox: null,
  };

  const service = createConversationService({
    mongoose: {
      startSession: async () => session,
    },
    UserModel: {
      findById: async (userId) =>
        ({
          "user-1": { _id: "user-1", displayName: "Alice", avatarUrl: "alice.png" },
          "user-2": { _id: "user-2", displayName: "Bob", avatarUrl: "bob.png" },
        })[userId] || null,
    },
    ConversationModel: {
      findOne: () => createQueryWithSession(null),
      create: async (docs) => [
        {
          ...docs[0],
          _id: "conv-1",
          toObject() {
            return { ...this };
          },
        },
      ],
      aggregate: () => ({
        session: async () => [{ _id: "conv-1", members: [] }]
      }),
    },
    ConversationMemberModel: {
      insertMany: async (docs) => {
        calls.members = docs;
      },
    },
    UserConversationInboxModel: {
      insertMany: async (docs) => {
        calls.inbox = docs;
      },
    },
  });

  const conversation = await service.createDirectConversation({
    userId: "user-1",
    peerUserId: "user-2",
  });

  assert.equal(conversation._id, "conv-1");
  assert.equal(conversation.directKey, undefined);
  assert.deepEqual(
    calls.members.map((member) => member.userId),
    ["user-1", "user-2"]
  );
  assert.equal(calls.inbox[0].displayName, "Bob");
  assert.equal(calls.inbox[1].displayName, "Alice");
  assert.equal(session.ended, true);
});

test("markAsRead requires active membership and resets unread counters", async () => {
  const session = createSession();
  const calls = {
    memberUpdate: null,
    inboxUpdate: null,
  };

  const service = createConversationService({
    mongoose: {
      startSession: async () => session,
    },
    ConversationMemberModel: {
      findOne: () => createQueryWithSession({ _id: "membership-1" }),
      updateOne: async (filter, update) => {
        calls.memberUpdate = { filter, update };
      },
    },
    UserConversationInboxModel: {
      updateOne: async (filter, update) => {
        calls.inboxUpdate = { filter, update };
      },
    },
  });

  const result = await service.markAsRead({
    conversationId: "conv-1",
    userId: "user-1",
    lastSeenSeq: 9,
  });

  assert.deepEqual(result, {
    conversationId: "conv-1",
    userId: "user-1",
    lastReadSeq: 9,
    unreadCount: 0,
  });
  assert.equal(calls.memberUpdate.update.$set.unreadCount, 0);
  assert.equal(calls.inboxUpdate.update.$set.lastMessageSeq, 9);
  assert.equal(session.ended, true);
});

test("markAsRead rejects users outside the conversation", async () => {
  const session = createSession();
  const service = createConversationService({
    mongoose: {
      startSession: async () => session,
    },
    ConversationMemberModel: {
      findOne: () => createQueryWithSession(null),
    },
  });

  await assert.rejects(
    () =>
      service.markAsRead({
        conversationId: "conv-1",
        userId: "user-2",
        lastSeenSeq: 3,
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test("getInbox sorts and returns lean inbox entries", async () => {
  const service = createConversationService({
    UserConversationInboxModel: {
      aggregate: async (pipeline) => {
        assert.equal(pipeline[0].$match.userId.toString(), "507f1f77bcf86cd799439011");
        assert.equal(pipeline[4].$skip, 5);
        assert.equal(pipeline[5].$limit, 10);
        return [{ conversationId: "conv-1", displayName: "Bob" }];
      },
    },
    FriendModel: {
      findOne: async () => null,
    },
    UserModel: {
      findOne: async () => null,
    },
  });

  const inbox = await service.getInbox({ userId: "507f1f77bcf86cd799439011", limit: 10, skip: 5 });
  assert.equal(inbox[0].displayName, "Bob");
});

test("getInbox with search query q uses aggregation pipeline", async () => {
  const service = createConversationService({
    UserConversationInboxModel: {
      aggregate: async (pipeline) => {
        assert.equal(pipeline[0].$match.userId.toString(), "507f1f77bcf86cd799439011");
        assert.equal(pipeline[5].$skip, 0);
        assert.equal(pipeline[6].$limit, 20);
        return [{ conversationId: "conv-1", displayName: "Alice" }];
      },
    },
    FriendModel: {
      findOne: async () => null,
    },
    UserModel: {
      findOne: async () => null,
    },
  });

  const inbox = await service.getInbox({ userId: "507f1f77bcf86cd799439011", q: "Alice" });
  assert.equal(inbox[0].displayName, "Alice");
});

test("getInbox with phone number searches friend only", async () => {
  const service = createConversationService({
    UserConversationInboxModel: {
      aggregate: async (pipeline) => {
        assert.equal(pipeline[0].$match.userId.toString(), "507f1f77bcf86cd799439011");
        return [{ conversationId: "conv-1", displayName: "Bob" }];
      },
    },
    FriendModel: {
      findOne: async () => ({ status: "accepted" }),
    },
    UserModel: {
      findOne: async () => ({ _id: "507f1f77bcf86cd799439022", phone: "84901234567" }),
    },
  });

  const inbox = await service.getInbox({ userId: "507f1f77bcf86cd799439011", q: "0901234567" });
  assert.equal(inbox[0].displayName, "Bob");
});
