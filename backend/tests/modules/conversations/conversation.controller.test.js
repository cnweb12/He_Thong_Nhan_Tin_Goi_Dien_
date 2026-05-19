const test = require("node:test");
const assert = require("node:assert/strict");

const { createConversationController } = require("../../../src/modules/conversations/controllers/conversation.controller");

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

test("createDirect delegates to service with authenticated user id", async () => {
  let serviceCall;
  const controller = createConversationController({
    validators: {
      validateCreateDirectConversationRequest: () => ({ isValid: true, errors: [] }),
    },
    conversationService: {
      createDirectConversation: async (payload) => {
        serviceCall = payload;
        return { _id: "conv-1" };
      },
    },
  });
  const req = {
    user: { userId: "user-1" },
    body: { peerUserId: "user-2" },
  };
  const res = createResponse();

  await controller.createDirect(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.deepEqual(serviceCall, {
    userId: "user-1",
    peerUserId: "user-2",
  });
  assert.equal(res.statusCode, 201);
});

test("markAsRead forwards validation errors to next", async () => {
  const controller = createConversationController({
    validators: {
      validateMarkConversationAsReadRequest: () => ({
        isValid: false,
        errors: [{ field: "lastSeenSeq", message: "lastSeenSeq must be a non-negative integer" }],
      }),
    },
  });
  let receivedError;

  await controller.markAsRead({ params: {}, body: {}, user: { userId: "user-1" } }, createResponse(), (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.statusCode, 400);
  assert.equal(receivedError.details[0].field, "lastSeenSeq");
});

test("getInbox returns service payload", async () => {
  const controller = createConversationController({
    validators: {
      validateGetInboxRequest: () => ({ isValid: true, errors: [] }),
    },
    conversationService: {
      getInbox: async () => [{ conversationId: "conv-1" }],
    },
  });
  const res = createResponse();

  await controller.getInbox({ query: {}, user: { userId: "user-1" } }, res, () => {
    throw new Error("next should not be called");
  });

  assert.deepEqual(res.payload, {
    ok: true,
    data: [{ conversationId: "conv-1" }],
  });
});
