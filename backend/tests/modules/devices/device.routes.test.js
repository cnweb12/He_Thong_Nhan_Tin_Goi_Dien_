const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

const {
  createDeviceRouter,
} = require("../../../src/modules/devices/routes/device.routes");

async function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use("/api/devices", router);
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

test("device routes dispatch to expected handlers", async () => {
  const calls = [];
  const router = createDeviceRouter({
    authenticate: (req, _res, next) => {
      req.user = { userId: "user-1" };
      next();
    },
    deviceController: {
      upsertCurrent: (req, res) => {
        calls.push(["upsertCurrent", req.body.deviceId]);
        res.status(201).json({ ok: true });
      },
      getMyDevices: (_req, res) => {
        calls.push(["getMyDevices"]);
        res.json({ ok: true });
      },
      updateCurrentPresence: (req, res) => {
        calls.push(["updateCurrentPresence", req.body.deviceId]);
        res.json({ ok: true });
      },
    },
  });
  const server = await createTestServer(router);

  try {
    const upsertResponse = await requestJson(server, {
      method: "PUT",
      path: "/api/devices/current",
      body: { deviceId: "device-1", platform: "web" },
    });
    const listResponse = await requestJson(server, {
      method: "GET",
      path: "/api/devices/me",
    });
    const presenceResponse = await requestJson(server, {
      method: "PATCH",
      path: "/api/devices/current/presence",
      body: { deviceId: "device-1", isOnline: false },
    });

    assert.equal(upsertResponse.statusCode, 201);
    assert.equal(listResponse.statusCode, 200);
    assert.equal(presenceResponse.statusCode, 200);
    assert.deepEqual(calls, [
      ["upsertCurrent", "device-1"],
      ["getMyDevices"],
      ["updateCurrentPresence", "device-1"],
    ]);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("device routes stop at auth middleware on error", async () => {
  const router = createDeviceRouter({
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
      path: "/api/devices/me",
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, "Unauthorized");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
