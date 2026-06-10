const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../src/modules/users/validators/user.validator");

test("validateUpdateProfileRequest accepts a valid payload", () => {
  const result = validators.validateUpdateProfileRequest({
    body: {
      username: "nguyen.van_a",
      displayName: "Nguyen Van A",
      avatarUrl: "https://cdn.example.com/a.png",
    },
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateUpdateProfileRequest rejects an empty payload", () => {
  const result = validators.validateUpdateProfileRequest({ body: {} });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: "body", message: "At least one profile field is required" }]);
});

test("validateUpdateSettingsRequest rejects unsupported values", () => {
  const result = validators.validateUpdateSettingsRequest({
    body: {
      theme: "blue",
      allowStrangerMessage: "yes",
      readReceiptEnabled: "yes",
      timezone: "Asia/Saigon",
    },
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 4);
  assert.deepEqual(result.errors[0], { field: "timezone", message: "Unsupported settings field" });
});

test("validateUpdateSettingsRequest rejects legacy plural allowStrangerMessages", () => {
  const result = validators.validateUpdateSettingsRequest({
    body: {
      allowStrangerMessages: false,
    },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: "allowStrangerMessages", message: "Unsupported settings field" }]);
});

test("validateUpdateSettingsRequest accepts supported settings fields", () => {
  const result = validators.validateUpdateSettingsRequest({
    body: {
      theme: "dark",
      language: "en",
      allowStrangerMessage: false,
      readReceiptEnabled: true,
    },
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("validateSearchUsersQuery validates query text and limit bounds", () => {
  const result = validators.validateSearchUsersQuery({
    query: {
      q: "a",
      limit: "100",
    },
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [
    { field: "q", message: "Search query must be at least 2 characters" },
    { field: "limit", message: "Limit must be an integer between 1 and 50" },
  ]);
});

test("validateGetUserParams requires userId", () => {
  const result = validators.validateGetUserParams({ params: {} });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: "userId", message: "User ID is required" }]);
});
