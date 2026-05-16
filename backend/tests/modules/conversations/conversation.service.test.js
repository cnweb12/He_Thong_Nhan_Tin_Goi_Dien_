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
  const query = createInboxQuery([{ conversationId: "conv-1", displayName: "Bob" }]);
  const service = createConversationService({
    UserConversationInboxModel: {
      find: (filter) => {
        assert.deepEqual(filter, { userId: "user-1" });
        return query;
      },
    },
  });

  const inbox = await service.getInbox({ userId: "user-1", limit: 10, skip: 5 });
  assert.equal(query.skipArg, 5);
  assert.equal(query.limitArg, 10);
  assert.equal(inbox[0].displayName, "Bob");
});
