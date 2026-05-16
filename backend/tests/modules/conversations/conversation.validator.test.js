const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../src/modules/conversations/validators/conversation.validator");

test("validateCreateDirectConversationRequest requires peerUserId", () => {
  const result = validators.validateCreateDirectConversationRequest({ body: {} });
  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: "peerUserId", message: "Peer user ID is required" }]);
});

test("validateMarkConversationAsReadRequest validates params and sequence", () => {
  const result = validators.validateMarkConversationAsReadRequest({
    params: { conversationId: "conv-1" },
    body: { lastSeenSeq: 8 },
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateGetInboxRequest rejects invalid pagination", () => {
  const result = validators.validateGetInboxRequest({
    query: { limit: "0", skip: "-1" },
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 2);
});
