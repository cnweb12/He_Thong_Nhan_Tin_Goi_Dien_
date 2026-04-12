const test = require("node:test");
const assert = require("node:assert/strict");

const { createMessageController } = require("../../../src/modules/messages/controllers/message.controller");

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

test("sendMessage returns 201 with created message", async () => {
  const controller = createMessageController({
    validators: {
      validateSendMessageRequest: () => ({ isValid: true, errors: [] }),
    },
    messageService: {
      sendMessage: async (payload) => ({ _id: "msg-1", ...payload, seq: 1 }),
    },
  });
  const req = {
    user: { userId: "user-1" },
    body: {
      conversationId: "conv-1",
      type: "text",
      text: "Xin chao",
    },
  };
  const res = createResponse();

  await controller.sendMessage(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.payload.ok, true);
  assert.equal(res.payload.data.senderId, "user-1");
});

test("getConversationMessages forwards validation errors", async () => {
  const controller = createMessageController({
    validators: {
      validateGetConversationMessagesRequest: () => ({
        isValid: false,
        errors: [{ field: "conversationId", message: "Conversation ID is required" }],
      }),
    },
  });
  let receivedError;

  await controller.getConversationMessages(
    { params: {}, query: {}, user: { userId: "user-1" } },
    createResponse(),
    (error) => {
      receivedError = error;
    }
  );

  assert.equal(receivedError.statusCode, 400);
  assert.deepEqual(receivedError.details, [{ field: "conversationId", message: "Conversation ID is required" }]);
});
