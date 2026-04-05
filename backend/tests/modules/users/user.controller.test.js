const test = require("node:test");
const assert = require("node:assert/strict");

const { createUserController } = require("../../../src/modules/users/controllers/user.controller");

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

test("getMe returns current user payload", async () => {
  const controller = createUserController({
    userService: {
      getCurrentUser: async (userId) => ({ _id: userId, displayName: "Alice" }),
    },
  });
  const req = { user: { userId: "user-1" } };
  const res = createResponse();

  await controller.getMe(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.deepEqual(res.payload, {
    ok: true,
    data: { _id: "user-1", displayName: "Alice" },
  });
});

test("searchUsers forwards validation errors to next", async () => {
  const controller = createUserController({
    validators: {
      validateSearchUsersQuery: () => ({
        isValid: false,
        errors: [{ field: "q", message: "Search query is required" }],
      }),
    },
  });
  const req = { query: {}, user: { userId: "user-1" } };
  const res = createResponse();
  let receivedError;

  await controller.searchUsers(req, res, (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.statusCode, 400);
  assert.deepEqual(receivedError.details, [{ field: "q", message: "Search query is required" }]);
});

test("updateMySettings delegates to service with authenticated user id", async () => {
  let serviceCall;
  const controller = createUserController({
    validators: {
      validateUpdateSettingsRequest: () => ({ isValid: true, errors: [] }),
    },
    userService: {
      updateSettings: async (userId, body) => {
        serviceCall = { userId, body };
        return { _id: userId, settings: body };
      },
    },
  });
  const req = {
    user: { userId: "user-9" },
    body: { theme: "dark" },
  };
  const res = createResponse();

  await controller.updateMySettings(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.deepEqual(serviceCall, {
    userId: "user-9",
    body: { theme: "dark" },
  });
  assert.equal(res.payload.ok, true);
});
