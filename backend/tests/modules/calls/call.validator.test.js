const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../src/modules/calls/validators/call.validator");

test("validateCreateCallLogRequest accepts valid payload", () => {
  const result = validators.validateCreateCallLogRequest({
    body: {
      conversationId: "conv-1",
      type: "video",
      status: "completed",
      startedAt: "2026-04-19T09:00:00.000Z",
      endedAt: "2026-04-19T09:05:00.000Z",
      participants: [{ userId: "user-1", joinedAt: "2026-04-19T09:00:00.000Z" }],
    },
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateGetConversationCallsRequest validates query", () => {
  const result = validators.validateGetConversationCallsRequest({
    params: { conversationId: "" },
    query: { limit: "101", beforeStartedAt: "invalid-date" },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [
    { field: "conversationId", message: "Conversation ID is required" },
    { field: "limit", message: "Limit must be an integer between 1 and 100" },
    { field: "beforeStartedAt", message: "beforeStartedAt must be a valid date string" },
  ]);
});

test("validateUpdateCallStatusRequest rejects invalid status and duration", () => {
  const result = validators.validateUpdateCallStatusRequest({
    params: { callId: "call-1" },
    body: { status: "ringing", durationSec: -1 },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [
    { field: "status", message: "Call status is invalid" },
    { field: "durationSec", message: "Duration must be a non-negative integer" },
  ]);
});

test("validateUpsertCallParticipantRequest requires lifecycle fields", () => {
  const result = validators.validateUpsertCallParticipantRequest({
    params: { callId: "call-1" },
    body: { participantUserId: "user-2" },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: "body", message: "At least joinedAt or leftAt is required" }]);
});
