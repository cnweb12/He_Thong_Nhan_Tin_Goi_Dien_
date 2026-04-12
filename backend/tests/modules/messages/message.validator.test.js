const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../src/modules/messages/validators/message.validator");

test("validateSendMessageRequest accepts a valid text message", () => {
  const result = validators.validateSendMessageRequest({
    body: {
      conversationId: "conv-1",
      type: "text",
      text: "Xin chao",
      clientMessageId: "client-1",
    },
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateSendMessageRequest rejects text message without text", () => {
  const result = validators.validateSendMessageRequest({
    body: {
      conversationId: "conv-1",
      type: "text",
      text: "   ",
    },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: "text", message: "Text content is required for text messages" }]);
});

test("validateSendMessageRequest requires attachments for file messages", () => {
  const result = validators.validateSendMessageRequest({
    body: {
      conversationId: "conv-1",
      type: "file",
      text: "ignored",
      attachments: [],
    },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: "attachments", message: "Attachments are required for image or file messages" }]);
});

test("validateGetConversationMessagesRequest validates pagination query", () => {
  const result = validators.validateGetConversationMessagesRequest({
    params: { conversationId: "conv-1" },
    query: { limit: "0", beforeSeq: "-1" },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [
    { field: "limit", message: "Limit must be an integer between 1 and 100" },
    { field: "beforeSeq", message: "beforeSeq must be an integer greater than 0" },
  ]);
});
