const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

const { createCallRouter } = require("../../../src/modules/calls/routes/calls.routes");

async function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use("/calls", router);
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

test("call routes dispatch to expected handlers", async () => {
  const calls = [];
  const router = createCallRouter({
    authenticate: (req, _res, next) => {
      req.user = { userId: "user-1" };
      next();
    },
    callController: {
      create: (req, res) => {
        calls.push(["create", req.body.conversationId]);
        res.status(201).json({ ok: true });
      },
      getConversationCalls: (req, res) => {
        calls.push(["list", req.params.conversationId]);
        res.json({ ok: true });
      },
      updateStatus: (req, res) => {
        calls.push(["status", req.params.callId]);
        res.json({ ok: true });
      },
      updateParticipant: (req, res) => {
        calls.push(["participant", req.params.callId]);
        res.json({ ok: true });
      },
    },
  });
  const server = await createTestServer(router);

  try {
    const createResponse = await requestJson(server, {
      method: "POST",
      path: "/calls",
      body: { conversationId: "conv-1", type: "audio", status: "completed" },
    });
    const listResponse = await requestJson(server, {
      method: "GET",
      path: "/calls/conversations/conv-1",
    });
    const statusResponse = await requestJson(server, {
      method: "PATCH",
      path: "/calls/call-1/status",
      body: { status: "completed" },
    });
    const participantResponse = await requestJson(server, {
      method: "PATCH",
      path: "/calls/call-1/participants",
      body: { participantUserId: "user-2", joinedAt: "2026-04-19T09:00:00.000Z" },
    });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(listResponse.statusCode, 200);
    assert.equal(statusResponse.statusCode, 200);
    assert.equal(participantResponse.statusCode, 200);
    assert.deepEqual(calls, [
      ["create", "conv-1"],
      ["list", "conv-1"],
      ["status", "call-1"],
      ["participant", "call-1"],
    ]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("call routes stop at auth middleware on error", async () => {
  const router = createCallRouter({
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
      path: "/calls/conversations/conv-1",
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
