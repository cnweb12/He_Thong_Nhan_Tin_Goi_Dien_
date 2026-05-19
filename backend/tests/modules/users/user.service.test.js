const test = require("node:test");
const assert = require("node:assert/strict");

const { createUserService } = require("../../../src/modules/users/services/user.service");

function createQueryableResult(items) {
  return {
    sort(sortArg) {
      this.sortArg = sortArg;
      return this;
    },
    limit(limitArg) {
      this.limitArg = limitArg;
      return Promise.resolve(items);
    },
  };
}

test("sanitize and getCurrentUser removes passwordHash", async () => {
  const userService = createUserService({
    UserModel: {
      findById: async (userId) => ({
        _id: userId,
        phone: "0901234567",
        displayName: "Alice",
        passwordHash: "secret",
        settings: { theme: "light" },
      }),
    },
  });

  const user = await userService.getCurrentUser("user-1");

  assert.deepEqual(user, {
    _id: "user-1",
    phone: "0901234567",
    displayName: "Alice",
    settings: { theme: "light" },
  });
});

test("searchUsers builds lookup filter and excludes current user", async () => {
  let receivedFilter;
  const queryable = createQueryableResult([
    {
      _id: "user-2",
      username: "alice",
      displayName: "Alice",
      phone: "0901234567",
      passwordHash: "hashed",
    },
  ]);

  const userService = createUserService({
    UserModel: {
      find: (filter) => {
        receivedFilter = filter;
        return queryable;
      },
    },
  });

  const users = await userService.searchUsers({
    query: "Alice",
    limit: 5,
    excludeUserId: "user-1",
  });

  assert.equal(receivedFilter._id.$ne, "user-1");
  assert.equal(receivedFilter.$or[1].username, "alice");
  assert.equal(queryable.limitArg, 5);
  assert.equal(users[0].passwordHash, undefined);
  assert.equal(users[0].phone, undefined);
});

test("updateProfile maps mongo duplicate errors to http errors", async () => {
  const userService = createUserService({
    UserModel: {
      findByIdAndUpdate: async () => {
        const error = new Error("duplicate");
        error.code = 11000;
        error.keyValue = { username: "alice" };
        throw error;
      },
    },
  });

  await assert.rejects(
    () => userService.updateProfile("user-1", { username: "alice" }),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.equal(error.message, "Duplicate data");
      assert.deepEqual(error.details, { username: "alice" });
      return true;
    }
  );
});

test("updateSettings writes nested settings fields", async () => {
  let receivedUpdate;
  const userService = createUserService({
    UserModel: {
      findByIdAndUpdate: async (_userId, update) => {
        receivedUpdate = update;
        return {
          _id: "user-1",
          settings: {
            theme: "dark",
            language: "en",
            allowStrangerMessages: false,
          },
          passwordHash: "secret",
        };
      },
    },
  });

  const user = await userService.updateSettings("user-1", {
    theme: "dark",
    language: "en",
    allowStrangerMessages: false,
  });

  assert.deepEqual(receivedUpdate, {
    $set: {
      "settings.theme": "dark",
      "settings.language": "en",
      "settings.allowStrangerMessages": false,
    },
  });
  assert.equal(user.passwordHash, undefined);
  assert.equal(user.settings.theme, "dark");
});
