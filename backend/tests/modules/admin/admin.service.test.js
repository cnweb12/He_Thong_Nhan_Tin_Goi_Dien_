const assert = require("assert");
const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const adminService = require("../../../src/modules/admin/services/admin.service");
const { UserModel } = require("../../../src/modules/users/models/user.model");
const { MessageModel } = require("../../../src/modules/messages/models/message.model");
const { SystemSettingsModel } = require("../../../src/modules/admin/models/system-settings.model");
const { BannedKeywordModel } = require("../../../src/modules/admin/models/banned-keyword.model");

describe("Admin Service", () => {
  beforeEach(() => {
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
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("getAllUsers", () => {
    it("should return paginated users", async () => {
      const mockUsers = [
        { _id: "user1", phone: "84900000001", displayName: "User 1", role: "user" },
        { _id: "user2", phone: "84900000002", displayName: "User 2", role: "admin" },
      ];
      mock.method(UserModel, "find", async () => mockUsers);
      mock.method(UserModel, "countDocuments", async () => 2);

      const result = await adminService.getAllUsers({ page: 1, limit: 20 });

      assert.strictEqual(result.users.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it("should filter by role if provided", async () => {
      const mockUsers = [{ _id: "user1", phone: "84900000001", displayName: "User 1", role: "admin" }];
      mock.method(UserModel, "find", async () => mockUsers);
      mock.method(UserModel, "countDocuments", async () => 1);

      const result = await adminService.getAllUsers({ page: 1, limit: 20, role: "admin" });

      assert.strictEqual(result.users.length, 1);
    });
  });

  describe("getUserById", () => {
    it("should return user by ID", async () => {
      const mockUser = { _id: "user1", phone: "84900000001", displayName: "User 1", role: "user" };
      mock.method(UserModel, "findById", async () => mockUser);

      const result = await adminService.getUserById("user1");

      assert.strictEqual(result._id, "user1");
    });

    it("should return null if user not found", async () => {
      mock.method(UserModel, "findById", async () => null);

      const result = await adminService.getUserById("nonexistent");

      assert.strictEqual(result, null);
    });
  });

  describe("lockUser", () => {
    it("should lock user successfully", async () => {
      const mockUser = { _id: "user1", isLocked: false };
      const lockedUser = { _id: "user1", isLocked: true };
      mock.method(UserModel, "findById", async () => mockUser);
      mock.method(UserModel, "findByIdAndUpdate", async () => lockedUser);

      const result = await adminService.lockUser("user1");

      assert.strictEqual(result.isLocked, true);
    });

    it("should return null if user not found", async () => {
      mock.method(UserModel, "findById", async () => null);

      const result = await adminService.lockUser("nonexistent");

      assert.strictEqual(result, null);
    });
  });

  describe("unlockUser", () => {
    it("should unlock user successfully", async () => {
      const mockUser = { _id: "user1", isLocked: true };
      const unlockedUser = { _id: "user1", isLocked: false };
      mock.method(UserModel, "findById", async () => mockUser);
      mock.method(UserModel, "findByIdAndUpdate", async () => unlockedUser);

      const result = await adminService.unlockUser("user1");

      assert.strictEqual(result.isLocked, false);
    });
  });

  describe("changeUserRole", () => {
    it("should change user role successfully", async () => {
      const mockUser = { _id: "user1", role: "user" };
      const updatedUser = { _id: "user1", role: "admin" };
      mock.method(UserModel, "findById", async () => mockUser);
      mock.method(UserModel, "findByIdAndUpdate", async () => updatedUser);

      const result = await adminService.changeUserRole("user1", "admin");

      assert.strictEqual(result.role, "admin");
    });

    it("should return null if user not found", async () => {
      mock.method(UserModel, "findById", async () => null);

      const result = await adminService.changeUserRole("nonexistent", "admin");

      assert.strictEqual(result, null);
    });
  });

  describe("getAllMessages", () => {
    it("should return paginated messages", async () => {
      const mockMessages = [
        { _id: "msg1", conversationId: "conv1", text: "Hello" },
        { _id: "msg2", conversationId: "conv1", text: "World" },
      ];
      mock.method(MessageModel, "find", async () => mockMessages);
      mock.method(MessageModel, "countDocuments", async () => 2);

      const result = await adminService.getAllMessages({ page: 1, limit: 20 });

      assert.strictEqual(result.messages.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it("should filter by conversationId if provided", async () => {
      const mockMessages = [{ _id: "msg1", conversationId: "conv1", text: "Hello" }];
      mock.method(MessageModel, "find", async () => mockMessages);
      mock.method(MessageModel, "countDocuments", async () => 1);

      const result = await adminService.getAllMessages({ page: 1, limit: 20, conversationId: "conv1" });

      assert.strictEqual(result.messages.length, 1);
    });
  });

  describe("deleteMessage", () => {
    it("should delete message successfully", async () => {
      const mockMessage = { _id: "msg1", text: "Hello" };
      mock.method(MessageModel, "findByIdAndDelete", async () => mockMessage);

      const result = await adminService.deleteMessage("msg1");

      assert.strictEqual(result._id, "msg1");
    });

    it("should return null if message not found", async () => {
      mock.method(MessageModel, "findByIdAndDelete", async () => null);

      const result = await adminService.deleteMessage("nonexistent");

      assert.strictEqual(result, null);
    });
  });

  describe("getSystemSettings", () => {
    it("should return all system settings", async () => {
      const mockSettings = [
        { key: "maintenance_mode", value: false },
        { key: "max_users", value: 1000 },
      ];
      mock.method(SystemSettingsModel, "find", async () => mockSettings);

      const result = await adminService.getSystemSettings();

      assert.strictEqual(result.length, 2);
    });
  });

  describe("updateSystemSettings", () => {
    it("should update system setting successfully", async () => {
      const mockSetting = { key: "maintenance_mode", value: true };
      mock.method(SystemSettingsModel, "findOneAndUpdate", async () => mockSetting);

      const result = await adminService.updateSystemSettings("maintenance_mode", true);

      assert.strictEqual(result.value, true);
    });
  });

  describe("getBannedKeywords", () => {
    it("should return all banned keywords", async () => {
      const mockKeywords = [
        { _id: "kw1", keyword: "spam", isActive: true },
        { _id: "kw2", keyword: "abuse", isActive: true },
      ];
      mock.method(BannedKeywordModel, "find", async () => mockKeywords);

      const result = await adminService.getBannedKeywords();

      assert.strictEqual(result.length, 2);
    });

    it("should filter by isActive if provided", async () => {
      const mockKeywords = [{ _id: "kw1", keyword: "spam", isActive: true }];
      mock.method(BannedKeywordModel, "find", async () => mockKeywords);

      const result = await adminService.getBannedKeywords({ isActive: true });

      assert.strictEqual(result.length, 1);
    });
  });

  describe("addBannedKeyword", () => {
    it("should add banned keyword successfully", async () => {
      const mockKeyword = { _id: "kw1", keyword: "spam", isActive: true };
      mock.method(BannedKeywordModel, "create", async () => mockKeyword);

      const result = await adminService.addBannedKeyword("spam");

      assert.strictEqual(result.keyword, "spam");
    });
  });

  describe("removeBannedKeyword", () => {
    it("should remove banned keyword successfully", async () => {
      const mockKeyword = { _id: "kw1", keyword: "spam" };
      mock.method(BannedKeywordModel, "findByIdAndDelete", async () => mockKeyword);

      const result = await adminService.removeBannedKeyword("kw1");

      assert.strictEqual(result._id, "kw1");
    });

    it("should return null if keyword not found", async () => {
      mock.method(BannedKeywordModel, "findByIdAndDelete", async () => null);

      const result = await adminService.removeBannedKeyword("nonexistent");

      assert.strictEqual(result, null);
    });
  });
});
