const test = require("node:test");
const assert = require("node:assert/strict");

const { createCallService } = require("../../../src/modules/calls/services/call.service");

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
    ["user-1", "user-2"]
  );
});

test("getConversationCalls rejects non-member user", async () => {
  const service = createCallService({
    ConversationMemberModel: {
      findOne: async () => null,
    },
  });

  await assert.rejects(
    () => service.getConversationCalls({ conversationId: "conv-1", userId: "user-2" }),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
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
    participants: [{ userId: "user-2", joinedAt: new Date("2026-04-19T09:00:00.000Z") }],
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
