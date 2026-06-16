const test = require("node:test");
const assert = require("node:assert/strict");

const { createMessageService } = require("../../../src/modules/messages/services/message.service");

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

function createMembershipQuery(result) {
  return {
    session: async () => result,
  };
}

function createMessageListQuery(items) {
  return {
    sort(sortArg) {
      this.sortArg = sortArg;
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

test("sendMessage creates message and updates related conversation state", async () => {
  const session = createSession();
  const calls = {
    conversationUpdate: null,
    memberUnread: null,
    inboxUpdateMany: null,
    inboxUpdateOne: null,
  };

  const service = createMessageService({
    mongoose: {
      startSession: async () => session,
    },
    ConversationMemberModel: {
      findOne: () => createMembershipQuery({ _id: "membership-1" }),
      updateMany: async (filter, update) => {
        calls.memberUnread = { filter, update };
      },
    },
    ConversationModel: {
      findOneAndUpdate: async () => ({ _id: "conv-1", lastMessageSeq: 9 }),
      updateOne: async (filter, update) => {
        calls.conversationUpdate = { filter, update };
      },
      aggregate: () => ({
        session: async () => [{ _id: "conv-1", members: [] }],
      }),
    },
    MessageModel: {
      create: async (docs) => [
        {
          ...docs[0],
          _id: "msg-1",
          createdAt: new Date("2026-04-12T10:00:00.000Z"),
          toObject() {
            return { ...this };
          },
        },
      ],
    },
    UserConversationInboxModel: {
      updateMany: async (filter, update) => {
        calls.inboxUpdateMany = { filter, update };
      },
      updateOne: async (filter, update) => {
        calls.inboxUpdateOne = { filter, update };
      },
    },
  });

  const message = await service.sendMessage({
    conversationId: "conv-1",
    senderId: "user-1",
    text: "Xin chao",
    clientMessageId: "client-1",
  });

  assert.equal(message.seq, 9);
  assert.equal(message.text, "Xin chao");
  assert.deepEqual(calls.memberUnread.filter, {
    conversationId: "conv-1",
    userId: { $ne: "user-1" },
    isActive: true,
  });
  assert.equal(calls.conversationUpdate.update.$set.lastMessage.seq, 9);
  assert.equal(calls.inboxUpdateOne.update.$set.unreadCount, 0);
  assert.equal(session.ended, true);
});

test("sendMessage rejects non-member sender", async () => {
  const session = createSession();
  const service = createMessageService({
    mongoose: {
      startSession: async () => session,
    },
    ConversationMemberModel: {
      findOne: () => createMembershipQuery(null),
    },
  });

  await assert.rejects(
    () => service.sendMessage({ conversationId: "conv-1", senderId: "user-1", text: "Hi" }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.message, "User is not an active conversation member");
      return true;
    }
  );

  assert.equal(session.ended, true);
});

test("getConversationMessages requires active membership and returns ascending sequence", async () => {
  const listQuery = createMessageListQuery([
    { _id: "msg-9", seq: 9, text: "Sau", deletedAt: null },
    { _id: "msg-8", seq: 8, text: "Truoc", deletedAt: null },
  ]);
  let receivedFilter;

  const service = createMessageService({
    ConversationMemberModel: {
      findOne: async () => ({ _id: "membership-1" }),
    },
    MessageModel: {
      find: (filter) => {
        receivedFilter = filter;
        return listQuery;
      },
    },
  });

  const messages = await service.getConversationMessages({
    conversationId: "conv-1",
    userId: "user-1",
    limit: 2,
    beforeSeq: 10,
  });

  assert.deepEqual(receivedFilter, {
    conversationId: "conv-1",
    seq: { $lt: 10 },
  });
  assert.deepEqual(
    messages.map((message) => message.seq),
    [8, 9]
  );
});

test("getConversationMessages rejects users outside the conversation", async () => {
  const service = createMessageService({
    ConversationMemberModel: {
      findOne: async () => null,
    },
  });

  await assert.rejects(
    () => service.getConversationMessages({ conversationId: "conv-1", userId: "user-2" }),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});
