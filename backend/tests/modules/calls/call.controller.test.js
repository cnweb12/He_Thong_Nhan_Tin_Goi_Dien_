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

test("create forwards validation errors", async () => {
  const controller = createCallController({
    validators: {
      validateCreateCallLogRequest: () => ({ isValid: false, errors: ["validation error"] }),
    },
  });
  let receivedError;
  await controller.create({}, createResponse(), (err) => { receivedError = err; });
  assert.equal(receivedError.statusCode, 400);
});

test("create forwards service errors", async () => {
  const controller = createCallController({
    validators: { validateCreateCallLogRequest: () => ({ isValid: true }) },
    callService: { createCallLog: async () => { throw new Error("Service error"); } },
  });
  let receivedError;
  await controller.create({ body: {}, user: {} }, createResponse(), (err) => { receivedError = err; });
  assert.equal(receivedError.message, "Service error");
});

test("getConversationCalls returns 200 with calls and handles optional parameters", async () => {
  let receivedPayload;
  const controller = createCallController({
    validators: { validateGetConversationCallsRequest: () => ({ isValid: true }) },
    callService: {
      getConversationCalls: async (payload) => {
        receivedPayload = payload;
        return [{ _id: "call-1" }];
      },
    },
  });
  
  const req = {
    params: { conversationId: "conv-1" },
    query: { beforeStartedAt: "2026-04-19T09:00:00.000Z" },
    user: { userId: "user-1" },
  };
  const res = createResponse();
  
  await controller.getConversationCalls(req, res, () => {});
  
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.data[0]._id, "call-1");
  assert.equal(receivedPayload.limit, 20); // Test default value assigned
  assert.ok(receivedPayload.beforeStartedAt instanceof Date); // Test date parsed
});

test("getConversationCalls forwards service errors", async () => {
  const controller = createCallController({
    validators: { validateGetConversationCallsRequest: () => ({ isValid: true }) },
    callService: { getConversationCalls: async () => { throw new Error("Service error"); } },
  });
  let receivedError;
  await controller.getConversationCalls({ params: {}, query: {}, user: {} }, createResponse(), (err) => { receivedError = err; });
  assert.equal(receivedError.message, "Service error");
});

test("updateStatus returns 200 with updated call", async () => {
  let receivedPayload;
  const controller = createCallController({
    validators: { validateUpdateCallStatusRequest: () => ({ isValid: true }) },
    callService: {
      updateCallStatus: async (payload) => {
        receivedPayload = payload;
        return { _id: "call-1", status: "completed" };
      },
    },
  });
  
  const req = {
    params: { callId: "call-1" },
    body: { status: "completed", endedAt: "2026-04-19T09:05:00.000Z", durationSec: "300" },
    user: { userId: "user-1" },
  };
  const res = createResponse();
  
  await controller.updateStatus(req, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.equal(receivedPayload.status, "completed");
  assert.ok(receivedPayload.endedAt instanceof Date);
  assert.equal(receivedPayload.durationSec, 300);
});

test("updateStatus forwards validation and service errors", async () => {
  const controllerValidation = createCallController({
    validators: { validateUpdateCallStatusRequest: () => ({ isValid: false, errors: [] }) },
  });
  let receivedError;
  await controllerValidation.updateStatus({}, createResponse(), (err) => { receivedError = err; });
  assert.equal(receivedError.statusCode, 400);

  const controllerService = createCallController({
    validators: { validateUpdateCallStatusRequest: () => ({ isValid: true }) },
    callService: { updateCallStatus: async () => { throw new Error("Service error"); } },
  });
  await controllerService.updateStatus({ params: {}, body: {}, user: {} }, createResponse(), (err) => { receivedError = err; });
  assert.equal(receivedError.message, "Service error");
});

test("updateParticipant forwards validation and service errors", async () => {
  const controllerValidation = createCallController({
    validators: { validateUpsertCallParticipantRequest: () => ({ isValid: false, errors: [] }) },
  });
  let receivedError;
  await controllerValidation.updateParticipant({}, createResponse(), (err) => { receivedError = err; });
  assert.equal(receivedError.statusCode, 400);

  const controllerService = createCallController({
    validators: { validateUpsertCallParticipantRequest: () => ({ isValid: true }) },
    callService: { upsertParticipantState: async () => { throw new Error("Service error"); } },
  });
  await controllerService.updateParticipant({ params: {}, body: {}, user: {} }, createResponse(), (err) => { receivedError = err; });
  assert.equal(receivedError.message, "Service error");
});

test("createCallController initializes with default dependencies", () => {
  const controller = createCallController();
  assert.equal(typeof controller.create, "function");
});
