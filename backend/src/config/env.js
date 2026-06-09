const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const normalizeEnvValue = (value) => (typeof value === "string" ? value.trim() : value);

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const username = process.env.MONGO_APP_USER || "chat_app_user";
  const password = process.env.MONGO_APP_PASSWORD;

  if (!password) {
    throw new Error(
      "MONGO_APP_PASSWORD environment variable is not set. " +
        "Please set this variable in your .env file or environment configuration. " +
        "For security reasons, a default password is not provided.",
    );
  }

  const dbName = process.env.MONGO_APP_DB || "chat_app";
  const host = process.env.MONGO_HOST || "127.0.0.1";
  const port = process.env.MONGO_PORT || "27018";
  const authSource = process.env.MONGO_AUTH_SOURCE || dbName;

  return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?authSource=${encodeURIComponent(authSource)}`;
};

const buildCorsOrigins = () => {
  const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN;
  if (corsOrigin) {
    return corsOrigin.split(",").map((origin) => origin.trim());
  }
  // Default local origins
  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];
};

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  mongoUri: buildMongoUri(),
  mongoDbName: process.env.MONGO_APP_DB || "chat_app",
  mongoConnectRetries: toNumber(process.env.MONGO_CONNECT_RETRIES, 3),
  mongoRetryDelayMs: toNumber(process.env.MONGO_RETRY_DELAY_MS, 1000),
  mongoAutoIndex: process.env.MONGO_AUTO_INDEX !== "false",
  mongoServerSelectionTimeoutMs: toNumber(
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    5000,
  ),
  jwtSecret:
    process.env.JWT_SECRET || "your-default-secret-key-change-in-production",
  superAdminPhone: process.env.SUPER_ADMIN_PHONE,
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
  superAdminDisplayName: process.env.SUPER_ADMIN_DISPLAY_NAME || "Super Admin",
  corsOrigins: buildCorsOrigins(),
  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || "chat_uploads",
  },
  twilioAccountSid: normalizeEnvValue(process.env.TWILIO_ACCOUNT_SID),
  twilioApiKeySid: normalizeEnvValue(process.env.TWILIO_API_KEY_SID),
  twilioApiKeySecret: normalizeEnvValue(process.env.TWILIO_API_KEY_SECRET),
  twilioTwimlAppSid: normalizeEnvValue(process.env.TWILIO_TWIML_APP_SID),
};
