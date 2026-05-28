const http = require("node:http");
const app = require("./app");
const { connectMongo, disconnectMongo, registerModels, mongoose } = require("../database/mongo");
const config = require("./config/env");
const { initializeSocket, resetAllDevicesToOffline } = require("./socket/socket");

let server;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`[server] Received ${signal}. Shutting down.`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await disconnectMongo();
    process.exit(0);
  } catch (error) {
    console.error("[server] Graceful shutdown failed.", error);
    process.exit(1);
  }
}

async function startServer() {
  registerModels();

  mongoose.set("debug", true);

  await connectMongo(config.mongoUri);

  // Reset all devices to offline on startup (handles crash/restart scenarios)
  await resetAllDevicesToOffline();

  server = http.createServer(app);
  
  // Initialize Socket.IO
  initializeSocket(server);
  
  server.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port}.`);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (error) => {
  console.error("[server] Unhandled rejection.", error);
});

startServer().catch((error) => {
  console.error("[server] Failed to start.", error);
  process.exit(1);
});
