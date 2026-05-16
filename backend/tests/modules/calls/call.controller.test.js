const test = require("node:test");
const assert = require("node:assert/strict");

const { createCallController } = require("../../../src/modules/calls/controllers/call.controller");

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };
}

test("create returns 201 with created call", async () => {
  let receivedPayload;
  const controller = createCallController({
    validators: {
      validateCreateCallLogRequest: () => ({ isValid: true, errors: [] }),
    },
    callService: {
      createCallLog: async (payload) => {
        receivedPayload = payload;
        return { _id: "call-1", ...payload };
      },
    },
  });
  const req = {
    user: { userId: "user-1" },
    body: {
      conversationId: "conv-1",
      type: "audio",
      status: "completed",
      initiatedBy: "spoofed-user",
    },
  };
  const res = createResponse();

  await controller.create(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.payload.ok, true);
  assert.equal(res.payload.data.initiatedBy, "user-1");
  assert.equal(receivedPayload.initiatedBy, "user-1");
});

test("getConversationCalls forwards validation errors", async () => {
  const controller = createCallController({
    validators: {
      validateGetConversationCallsRequest: () => ({
        isValid: false,
        errors: [{ field: "conversationId", message: "Conversation ID is required" }],
      }),
    },
  });

  let receivedError;
  await controller.getConversationCalls(
    { params: {}, query: {}, user: { userId: "user-1" } },
    createResponse(),
    (error) => {
      receivedError = error;
    }
  );

  assert.equal(receivedError.statusCode, 400);
  assert.deepEqual(receivedError.details, [{ field: "conversationId", message: "Conversation ID is required" }]);
});

test("updateParticipant returns 200 with updated call", async () => {
  const controller = createCallController({
    validators: {
      validateUpsertCallParticipantRequest: () => ({ isValid: true, errors: [] }),
    },
    callService: {
      upsertParticipantState: async ({ callId, participantUserId }) => ({
        _id: callId,
        participants: [{ userId: participantUserId }],
      }),
    },
  });

  const req = {
    params: { callId: "call-1" },
    body: { participantUserId: "user-2", joinedAt: "2026-04-19T09:00:00.000Z" },
    user: { userId: "user-1" },
  };
  const res = createResponse();

  await controller.updateParticipant(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.ok, true);
  assert.equal(res.payload.data.participants[0].userId, "user-2");
});
