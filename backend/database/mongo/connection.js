const mongoose = require("mongoose");
const config = require("../../src/config/env");

let connectPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectMongo(uri = config.mongoUri, options = {}) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const retries = options.retries ?? config.mongoConnectRetries;
  const retryDelayMs = options.retryDelayMs ?? config.mongoRetryDelayMs;
  const connectionOptions = {
    autoIndex: options.autoIndex ?? config.mongoAutoIndex,
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS ?? config.mongoServerSelectionTimeoutMs,
  };

  // Add replica set options for transaction support (required for tests)
  if (process.env.NODE_ENV === 'test') {
    connectionOptions.readPreference = 'primary';
    connectionOptions.retryWrites = true;
  }

  connectPromise = (async () => {
    let attempt = 0;

    while (attempt <= retries) {
      try {
        await mongoose.connect(uri, connectionOptions);
        return mongoose.connection;
      } catch (error) {
        attempt += 1;

        if (attempt > retries) {
          throw error;
        }

        console.warn(`[mongo] Connection attempt ${attempt} failed. Retrying in ${retryDelayMs}ms.`);
        await sleep(retryDelayMs);
      }
    }

    return mongoose.connection;
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

async function disconnectMongo() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}

module.exports = {
  mongoose,
  connectMongo,
  disconnectMongo,
  mongoConnection: mongoose.connection,
};
