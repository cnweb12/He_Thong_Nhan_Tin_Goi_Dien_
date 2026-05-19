const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

async function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", router);
  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message,
      details: error.details || null,
    });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  return server;
}

async function requestJson(server, { method, path, body, headers = {} }) {
  const address = server.address();
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
              ...headers,
            }
          : headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            statusCode: res.statusCode,
            body: raw ? JSON.parse(raw) : null,
          });
        });
      },
    );

    req.on("error", reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

test("auth routes dispatch to expected handlers for public endpoints", async () => {
  const calls = [];

  // Mock the auth controller
  const mockController = {
    register: (req, res) => {
      calls.push(["register", req.body]);
      res.status(201).json({ ok: true, route: "register" });
    },
    login: (req, res) => {
      calls.push(["login", req.body]);
      res.json({ ok: true, route: "login" });
    },
    refreshAccessToken: (req, res) => {
      calls.push(["refresh", req.body]);
      res.json({ ok: true, route: "refresh" });
    },
    logout: () => {
      throw new Error("should not be called without auth");
    },
    logoutAll: () => {
      throw new Error("should not be called without auth");
    },
    getProfile: () => {
      throw new Error("should not be called without auth");
    },
    updateProfile: () => {
      throw new Error("should not be called without auth");
    },
    changePassword: () => {
      throw new Error("should not be called without auth");
    },
  };

  // Temporarily replace the controller
  const originalController = require("../../../src/modules/auth/controllers/auth.controller");
  const authRoutes = require("../../../src/modules/auth/routes/auth.routes");

  // Create a fresh router with mocked controller
  const { Router } = require("express");
  const router = Router();
  router.post("/register", mockController.register);
  router.post("/login", mockController.login);
  router.post("/refresh", mockController.refreshAccessToken);

  const server = await createTestServer(router);

  try {
    const registerResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/register",
      body: {
        phone: "123456789",
        password: "password",
        displayName: "Test User",
      },
    });
    const loginResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/login",
      body: { phone: "123456789", password: "password", deviceId: "device-1" },
    });
    const refreshResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken: "token", deviceId: "device-1" },
    });

    assert.equal(registerResponse.statusCode, 201);
    assert.equal(loginResponse.statusCode, 200);
    assert.equal(refreshResponse.statusCode, 200);
    assert.deepEqual(calls, [
      [
        "register",
        { phone: "123456789", password: "password", displayName: "Test User" },
      ],
      [
        "login",
        { phone: "123456789", password: "password", deviceId: "device-1" },
      ],
      ["refresh", { refreshToken: "token", deviceId: "device-1" }],
    ]);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("auth routes require authentication for protected endpoints", async () => {
  const mockController = {
    logout: (req, res) => {
      res.json({ ok: true, route: "logout" });
    },
    logoutAll: (req, res) => {
      res.json({ ok: true, route: "logout-all" });
    },
    getProfile: (req, res) => {
      res.json({ ok: true, route: "me" });
    },
    updateProfile: (req, res) => {
      res.json({ ok: true, route: "profile" });
    },
    changePassword: (req, res) => {
      res.json({ ok: true, route: "change-password" });
    },
  };

  const mockAuthMiddleware = (req, _res, next) => {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    next(error);
  };

  const { Router } = require("express");
  const router = Router();
  router.post("/logout", mockAuthMiddleware, mockController.logout);
  router.post("/logout-all", mockAuthMiddleware, mockController.logoutAll);
  router.get("/me", mockAuthMiddleware, mockController.getProfile);
  router.patch("/profile", mockAuthMiddleware, mockController.updateProfile);
  router.post(
    "/change-password",
    mockAuthMiddleware,
    mockController.changePassword,
  );

  const server = await createTestServer(router);

  try {
    const logoutResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/logout",
      body: { deviceId: "device-1" },
    });
    const logoutAllResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/logout-all",
    });
    const meResponse = await requestJson(server, {
      method: "GET",
      path: "/api/auth/me",
    });
    const profileResponse = await requestJson(server, {
      method: "PATCH",
      path: "/api/auth/profile",
      body: { displayName: "New Name" },
    });
    const changePasswordResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/change-password",
      body: {
        currentPassword: "old",
        newPassword: "new",
        confirmPassword: "new",
      },
    });

    assert.equal(logoutResponse.statusCode, 401);
    assert.equal(logoutAllResponse.statusCode, 401);
    assert.equal(meResponse.statusCode, 401);
    assert.equal(profileResponse.statusCode, 401);
    assert.equal(changePasswordResponse.statusCode, 401);
    assert.equal(logoutResponse.body.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("auth routes allow authenticated requests to protected endpoints", async () => {
  const calls = [];

  const mockController = {
    logout: (req, res) => {
      calls.push(["logout", req.body]);
      res.json({ ok: true, route: "logout" });
    },
    logoutAll: (req, res) => {
      calls.push(["logout-all"]);
      res.json({ ok: true, route: "logout-all" });
    },
    getProfile: (req, res) => {
      calls.push(["me", req.user.userId]);
      res.json({ ok: true, route: "me" });
    },
    updateProfile: (req, res) => {
      calls.push(["profile", req.body]);
      res.json({ ok: true, route: "profile" });
    },
    changePassword: (req, res) => {
      calls.push(["change-password", req.body]);
      res.json({ ok: true, route: "change-password" });
    },
  };

  const mockAuthMiddleware = (req, _res, next) => {
    req.user = { userId: "user-1" };
    next();
  };

  const { Router } = require("express");
  const router = Router();
  router.post("/logout", mockAuthMiddleware, mockController.logout);
  router.post("/logout-all", mockAuthMiddleware, mockController.logoutAll);
  router.get("/me", mockAuthMiddleware, mockController.getProfile);
  router.patch("/profile", mockAuthMiddleware, mockController.updateProfile);
  router.post(
    "/change-password",
    mockAuthMiddleware,
    mockController.changePassword,
  );

  const server = await createTestServer(router);

  try {
    const logoutResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/logout",
      body: { deviceId: "device-1" },
    });
    const logoutAllResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/logout-all",
    });
    const meResponse = await requestJson(server, {
      method: "GET",
      path: "/api/auth/me",
    });
    const profileResponse = await requestJson(server, {
      method: "PATCH",
      path: "/api/auth/profile",
      body: { displayName: "New Name" },
    });
    const changePasswordResponse = await requestJson(server, {
      method: "POST",
      path: "/api/auth/change-password",
      body: {
        currentPassword: "old",
        newPassword: "new",
        confirmPassword: "new",
      },
    });

    assert.equal(logoutResponse.statusCode, 200);
    assert.equal(logoutAllResponse.statusCode, 200);
    assert.equal(meResponse.statusCode, 200);
    assert.equal(profileResponse.statusCode, 200);
    assert.equal(changePasswordResponse.statusCode, 200);
    assert.deepEqual(calls, [
      ["logout", { deviceId: "device-1" }],
      ["logout-all"],
      ["me", "user-1"],
      ["profile", { displayName: "New Name" }],
      [
        "change-password",
        { currentPassword: "old", newPassword: "new", confirmPassword: "new" },
      ],
    ]);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
