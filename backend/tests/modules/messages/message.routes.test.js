const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

const { createMessageRouter } = require("../../../src/modules/messages/routes/message.routes");

async function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use("/messages", router);
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
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: raw ? JSON.parse(raw) : null,
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

test("message routes dispatch to expected handlers", async () => {
  const calls = [];
  const router = createMessageRouter({
    authenticate: (req, _res, next) => {
      req.user = { userId: "user-1" };
      next();
    },
    messageController: {
      sendMessage: (req, res) => {
        calls.push(["sendMessage", req.body.conversationId]);
        res.status(201).json({ ok: true, route: "send" });
      },
      getConversationMessages: (req, res) => {
        calls.push(["getConversationMessages", req.params.conversationId]);
        res.json({ ok: true, route: "list" });
      },
    },
  });
  const server = await createTestServer(router);

  try {
    const sendResponse = await requestJson(server, {
      method: "POST",
      path: "/messages",
      body: { conversationId: "conv-1", text: "Hello" },
    });
    const listResponse = await requestJson(server, {
      method: "GET",
      path: "/messages/conversations/conv-1",
    });

    assert.equal(sendResponse.statusCode, 201);
    assert.equal(listResponse.statusCode, 200);
    assert.deepEqual(calls, [
      ["sendMessage", "conv-1"],
      ["getConversationMessages", "conv-1"],
    ]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("message routes stop at auth middleware on error", async () => {
  const router = createMessageRouter({
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
      path: "/messages/conversations/conv-1",
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
