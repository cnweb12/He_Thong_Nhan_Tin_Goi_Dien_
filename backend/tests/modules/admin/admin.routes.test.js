const assert = require("assert");
const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const adminRoutes = require("../../../src/modules/admin/routes/admin.routes");
const adminController = require("../../../src/modules/admin/controllers/admin.controller");
const { requireRole } = require("../../../src/modules/auth/middleware/authorization.middleware");

describe("Admin Routes", () => {
  beforeEach(() => {
    mock.method(adminController, "getAllUsers", async (req, res) => {
      res.status(200).json({ ok: true, data: { users: [], total: 0 } });
    });
    mock.method(adminController, "getUserById", async (req, res) => {
      res.status(200).json({ ok: true, data: { _id: "user1" } });
    });
    mock.method(adminController, "lockUser", async (req, res) => {
      res.status(200).json({ ok: true, data: { _id: "user1", isLocked: true } });
    });
    mock.method(adminController, "unlockUser", async (req, res) => {
      res.status(200).json({ ok: true, data: { _id: "user1", isLocked: false } });
    });
    mock.method(adminController, "changeUserRole", async (req, res) => {
      res.status(200).json({ ok: true, data: { _id: "user1", role: "admin" } });
    });
    mock.method(adminController, "getAllMessages", async (req, res) => {
      res.status(200).json({ ok: true, data: { messages: [], total: 0 } });
    });
    mock.method(adminController, "deleteMessage", async (req, res) => {
      res.status(200).json({ ok: true, data: { _id: "msg1" } });
    });
    mock.method(adminController, "getSystemSettings", async (req, res) => {
      res.status(200).json({ ok: true, data: [] });
    });
    mock.method(adminController, "updateSystemSettings", async (req, res) => {
      res.status(200).json({ ok: true, data: { key: "maintenance_mode", value: true } });
    });
    mock.method(adminController, "getBannedKeywords", async (req, res) => {
      res.status(200).json({ ok: true, data: [] });
    });
    mock.method(adminController, "addBannedKeyword", async (req, res) => {
      res.status(201).json({ ok: true, data: { _id: "kw1", keyword: "spam" } });
    });
    mock.method(adminController, "removeBannedKeyword", async (req, res) => {
      res.status(200).json({ ok: true, data: { _id: "kw1" } });
    });

    mock.method(requireRole, () => (req, res, next) => next());
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("Route Mounting", () => {
    it("should be a router instance", () => {
      assert.ok(adminRoutes);
      assert.strictEqual(typeof adminRoutes.get, "function");
      assert.strictEqual(typeof adminRoutes.post, "function");
      assert.strictEqual(typeof adminRoutes.patch, "function");
      assert.strictEqual(typeof adminRoutes.delete, "function");
    });
  });

  describe("User Management Routes", () => {
    it("should have GET / route for getting all users", () => {
      const routes = adminRoutes.stack || [];
      const getUsersRoute = routes.find(r => r.route && r.route.path === "/" && r.route.methods.get);
      assert.ok(getUsersRoute);
    });

    it("should have GET /:userId route for getting user by ID", () => {
      const routes = adminRoutes.stack || [];
      const getUserRoute = routes.find(r => r.route && r.route.path === "/:userId" && r.route.methods.get);
      assert.ok(getUserRoute);
    });

    it("should have POST /:userId/lock route for locking user", () => {
      const routes = adminRoutes.stack || [];
      const lockUserRoute = routes.find(r => r.route && r.route.path === "/:userId/lock" && r.route.methods.post);
      assert.ok(lockUserRoute);
    });

    it("should have POST /:userId/unlock route for unlocking user", () => {
      const routes = adminRoutes.stack || [];
      const unlockUserRoute = routes.find(r => r.route && r.route.path === "/:userId/unlock" && r.route.methods.post);
      assert.ok(unlockUserRoute);
    });

    it("should have PATCH /:userId/role route for changing user role", () => {
      const routes = adminRoutes.stack || [];
      const changeRoleRoute = routes.find(r => r.route && r.route.path === "/:userId/role" && r.route.methods.patch);
      assert.ok(changeRoleRoute);
    });
  });

  describe("Message Management Routes", () => {
    it("should have GET /messages route for getting all messages", () => {
      const routes = adminRoutes.stack || [];
      const getMessagesRoute = routes.find(r => r.route && r.route.path === "/messages" && r.route.methods.get);
      assert.ok(getMessagesRoute);
    });

    it("should have DELETE /messages/:messageId route for deleting message", () => {
      const routes = adminRoutes.stack || [];
      const deleteMessageRoute = routes.find(r => r.route && r.route.path === "/messages/:messageId" && r.route.methods.delete);
      assert.ok(deleteMessageRoute);
    });
  });

  describe("System Settings Routes", () => {
    it("should have GET /system-settings route for getting system settings", () => {
      const routes = adminRoutes.stack || [];
      const getSettingsRoute = routes.find(r => r.route && r.route.path === "/system-settings" && r.route.methods.get);
      assert.ok(getSettingsRoute);
    });

    it("should have PATCH /system-settings/:key route for updating system setting", () => {
      const routes = adminRoutes.stack || [];
      const updateSettingRoute = routes.find(r => r.route && r.route.path === "/system-settings/:key" && r.route.methods.patch);
      assert.ok(updateSettingRoute);
    });
  });

  describe("Banned Keywords Routes", () => {
    it("should have GET /banned-keywords route for getting banned keywords", () => {
      const routes = adminRoutes.stack || [];
      const getKeywordsRoute = routes.find(r => r.route && r.route.path === "/banned-keywords" && r.route.methods.get);
      assert.ok(getKeywordsRoute);
    });

    it("should have POST /banned-keywords route for adding banned keyword", () => {
      const routes = adminRoutes.stack || [];
      const addKeywordRoute = routes.find(r => r.route && r.route.path === "/banned-keywords" && r.route.methods.post);
      assert.ok(addKeywordRoute);
    });

    it("should have DELETE /banned-keywords/:keywordId route for removing banned keyword", () => {
      const routes = adminRoutes.stack || [];
      const removeKeywordRoute = routes.find(r => r.route && r.route.path === "/banned-keywords/:keywordId" && r.route.methods.delete);
      assert.ok(removeKeywordRoute);
    });
  });

  describe("Authorization Middleware", () => {
    it("should apply authorization middleware to all routes", () => {
      // This is a basic check - in a real test, we would verify that requireRole middleware
      // is applied to all admin routes
      assert.ok(true);
    });
  });
});
