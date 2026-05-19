const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createCallService,
} = require("../../../src/modules/calls/services/call.service");

function createCallQuery(items) {
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

test("createCallLog enforces membership and injects initiator into participants", async () => {
  let createdPayload;

  const service = createCallService({
    ConversationMemberModel: {
      findOne: async () => ({ _id: "membership-1" }),
    },
    CallModel: {
      create: async (payload) => {
        createdPayload = payload;
        return {
          ...payload,
          _id: "call-1",
          toObject() {
            return { ...this };
          },
        };
      },
    },
  });

  const call = await service.createCallLog({
    conversationId: "conv-1",
    initiatedBy: "user-1",
    type: "audio",
    status: "completed",
    participants: [{ userId: "user-2" }],
  });

  assert.equal(call._id, "call-1");
  assert.deepEqual(
    createdPayload.participants.map((participant) => participant.userId),
    ["user-1", "user-2"],
  );
});

test("getConversationCalls rejects non-member user", async () => {
  const service = createCallService({
    ConversationMemberModel: {
      findOne: async () => null,
    },
  });

  await assert.rejects(
    () =>
      service.getConversationCalls({
        conversationId: "conv-1",
        userId: "user-2",
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});

test("updateCallStatus autofills duration and endedAt", async () => {
  const updatedValues = [];
  const startedAt = new Date("2026-04-19T09:00:00.000Z");

  const service = createCallService({
    ConversationMemberModel: {
      findOne: async () => ({ _id: "membership-1" }),
    },
    CallModel: {
      findById: async () => ({
        _id: "call-1",
        conversationId: "conv-1",
        startedAt,
      }),
      findByIdAndUpdate: async (_id, update) => {
        updatedValues.push(update);
        return {
          _id: "call-1",
          ...update.$set,
        };
      },
    },
  });

  const call = await service.updateCallStatus({
    callId: "call-1",
    userId: "user-1",
    status: "completed",
  });

  assert.equal(call.status, "completed");
  assert.equal(typeof call.durationSec, "number");
  assert.equal(updatedValues.length, 1);
  assert.equal(updatedValues[0].$set.status, "completed");
  assert.ok(updatedValues[0].$set.endedAt instanceof Date);
});

test("upsertParticipantState updates participant timestamps", async () => {
  const saveCalls = [];
  const doc = {
    _id: "call-1",
    conversationId: "conv-1",
    participants: [
      { userId: "user-2", joinedAt: new Date("2026-04-19T09:00:00.000Z") },
    ],
    async save() {
      saveCalls.push(this.participants);
    },
    toObject() {
      return {
        _id: this._id,
        conversationId: this.conversationId,
        participants: this.participants,
      };
    },
  };

  const service = createCallService({
    ConversationMemberModel: {
      findOne: async () => ({ _id: "membership-1" }),
    },
    CallModel: {
      find: () => createCallQuery([]),
      findById: async () => doc,
    },
  });

  const updated = await service.upsertParticipantState({
    callId: "call-1",
    userId: "user-1",
    participantUserId: "user-2",
    leftAt: new Date("2026-04-19T09:05:00.000Z"),
  });

  assert.equal(saveCalls.length, 1);
  assert.equal(updated.participants[0].userId, "user-2");
  assert.ok(updated.participants[0].leftAt instanceof Date);
});

test("createCallLog handles malformed participants and missing startedAt", async () => {
  let createdParticipants;
  const service = createCallService({
    ConversationMemberModel: { findOne: async () => ({ _id: "membership-1" }) },
    CallModel: {
      create: async (payload) => {
        createdParticipants = payload.participants;
        // Trả về object thuần để test fallback của sanitizeCall (khi không có hàm toObject)
        return payload;
      },
    },
  });

  await service.createCallLog({
    conversationId: "conv-1",
    initiatedBy: "user-1",
    participants: [
      null,
      {},
      { userId: "user-2", joinedAt: new Date() },
      { userId: "user-1" },
    ],
  });

  assert.equal(createdParticipants.length, 2); // Chỉ giữ lại user-1 và user-2, loại bỏ null/empty
  assert.equal(
    createdParticipants.find((p) => p.userId === "user-1").userId,
    "user-1",
  );
  assert.ok(
    createdParticipants.find((p) => p.userId === "user-1").joinedAt instanceof
      Date,
  ); // Tự động điền joinedAt
});

test("getConversationCalls returns mapped calls and handles beforeStartedAt", async () => {
  const beforeStartedAt = new Date("2026-05-10T00:00:00.000Z");
  let executedFilter;

  const service = createCallService({
    ConversationMemberModel: {
      findOne: async () => ({ _id: "membership-1" }),
    },
    CallModel: {
      find: (filter) => {
        executedFilter = filter;
        return createCallQuery([
          { _id: "call-1" },
          { _id: "call-2", toObject: () => ({ _id: "call-2" }) },
        ]);
      },
    },
  });

  const calls = await service.getConversationCalls({
    conversationId: "conv-1",
    userId: "user-1",
    beforeStartedAt,
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0]._id, "call-1");
  assert.equal(calls[1]._id, "call-2");
  assert.equal(executedFilter.conversationId, "conv-1");
  assert.equal(executedFilter.startedAt.$lt, beforeStartedAt);
});

test("updateCallStatus handles 404 and explicit duration/endedAt", async () => {
  let updatedUpdate;
  const service = createCallService({
    ConversationMemberModel: { findOne: async () => ({ _id: "membership-1" }) },
    CallModel: {
      findById: async (id) =>
        id === "call-1"
          ? { _id: "call-1", conversationId: "conv-1", startedAt: new Date() }
          : null,
      findByIdAndUpdate: async (id, update) => {
        updatedUpdate = update;
        return { _id: id };
      },
    },
  });

  await assert.rejects(
    () =>
      service.updateCallStatus({
        callId: "invalid",
        userId: "user-1",
        status: "completed",
      }),
    (err) => err.statusCode === 404,
  );

  const explicitEndedAt = new Date("2026-05-10T10:00:00.000Z");
  await service.updateCallStatus({
    callId: "call-1",
    userId: "user-1",
    status: "completed",
    endedAt: explicitEndedAt,
    durationSec: 100,
  });

  assert.equal(updatedUpdate.$set.endedAt.getTime(), explicitEndedAt.getTime());
  assert.equal(updatedUpdate.$set.durationSec, 100);
});

test("upsertParticipantState handles 404 and pushes new participants", async () => {
  let savedParticipants;
  const callDoc = {
    _id: "call-1",
    conversationId: "conv-1",
    participants: [],
    async save() {
      savedParticipants = this.participants;
    },
    toObject() {
      return { ...this };
    },
  };

  const service = createCallService({
    ConversationMemberModel: { findOne: async () => ({ _id: "membership-1" }) },
    CallModel: {
      findById: async (id) => (id === "call-1" ? callDoc : null),
    },
  });

  await assert.rejects(
    () =>
      service.upsertParticipantState({
        callId: "invalid",
        userId: "user-1",
        participantUserId: "user-2",
      }),
    (err) => err.statusCode === 404,
  );

  const joinedAt = new Date("2026-05-10T10:00:00.000Z");
  await service.upsertParticipantState({
    callId: "call-1",
    userId: "user-1",
    participantUserId: "user-2",
    joinedAt,
  });

  assert.equal(savedParticipants.length, 1);
  assert.equal(savedParticipants[0].userId, "user-2");
  assert.equal(savedParticipants[0].joinedAt, joinedAt);
});

test("all functions handle and map database errors properly", async () => {
  const dbError = new Error("DB Connection Lost");
  const mapMongoErrorMock = () => ({
    statusCode: 503,
    message: "Mapped DB Error",
  });

  const service = createCallService({
    ConversationMemberModel: {
      // Mock lỗi DB tại hàm findOne (tất cả các service đều gọi hàm này)
      findOne: async () => {
        throw dbError;
      },
    },
    mapMongoError: mapMongoErrorMock,
  });

  const verifyError = (err) => {
    assert.equal(err.statusCode, 503);
    assert.equal(err.message, "Mapped DB Error");
    return true;
  };

  await assert.rejects(
    () =>
      service.createCallLog({
        conversationId: "conv-1",
        initiatedBy: "user-1",
      }),
    verifyError,
  );
  await assert.rejects(
    () =>
      service.getConversationCalls({
        conversationId: "conv-1",
        userId: "user-1",
      }),
    verifyError,
  );
  await assert.rejects(
    () =>
      service.updateCallStatus({
        callId: "call-1",
        userId: "user-1",
        status: "completed",
      }),
    verifyError,
  );
  await assert.rejects(
    () =>
      service.upsertParticipantState({
        callId: "call-1",
        userId: "user-1",
        participantUserId: "user-2",
      }),
    verifyError,
  );
});
