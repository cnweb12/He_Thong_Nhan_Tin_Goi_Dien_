const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

const {
  createConversationRouter,
} = require("../../../src/modules/conversations/routes/conversation.routes");

async function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use("/api/conversations", router);
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

test("conversation routes dispatch to expected handlers", async () => {
  const calls = [];
  const router = createConversationRouter({
    authenticate: (req, _res, next) => {
      req.user = { userId: "user-1" };
      next();
    },
    conversationController: {
      createDirect: (req, res) => {
        calls.push(["createDirect", req.body.peerUserId]);
        res.status(201).json({ ok: true });
      },
      getInbox: (_req, res) => {
        calls.push(["getInbox"]);
        res.json({ ok: true });
      },
      markAsRead: (req, res) => {
        calls.push(["markAsRead", req.params.conversationId]);
        res.json({ ok: true });
      },
    },
  });
  const server = await createTestServer(router);

  try {
    const createResponse = await requestJson(server, {
      method: "POST",
      path: "/api/conversations/direct",
      body: { peerUserId: "user-2" },
    });
    const inboxResponse = await requestJson(server, {
      method: "GET",
      path: "/api/conversations/inbox",
    });
    const readResponse = await requestJson(server, {
      method: "PATCH",
      path: "/api/conversations/conv-1/read",
      body: { lastSeenSeq: 8 },
    });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(inboxResponse.statusCode, 200);
    assert.equal(readResponse.statusCode, 200);
    assert.deepEqual(calls, [
      ["createDirect", "user-2"],
      ["getInbox"],
      ["markAsRead", "conv-1"],
    ]);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("conversation routes stop at auth middleware on error", async () => {
  const router = createConversationRouter({
    authenticate: (_req, _res, next) => {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      next(error);
    },
  });
  const server = await createTestServer(router);

  try {
    const response = await requestJson(server, {
      method: "GET",
      path: "/api/conversations/inbox",
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
