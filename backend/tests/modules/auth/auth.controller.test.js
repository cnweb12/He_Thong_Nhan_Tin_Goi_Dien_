const assert = require("assert");
const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const authController = require("../../../src/modules/auth/controllers/auth.controller");
const { UserModel } = require("../../../src/modules/users/models/user.model");
const { RefreshTokenModel } = require("../../../src/modules/auth/models/refresh-token.model");
const { UserDeviceModel } = require("../../../src/modules/devices/models/user-device.model");
const authService = require("../../../src/modules/auth/services/auth.service");
const authMiddleware = require("../../../src/modules/auth/middleware/auth.middleware");
const validators = require("../../../src/modules/auth/validators/auth.validator");

describe("Auth Controller", () => {
  // Factory for mock Express res object
  const createMockRes = () => ({
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (payload) {
      this.payload = payload;
      return this;
    },
    statusCode: 200,
    payload: null,
  });

  beforeEach(() => {
    // Apply general mocks before each test
    mock.method(validators, "validateRegisterRequest", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateLoginRequest", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateRefreshTokenRequest", () => ({ isValid: true, errors: [] }));
    mock.method(validators, "validateUpdateProfileRequest", () => ({ isValid: true, errors: [] }));

    mock.method(UserModel, "findOne", async () => null);
    mock.method(UserModel, "create", async (data) => ({ ...data, _id: "new-user-id" }));
    mock.method(UserModel, "findById", async () => null);
    mock.method(UserModel, "findByIdAndUpdate", async () => null);

    mock.method(RefreshTokenModel, "findOne", async () => null);
    mock.method(RefreshTokenModel, "updateOne", async () => ({}));

    mock.method(UserDeviceModel, "updateOne", async () => ({}));

    mock.method(authService, "createRefreshToken", async () => ({}));
    mock.method(authService, "revokeRefreshToken", async () => ({}));
    mock.method(authService, "revokeAllUserRefreshTokens", async () => ({}));

    mock.method(authMiddleware, "hashToken", (token) => `hashed-${token}`);
    mock.method(authMiddleware, "generateJWTToken", () => "test-access-token");
    mock.method(authMiddleware, "generateToken", () => "test-refresh-token");
  });

  afterEach(() => {
    // Reset all mocks after each test
    mock.reset();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const mockRes = createMockRes();
      const req = {
        body: {
          phone: "987654321",
          password: "password",
          displayName: "New User",
        },
      };
      
      mock.method(UserModel, "findOne", async () => null, { times: 1 });
      
      await authController.register(req, mockRes, () => {});

      assert.strictEqual(mockRes.statusCode, 201);
      assert.strictEqual(mockRes.payload.ok, true);
      assert.strictEqual(mockRes.payload.data.userId, "new-user-id");
    });

    it("should return 409 if user already exists", async () => {
      const mockRes = createMockRes();
      const req = {
        body: { phone: "123" },
      };

      mock.method(UserModel, "findOne", async () => ({ _id: "existing-user" }), { times: 1 });
      
      const next = (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.message, "User with this phone already exists");
      };

      await authController.register(req, mockRes, next);
    });

    it("should return 400 on validation failure", async () => {
      const mockRes = createMockRes();
      mock.method(validators, "validateRegisterRequest", () => ({ isValid: false, errors: [{ field: "phone", message: "Phone is required" }] }), { times: 1 });
      
      const req = { body: {} };

      const next = (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, "Validation failed");
      };

      await authController.register(req, mockRes, next);
    });
  });

  describe("login", () => {
    it("should login successfully and return tokens", async () => {
        const mockRes = createMockRes();
        const user = { _id: "user-1", phone: "123", passwordHash: "hashed-password" };
        const req = {
            body: {
                phone: "123",
                password: "password",
                deviceId: "device-1"
            }
        };

        mock.method(UserModel, "findOne", async () => user, { times: 1 });

        await authController.login(req, mockRes, () => {});

        assert.strictEqual(mockRes.statusCode, 200);
        assert.strictEqual(mockRes.payload.ok, true);
        assert.strictEqual(mockRes.payload.data.accessToken, "test-access-token");
        assert.strictEqual(mockRes.payload.data.refreshToken, "test-refresh-token");
        assert.strictEqual(mockRes.payload.data.user.userId, "user-1");
    });

    it("should return 401 for non-existent user", async () => {
        const mockRes = createMockRes();
        const req = { body: { phone: "nonexistent" } };
        mock.method(UserModel, "findOne", async () => null, { times: 1 });
        
        const next = (err) => {
            assert.strictEqual(err.statusCode, 401);
        };
        await authController.login(req, mockRes, next);
    });

    it("should return 401 for incorrect password", async () => {
        const mockRes = createMockRes();
        const user = { _id: "user-1", phone: "123", passwordHash: "hashed-password" };
        const req = { body: { phone: "123", password: "wrong-password" } };

        mock.method(UserModel, "findOne", async () => user, { times: 1 });
        
        const next = (err) => {
            assert.strictEqual(err.statusCode, 401);
        };
        await authController.login(req, mockRes, next);
    });
  });

  // TODO: Add tests for logoutAll, updateProfile, changePassword
  describe("refreshAccessToken", () => {
    it("should return a new access token for a valid refresh token", async () => {
      const mockRes = createMockRes();
      const storedToken = { userId: "user-1", deviceId: "device-1", tokenHash: "hashed-test-refresh-token" };
      const user = { _id: "user-1", phone: "123" };
      const req = {
        body: {
          refreshToken: "test-refresh-token",
          deviceId: "device-1"
        }
      };

      mock.method(RefreshTokenModel, "findOne", async () => storedToken, { times: 1 });
      mock.method(UserModel, "findById", async () => user, { times: 1 });

      await authController.refreshAccessToken(req, mockRes, () => {});

      assert.strictEqual(mockRes.statusCode, 200);
      assert.strictEqual(mockRes.payload.ok, true);
      assert.strictEqual(mockRes.payload.data.accessToken, "test-access-token");
    });

    it("should return 401 for an invalid refresh token", async () => {
      const mockRes = createMockRes();
      const req = { body: { refreshToken: "invalid" } };
      
      mock.method(RefreshTokenModel, "findOne", async () => null, { times: 1 });

      const next = (err) => {
        assert.strictEqual(err.statusCode, 401);
      };
      await authController.refreshAccessToken(req, mockRes, next);
    });
  });

  describe("logout", () => {
    it("should logout the current device successfully", async () => {
      const mockRes = createMockRes();
      const req = {
        user: { userId: "user-1" },
        body: { deviceId: "device-1" }
      };

      const revokeMock = mock.method(authService, "revokeRefreshToken", async () => ({}), { times: 1 });
      
      await authController.logout(req, mockRes, () => {});

      assert.strictEqual(revokeMock.mock.calls[0].arguments[0], "user-1");
      assert.strictEqual(revokeMock.mock.calls[0].arguments[1], "device-1");
      assert.strictEqual(mockRes.statusCode, 200);
      assert.strictEqual(mockRes.payload.ok, true);
    });
  });

  describe("getProfile", () => {
    it("should return the user profile for a valid user", async () => {
      const mockRes = createMockRes();
      const user = { _id: "user-1", phone: "123", displayName: "Test" };
      const req = { user: { userId: "user-1" } };

      const mockQuery = {
        select: () => Promise.resolve(user),
      };
      mock.method(UserModel, "findById", () => mockQuery, { times: 1 });

      await authController.getProfile(req, mockRes, () => {});
      
      assert.strictEqual(mockRes.statusCode, 200);
      assert.strictEqual(mockRes.payload.ok, true);
      assert.deepStrictEqual(mockRes.payload.data, user);
    });

    it("should return 404 if user not found", async () => {
      const mockRes = createMockRes();
      const req = { user: { userId: "non-existent" } };

      const mockQuery = {
        select: () => Promise.resolve(null),
      };
      mock.method(UserModel, "findById", () => mockQuery, { times: 1 });

      const next = (err) => {
        assert.strictEqual(err.statusCode, 404);
      };
      await authController.getProfile(req, mockRes, next);
    });
  });

  describe("updateProfile", () => {
    it("should update the profile successfully", async () => {
      const mockRes = createMockRes();
      const updatedUser = { _id: "user-1", displayName: "New Name" };
      const req = {
        user: { userId: "user-1" },
        body: { displayName: "New Name" }
      };

      const mockQuery = { select: () => Promise.resolve(updatedUser) };
      mock.method(UserModel, "findByIdAndUpdate", () => mockQuery, { times: 1 });

      await authController.updateProfile(req, mockRes, () => {});

      assert.strictEqual(mockRes.statusCode, 200);
      assert.strictEqual(mockRes.payload.data.displayName, "New Name");
    });
  });

  describe("logoutAll", () => {
    it("should logout from all devices successfully", async () => {
      const mockRes = createMockRes();
      const req = { user: { userId: "user-1" } };
      
      const revokeAllMock = mock.method(authService, "revokeAllUserRefreshTokens", async () => ({}), { times: 1 });

      await authController.logoutAll(req, mockRes, () => {});

      assert.strictEqual(revokeAllMock.mock.calls[0].arguments[0], "user-1");
      assert.strictEqual(mockRes.statusCode, 200);
      assert.strictEqual(mockRes.payload.message, "Logged out from all devices");
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      const mockRes = createMockRes();
      const user = { _id: "user-1", passwordHash: "hashed-current" };
      const req = {
        user: { userId: "user-1" },
        body: {
          currentPassword: "current",
          newPassword: "new-password",
          confirmPassword: "new-password"
        }
      };

      mock.method(UserModel, "findById", async () => user, { times: 1 });
      const updateMock = mock.method(UserModel, "findByIdAndUpdate", async () => ({}), { times: 1 });
      const revokeAllMock = mock.method(authService, "revokeAllUserRefreshTokens", async () => ({}), { times: 1 });

      await authController.changePassword(req, mockRes, () => {});

      assert.strictEqual(mockRes.statusCode, 200);
      assert.strictEqual(mockRes.payload.message, "Password changed successfully. Please login again.");
      assert.strictEqual(updateMock.mock.calls[0].arguments[1].passwordHash, "hashed-new-password");
      assert.strictEqual(revokeAllMock.mock.calls[0].arguments[0], "user-1");
    });

    it("should return 401 for incorrect current password", async () => {
      const mockRes = createMockRes();
      const user = { _id: "user-1", passwordHash: "hashed-current" };
      const req = {
        user: { userId: "user-1" },
        body: {
          currentPassword: "wrong",
          newPassword: "new-password",
          confirmPassword: "new-password",
        },
      };

      mock.method(UserModel, "findById", async () => user, { times: 1 });

      const next = (err) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.message, "Current password is incorrect");
      };

      await authController.changePassword(req, mockRes, next);
    });

    it("should return 400 if new passwords do not match", async () => {
      const mockRes = createMockRes();
      const req = {
        user: { userId: "user-1" },
        body: {
          currentPassword: "current",
          newPassword: "new-password",
          confirmPassword: "mismatch"
        }
      };

      const next = (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, "Passwords do not match");
      };

      await authController.changePassword(req, mockRes, next);
    });
  });
});
