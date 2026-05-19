const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { mock } = require("node:test");

const healthModule = require("../../database/mongo/health");

async function createTestServer(router) {
  const app = express();
  app.use(router);
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

async function requestJson(server, { method, path }) {
  const address = server.address();

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
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
    req.end();
  });
}

test("GET /health returns service health status with MongoDB check", async () => {
  const { Router } = require("express");
  const router = Router();

  router.get("/health", async (_req, res, next) => {
    try {
      const mongo = await healthModule.checkMongoHealth();
      const ok = mongo.ok;
      res.status(ok ? 200 : 503).json({
        ok,
        service: "backend",
        mongo,
      });
    } catch (error) {
      next(error);
    }
  });

  mock.method(
    healthModule,
    "checkMongoHealth",
    async () => ({ ok: true, status: "connected" }),
    { times: 1 },
  );

  const server = await createTestServer(router);

  try {
    const response = await requestJson(server, {
      method: "GET",
      path: "/health",
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.service, "backend");
    assert.equal(response.body.mongo.ok, true);
    assert.equal(response.body.mongo.status, "connected");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    mock.reset();
  }
});

test("GET /health returns 503 when MongoDB is unhealthy", async () => {
  const { Router } = require("express");
  const router = Router();

  router.get("/health", async (_req, res, next) => {
    try {
      const mongo = await healthModule.checkMongoHealth();
      const ok = mongo.ok;
      res.status(ok ? 200 : 503).json({
        ok,
        service: "backend",
        mongo,
      });
    } catch (error) {
      next(error);
    }
  });

  mock.method(
    healthModule,
    "checkMongoHealth",
    async () => ({ ok: false, status: "disconnected" }),
    { times: 1 },
  );

  const server = await createTestServer(router);

  try {
    const response = await requestJson(server, {
      method: "GET",
      path: "/health",
    });

    assert.equal(response.statusCode, 503);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.service, "backend");
    assert.equal(response.body.mongo.ok, false);
    assert.equal(response.body.mongo.status, "disconnected");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    mock.reset();
  }
});

test("GET /health handles database check errors gracefully", async () => {
  const { Router } = require("express");
  const router = Router();

  router.get("/health", async (_req, res, next) => {
    try {
      const mongo = await healthModule.checkMongoHealth();
      const ok = mongo.ok;
      res.status(ok ? 200 : 503).json({
        ok,
        service: "backend",
        mongo,
      });
    } catch (error) {
      next(error);
    }
  });

  mock.method(
    healthModule,
    "checkMongoHealth",
    async () => {
      throw new Error("Database connection failed");
    },
    { times: 1 },
  );

  const server = await createTestServer(router);

  try {
    const response = await requestJson(server, {
      method: "GET",
      path: "/health",
    });

    assert.equal(response.statusCode, 500);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.message, "Database connection failed");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    mock.reset();
  }
});
