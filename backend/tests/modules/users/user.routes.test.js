const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const express = require("express");
const {
  createUserRouter,
} = require("../../../src/modules/users/routes/user.routes");

async function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use("/api/users", router);
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

async function requestJson(server, { method, path, body }) {
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
            }
          : {},
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

test("user routes call the expected controller handlers", async () => {
  const calls = [];
  const router = createUserRouter({
    authenticate: (req, _res, next) => {
      req.user = { userId: "viewer-1" };
      next();
    },
    userController: {
      getMe: (req, res) => {
        calls.push(["getMe", req.user.userId]);
        res.json({ ok: true, route: "me" });
      },
      updateMe: (_req, res) => {
        calls.push(["updateMe"]);
        res.json({ ok: true, route: "update-me" });
      },
      updateMySettings: (_req, res) => {
        calls.push(["updateMySettings"]);
        res.json({ ok: true, route: "settings" });
      },
      searchUsers: (req, res) => {
        calls.push(["searchUsers", req.query.q]);
        res.json({ ok: true, route: "search" });
      },
      listFriends: (req, res) => {
        calls.push(["listFriends", req.user.userId]);
        res.json({ ok: true, route: "friends" });
      },
      listPendingRequests: (req, res) => {
        calls.push(["listPendingRequests", req.user.userId]);
        res.json({ ok: true, route: "friend-requests" });
      },
      getUserById: (req, res) => {
        calls.push(["getUserById", req.params.userId]);
        res.json({ ok: true, route: "detail" });
      },
    },
  });
  const server = await createTestServer(router);

  try {
    const me = await requestJson(server, {
      method: "GET",
      path: "/api/users/me",
    });
    const update = await requestJson(server, {
      method: "PATCH",
      path: "/api/users/me",
      body: { displayName: "Alice" },
    });
    const settings = await requestJson(server, {
      method: "PATCH",
      path: "/api/users/me/settings",
      body: { theme: "dark" },
    });
    const search = await requestJson(server, {
      method: "GET",
      path: "/api/users/search?q=ali",
    });
    const friends = await requestJson(server, {
      method: "GET",
      path: "/api/users/me/friends",
    });
    const friendRequests = await requestJson(server, {
      method: "GET",
      path: "/api/users/me/friend-requests",
    });
    const detail = await requestJson(server, {
      method: "GET",
      path: "/api/users/user-22",
    });

    assert.equal(me.statusCode, 200);
    assert.equal(update.statusCode, 200);
    assert.equal(settings.statusCode, 200);
    assert.equal(search.body.route, "search");
    assert.equal(friends.body.route, "friends");
    assert.equal(friendRequests.body.route, "friend-requests");
    assert.equal(detail.body.route, "detail");
    assert.deepEqual(calls, [
      ["getMe", "viewer-1"],
      ["updateMe"],
      ["updateMySettings"],
      ["searchUsers", "ali"],
      ["listFriends", "viewer-1"],
      ["listPendingRequests", "viewer-1"],
      ["getUserById", "user-22"],
    ]);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("user routes surface auth errors before controller execution", async () => {
  const router = createUserRouter({
    authenticate: (_req, _res, next) => {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      next(error);
    },
    userController: {
      getMe: () => {
        throw new Error("controller should not execute");
      },
    },
  });
  const server = await createTestServer(router);

  try {
    const response = await requestJson(server, {
      method: "GET",
      path: "/api/users/me",
    });
    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
