const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const username = process.env.MONGO_APP_USER || "chat_app_user";
  const password = process.env.MONGO_APP_PASSWORD || "chat_app_password";
  const dbName = process.env.MONGO_APP_DB || "chat_app";
  const host = process.env.MONGO_HOST || "127.0.0.1";
  const port = process.env.MONGO_PORT || "27018";
  const authSource = process.env.MONGO_AUTH_SOURCE || dbName;

  return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?authSource=${encodeURIComponent(authSource)}`;
};

const parseCsv = (value) => {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const defaultCorsOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const corsOrigins = (() => {
  const envOrigins = parseCsv(process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN);
  if (envOrigins.length > 0) {
    return envOrigins;
  }

  return defaultCorsOrigins;
})();

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  mongoUri: buildMongoUri(),
  mongoDbName: process.env.MONGO_APP_DB || "chat_app",
  mongoConnectRetries: toNumber(process.env.MONGO_CONNECT_RETRIES, 3),
  mongoRetryDelayMs: toNumber(process.env.MONGO_RETRY_DELAY_MS, 1000),
  mongoAutoIndex: process.env.MONGO_AUTO_INDEX !== "false",
  mongoServerSelectionTimeoutMs: toNumber(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 5000),
  jwtSecret: process.env.JWT_SECRET || "your-default-secret-key-change-in-production",
  corsOrigins,
};
