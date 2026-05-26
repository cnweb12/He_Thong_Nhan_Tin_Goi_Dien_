const assert = require("assert");
const { describe, it, mock } = require("node:test");
const validators = require("../../../src/modules/admin/validators/admin.validator");

describe("Admin Validators", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  describe("validateGetAllUsers", () => {
    it("should validate valid query parameters", () => {
      const req = { query: { page: 1, limit: 20, role: "user" } };
      const result = validators.validateGetAllUsers(req);

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("should reject invalid page", () => {
      const req = { query: { page: "invalid" } };
      const result = validators.validateGetAllUsers(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "page"));
    });

    it("should reject negative page", () => {
      const req = { query: { page: -1 } };
      const result = validators.validateGetAllUsers(req);

      assert.strictEqual(result.isValid, false);
    });

    it("should reject invalid limit", () => {
      const req = { query: { limit: "invalid" } };
      const result = validators.validateGetAllUsers(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "limit"));
    });

    it("should reject invalid role", () => {
      const req = { query: { role: "invalid_role" } };
      const result = validators.validateGetAllUsers(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "role"));
    });
  });

  describe("validateLockUser", () => {
    it("should validate valid userId", () => {
      const req = { params: { userId: "valid-user-id" } };
      const result = validators.validateLockUser(req);

      assert.strictEqual(result.isValid, true);
    });

    it("should reject missing userId", () => {
      const req = { params: {} };
      const result = validators.validateLockUser(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "userId"));
    });
  });

  describe("validateChangeUserRole", () => {
    it("should validate valid role change", () => {
      const req = { params: { userId: "valid-user-id" }, body: { role: "admin" } };
      const result = validators.validateChangeUserRole(req);

      assert.strictEqual(result.isValid, true);
    });

    it("should reject missing userId", () => {
      const req = { params: {}, body: { role: "admin" } };
      const result = validators.validateChangeUserRole(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "userId"));
    });

    it("should reject missing role", () => {
      const req = { params: { userId: "valid-user-id" }, body: {} };
      const result = validators.validateChangeUserRole(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "role"));
    });

    it("should reject invalid role", () => {
      const req = { params: { userId: "valid-user-id" }, body: { role: "invalid_role" } };
      const result = validators.validateChangeUserRole(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "role"));
    });
  });

  describe("validateGetMessages", () => {
    it("should validate valid query parameters", () => {
      const req = { query: { page: 1, limit: 20, conversationId: "conv-id" } };
      const result = validators.validateGetMessages(req);

      assert.strictEqual(result.isValid, true);
    });

    it("should reject invalid page", () => {
      const req = { query: { page: "invalid" } };
      const result = validators.validateGetMessages(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "page"));
    });

    it("should reject invalid limit", () => {
      const req = { query: { limit: "invalid" } };
      const result = validators.validateGetMessages(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "limit"));
    });
  });

  describe("validateUpdateSystemSettings", () => {
    it("should validate valid setting update", () => {
      const req = { params: { key: "maintenance_mode" }, body: { value: true } };
      const result = validators.validateUpdateSystemSettings(req);

      assert.strictEqual(result.isValid, true);
    });

    it("should reject missing key", () => {
      const req = { params: {}, body: { value: true } };
      const result = validators.validateUpdateSystemSettings(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "key"));
    });

    it("should reject missing value", () => {
      const req = { params: { key: "maintenance_mode" }, body: {} };
      const result = validators.validateUpdateSystemSettings(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "value"));
    });
  });

  describe("validateAddBannedKeyword", () => {
    it("should validate valid keyword", () => {
      const req = { body: { keyword: "spam" } };
      const result = validators.validateAddBannedKeyword(req);

      assert.strictEqual(result.isValid, true);
    });

    it("should reject missing keyword", () => {
      const req = { body: {} };
      const result = validators.validateAddBannedKeyword(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "keyword"));
    });

    it("should reject empty keyword", () => {
      const req = { body: { keyword: "" } };
      const result = validators.validateAddBannedKeyword(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "keyword"));
    });

    it("should reject keyword that is too long", () => {
      const req = { body: { keyword: "a".repeat(101) } };
      const result = validators.validateAddBannedKeyword(req);

      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(e => e.field === "keyword"));
    });
  });
});
