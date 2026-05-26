const assert = require("assert");
const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const adminController = require("../../../src/modules/admin/controllers/admin.controller");
const { UserModel } = require("../../../src/modules/users/models/user.model");
const { MessageModel } = require("../../../src/modules/messages/models/message.model");
const { SystemSettingsModel } = require("../../../src/modules/admin/models/system-settings.model");
const { BannedKeywordModel } = require("../../../src/modules/admin/models/banned-keyword.model");
const adminService = require("../../../src/modules/admin/services/admin.service");
const validators = require("../../../src/modules/admin/validators/admin.validator");

describe("Admin Controller", () => {
  // Factory for mock Express res object
  const createMockRes = () => ({
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (payload) {
      this.payload = payload;
      return this;
    },
    statusCode: 200,
    payload: null,
  });

  beforeEach(() => {
    // Apply general mocks before each test
    mock.method(validators, "validateGetAllUsers", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateLockUser", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateChangeUserRole", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateGetMessages", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateUpdateSystemSettings", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateAddBannedKeyword", () => ({ isValid: true, errors: [] }));

    mock.method(UserModel, "find", async () => []);
    mock.method(UserModel, "findById", async () => null);
    mock.method(UserModel, "findByIdAndUpdate", async () => null);
    mock.method(UserModel, "countDocuments", async () => 0);

    mock.method(MessageModel, "find", async () => []);
    mock.method(MessageModel, "findById", async () => null);
    mock.method(MessageModel, "findByIdAndDelete", async () => null);

    mock.method(SystemSettingsModel, "find", async () => []);
    mock.method(SystemSettingsModel, "findOne", async () => null);
    mock.method(SystemSettingsModel, "findOneAndUpdate", async () => null);

    mock.method(BannedKeywordModel, "find", async () => []);
    mock.method(BannedKeywordModel, "create", async () => null);
    mock.method(BannedKeywordModel, "findByIdAndDelete", async () => null);

    mock.method(adminService, "getAllUsers", async () => ({ users: [], total: 0 }));
    mock.method(adminService, "getUserById", async () => null);
    mock.method(adminService, "lockUser", async () => null);
    mock.method(adminService, "unlockUser", async () => null);
    mock.method(adminService, "changeUserRole", async () => null);
    mock.method(adminService, "getAllMessages", async () => ({ messages: [], total: 0 }));
    mock.method(adminService, "deleteMessage", async () => null);
    mock.method(adminService, "getSystemSettings", async () => []);
    mock.method(adminService, "updateSystemSettings", async () => null);
    mock.method(adminService, "getBannedKeywords", async () => []);
    mock.method(adminService, "addBannedKeyword", async () => null);
    mock.method(adminService, "removeBannedKeyword", async () => null);
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("getAllUsers", () => {
    it("should return list of users", async () => {
      const mockUsers = [
        { _id: "user1", phone: "84900000001", displayName: "User 1", role: "user" },
        { _id: "user2", phone: "84900000002", displayName: "User 2", role: "admin" },
      ];
      mock.method(adminService, "getAllUsers", async () => ({ users: mockUsers, total: 2 }));

      const req = { query: { page: 1, limit: 20 } };
      const res = createMockRes();

      await adminController.getAllUsers(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
      assert.strictEqual(res.payload.data.users.length, 2);
    });

    it("should handle validation errors", async () => {
      mock.method(validators, "validateGetAllUsers", () => ({
        isValid: false,
        errors: [{ field: "page", message: "Invalid page" }],
      }));

      const req = { query: { page: "invalid" } };
      const res = createMockRes();

      await adminController.getAllUsers(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.payload.ok, false);
    });
  });

  describe("getUserById", () => {
    it("should return user by ID", async () => {
      const mockUser = { _id: "user1", phone: "84900000001", displayName: "User 1", role: "user" };
      mock.method(adminService, "getUserById", async () => mockUser);

      const req = { params: { userId: "user1" } };
      const res = createMockRes();

      await adminController.getUserById(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
      assert.strictEqual(res.payload.data._id, "user1");
    });

    it("should return 404 if user not found", async () => {
      mock.method(adminService, "getUserById", async () => null);

      const req = { params: { userId: "nonexistent" } };
      const res = createMockRes();

      await adminController.getUserById(req, res);

      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.payload.ok, false);
    });
  });

  describe("lockUser", () => {
    it("should lock user successfully", async () => {
      mock.method(adminService, "lockUser", async () => ({ _id: "user1", isLocked: true }));

      const req = { params: { userId: "user1" } };
      const res = createMockRes();

      await adminController.lockUser(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
    });

    it("should handle validation errors", async () => {
      mock.method(validators, "validateLockUser", () => ({
        isValid: false,
        errors: [{ field: "userId", message: "Invalid user ID" }],
      }));

      const req = { params: { userId: "invalid" } };
      const res = createMockRes();

      await adminController.lockUser(req, res);

      assert.strictEqual(res.statusCode, 400);
    });
  });

  describe("unlockUser", () => {
    it("should unlock user successfully", async () => {
      mock.method(adminService, "unlockUser", async () => ({ _id: "user1", isLocked: false }));

      const req = { params: { userId: "user1" } };
      const res = createMockRes();

      await adminController.unlockUser(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
    });
  });

  describe("changeUserRole", () => {
    it("should change user role successfully", async () => {
      mock.method(adminService, "changeUserRole", async () => ({ _id: "user1", role: "admin" }));

      const req = { params: { userId: "user1" }, body: { role: "admin" } };
      const res = createMockRes();

      await adminController.changeUserRole(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
    });

    it("should handle validation errors", async () => {
      mock.method(validators, "validateChangeUserRole", () => ({
        isValid: false,
        errors: [{ field: "role", message: "Invalid role" }],
      }));

      const req = { params: { userId: "user1" }, body: { role: "invalid" } };
      const res = createMockRes();

      await adminController.changeUserRole(req, res);

      assert.strictEqual(res.statusCode, 400);
    });
  });

  describe("getAllMessages", () => {
    it("should return list of messages", async () => {
      const mockMessages = [
        { _id: "msg1", conversationId: "conv1", text: "Hello" },
        { _id: "msg2", conversationId: "conv1", text: "World" },
      ];
      mock.method(adminService, "getAllMessages", async () => ({ messages: mockMessages, total: 2 }));

      const req = { query: { page: 1, limit: 20 } };
      const res = createMockRes();

      await adminController.getAllMessages(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
      assert.strictEqual(res.payload.data.messages.length, 2);
    });
  });

  describe("deleteMessage", () => {
    it("should delete message successfully", async () => {
      mock.method(adminService, "deleteMessage", async () => ({ _id: "msg1" }));

      const req = { params: { messageId: "msg1" } };
      const res = createMockRes();

      await adminController.deleteMessage(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
    });

    it("should return 404 if message not found", async () => {
      mock.method(adminService, "deleteMessage", async () => null);

      const req = { params: { messageId: "nonexistent" } };
      const res = createMockRes();

      await adminController.deleteMessage(req, res);

      assert.strictEqual(res.statusCode, 404);
    });
  });

  describe("getSystemSettings", () => {
    it("should return system settings", async () => {
      const mockSettings = [
        { key: "maintenance_mode", value: false },
        { key: "max_users", value: 1000 },
      ];
      mock.method(adminService, "getSystemSettings", async () => mockSettings);

      const req = {};
      const res = createMockRes();

      await adminController.getSystemSettings(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
      assert.strictEqual(res.payload.data.length, 2);
    });
  });

  describe("updateSystemSettings", () => {
    it("should update system setting successfully", async () => {
      mock.method(adminService, "updateSystemSettings", async () => ({ key: "maintenance_mode", value: true }));

      const req = { params: { key: "maintenance_mode" }, body: { value: true } };
      const res = createMockRes();

      await adminController.updateSystemSettings(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
    });

    it("should handle validation errors", async () => {
      mock.method(validators, "validateUpdateSystemSettings", () => ({
        isValid: false,
        errors: [{ field: "value", message: "Invalid value" }],
      }));

      const req = { params: { key: "maintenance_mode" }, body: { value: "invalid" } };
      const res = createMockRes();

      await adminController.updateSystemSettings(req, res);

      assert.strictEqual(res.statusCode, 400);
    });
  });

  describe("getBannedKeywords", () => {
    it("should return banned keywords", async () => {
      const mockKeywords = [
        { _id: "kw1", keyword: "spam", isActive: true },
        { _id: "kw2", keyword: "abuse", isActive: true },
      ];
      mock.method(adminService, "getBannedKeywords", async () => mockKeywords);

      const req = {};
      const res = createMockRes();

      await adminController.getBannedKeywords(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
      assert.strictEqual(res.payload.data.length, 2);
    });
  });

  describe("addBannedKeyword", () => {
    it("should add banned keyword successfully", async () => {
      mock.method(adminService, "addBannedKeyword", async () => ({ _id: "kw1", keyword: "spam", isActive: true }));

      const req = { body: { keyword: "spam" } };
      const res = createMockRes();

      await adminController.addBannedKeyword(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.payload.ok, true);
    });

    it("should handle validation errors", async () => {
      mock.method(validators, "validateAddBannedKeyword", () => ({
        isValid: false,
        errors: [{ field: "keyword", message: "Keyword is required" }],
      }));

      const req = { body: {} };
      const res = createMockRes();

      await adminController.addBannedKeyword(req, res);

      assert.strictEqual(res.statusCode, 400);
    });
  });

  describe("removeBannedKeyword", () => {
    it("should remove banned keyword successfully", async () => {
      mock.method(adminService, "removeBannedKeyword", async () => ({ _id: "kw1" }));

      const req = { params: { keywordId: "kw1" } };
      const res = createMockRes();

      await adminController.removeBannedKeyword(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.payload.ok, true);
    });

    it("should return 404 if keyword not found", async () => {
      mock.method(adminService, "removeBannedKeyword", async () => null);

      const req = { params: { keywordId: "nonexistent" } };
      const res = createMockRes();

      await adminController.removeBannedKeyword(req, res);

      assert.strictEqual(res.statusCode, 404);
    });
  });
});
