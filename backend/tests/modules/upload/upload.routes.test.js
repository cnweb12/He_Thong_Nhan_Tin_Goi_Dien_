const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

async function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use("/api/upload", router);
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

async function request(server, { method, path, headers = {} }) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            statusCode: res.statusCode,
            body: raw ? JSON.parse(raw) : null,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

test("upload routes require authentication", async () => {
  const uploadRoutes = require("../../../src/modules/upload/routes/upload.routes");
  const server = await createTestServer(uploadRoutes);

  try {
    const response = await request(server, {
      method: "POST",
      path: "/api/upload",
    });

    assert.equal(response.statusCode, 401);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
