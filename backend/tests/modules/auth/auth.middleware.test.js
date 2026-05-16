const assert = require("assert");
const { describe, it } = require("node:test");
const authMiddleware = require("../../../src/modules/auth/middleware/auth.middleware");

describe("Auth Middleware", () => {
  const TEST_SECRET = "test-secret";

  describe("extractTokenFromHeader", () => {
    it("should extract token from Bearer header", () => {
      const token = authMiddleware.extractTokenFromHeader("Bearer my-token");
      assert.strictEqual(token, "my-token");
    });

    it("should return null if header is missing", () => {
      assert.strictEqual(authMiddleware.extractTokenFromHeader(undefined), null);
    });

    it("should return null if header is not Bearer", () => {
      assert.strictEqual(authMiddleware.extractTokenFromHeader("Basic my-token"), null);
    });

    it("should return null if header is malformed", () => {
      assert.strictEqual(authMiddleware.extractTokenFromHeader("Bearer"), null);
    });
  });

  describe("JWT Functions", () => {
    it("should generate and verify a valid JWT token", () => {
      const payload = { userId: "123" };
      const token = authMiddleware.generateJWTToken(payload, TEST_SECRET, 60);
      const decoded = authMiddleware.verifyJWTToken(token, TEST_SECRET);
      
      assert.ok(decoded);
      assert.strictEqual(decoded.userId, "123");
    });

    it("should fail to verify token with wrong secret", () => {
      const payload = { userId: "123" };
      const token = authMiddleware.generateJWTToken(payload, TEST_SECRET);
      const decoded = authMiddleware.verifyJWTToken(token, "wrong-secret");
      
      assert.strictEqual(decoded, null);
    });

    it("should fail to verify an expired token", (t, done) => {
        const payload = { userId: "123" };
        // Token expires in 1 millisecond
        const token = authMiddleware.generateJWTToken(payload, TEST_SECRET, 0.001);
        
        setTimeout(() => {
            const decoded = authMiddleware.verifyJWTToken(token, TEST_SECRET);
            assert.strictEqual(decoded, null);
            done();
        }, 10);
    });

    it("should return null for malformed token", () => {
        const decoded = authMiddleware.verifyJWTToken("a.b.c", TEST_SECRET);
        assert.strictEqual(decoded, null);
    });
  });

  describe("hashToken", () => {
    it("should create a SHA256 hash", () => {
      const hash = authMiddleware.hashToken("my-secret-token");
      // SHA256 produces a 64-character hex string
      assert.strictEqual(hash.length, 64);
      // It should be consistent
      const hash2 = authMiddleware.hashToken("my-secret-token");
      assert.strictEqual(hash, hash2);
    });
  });

  describe("generateToken", () => {
    it("should generate a random hex token", () => {
      const token = authMiddleware.generateToken(16);
      // 16 bytes should produce a 32-character hex string
      assert.strictEqual(token.length, 32);
      assert.ok(/^[a-f0-9]+$/.test(token));
    });
  });

  describe("authenticateJWT", () => {
    const middleware = authMiddleware.authenticateJWT(TEST_SECRET);

    it("should call next and attach user if token is valid", () => {
      const payload = { userId: "user-123" };
      const token = authMiddleware.generateJWTToken(payload, TEST_SECRET);
      const req = {
        headers: { authorization: `Bearer ${token}` }
      };
      
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      middleware(req, {}, next);

      assert.strictEqual(nextCalled, true);
      assert.ok(req.user);
      assert.strictEqual(req.user.userId, "user-123");
    });

    it("should call next with 401 error if header is missing", () => {
      const req = { headers: {} };
      
      const next = (err) => {
        assert.ok(err);
        assert.strictEqual(err.statusCode, 401);
      };

      middleware(req, {}, next);
    });

    it("should call next with 401 error if token is invalid", () => {
      const req = {
        headers: { authorization: "Bearer invalid-token" }
      };
      
      const next = (err) => {
        assert.ok(err);
        assert.strictEqual(err.statusCode, 401);
      };

      middleware(req, {}, next);
    });
  });
});
