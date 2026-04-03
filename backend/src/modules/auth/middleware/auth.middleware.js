/**
 * Auth middleware - JWT verification and authentication checks
 */

const crypto = require("crypto");

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token structure and decode payload
 * @param {string} token - JWT token
 * @param {string} secret - Secret key for verification
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyJWTToken(token, secret) {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");

    if (signatureB64 !== expectedSignature) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {string} JWT token
 */
function generateJWTToken(payload, secret, expiresIn = 3600) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");

  return `${data}.${signature}`;
}

/**
 * Hash a token using SHA256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a random device token
 * @returns {string} Random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Express middleware for JWT authentication
 * @param {string} secret - JWT secret
 * @returns {Function} Express middleware
 */
function authenticateJWT(secret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      const error = new Error("Missing or invalid authorization header");
      error.statusCode = 401;
      return next(error);
    }

    const payload = verifyJWTToken(token, secret);

    if (!payload) {
      const error = new Error("Invalid or expired token");
      error.statusCode = 401;
      return next(error);
    }

    req.user = payload;
    next();
  };
}

module.exports = {
  extractTokenFromHeader,
  verifyJWTToken,
  generateJWTToken,
  hashToken,
  generateToken,
  authenticateJWT,
};
