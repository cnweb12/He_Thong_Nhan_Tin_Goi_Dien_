const assert = require("assert");
const { describe, it } = require("node:test");
const {
  validateRegisterRequest,
  validateLoginRequest,
  validateRefreshTokenRequest,
  validateUpdateProfileRequest,
} = require("../../../src/modules/auth/validators/auth.validator");

describe("Auth Validators", () => {
  describe("validateRegisterRequest", () => {
    it("should return valid for correct data", () => {
      const req = {
        body: {
          phone: "123456789",
          password: "password123",
          passwordConfirm: "password123",
          displayName: "Test User",
        },
      };
      const result = validateRegisterRequest(req);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("should return invalid if phone is missing", () => {
      const req = {
        body: {
          password: "password123",
          passwordConfirm: "password123",
          displayName: "Test User",
        },
      };
      const result = validateRegisterRequest(req);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors[0].field, "phone");
    });

    it("should return invalid if displayName is too short", () => {
      const req = {
        body: {
          phone: "123456789",
          password: "password123",
          passwordConfirm: "password123",
          displayName: "T",
        },
      };
      const result = validateRegisterRequest(req);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors[0].field, "displayName");
    });

    it("should return invalid if password is too short", () => {
      const req = {
        body: {
          phone: "123456789",
          password: "123",
          passwordConfirm: "123",
          displayName: "Test User",
        },
      };
      const result = validateRegisterRequest(req);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors[0].field, "password");
    });

    it("should return invalid if passwords do not match", () => {
      const req = {
        body: {
          phone: "123456789",
          password: "password123",
          passwordConfirm: "password456",
          displayName: "Test User",
        },
      };
      const result = validateRegisterRequest(req);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors[0].field, "passwordConfirm");
    });
  });

  describe("validateLoginRequest", () => {
    it("should return valid for correct data", () => {
      const req = {
        body: {
          phone: "123456789",
          password: "password123",
          deviceId: "device-123",
        },
      };
      const result = validateLoginRequest(req);
      assert.strictEqual(result.isValid, true);
    });

    it("should return invalid if deviceId is missing", () => {
      const req = {
        body: {
          phone: "123456789",
          password: "password123",
        },
      };
      const result = validateLoginRequest(req);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors[0].field, "deviceId");
    });
  });

  describe("validateRefreshTokenRequest", () => {
    it("should return valid for correct data", () => {
      const req = {
        body: {
          refreshToken: "some-refresh-token",
          deviceId: "device-123",
        },
      };
      const result = validateRefreshTokenRequest(req);
      assert.strictEqual(result.isValid, true);
    });

    it("should return invalid if refreshToken is missing", () => {
      const req = {
        body: {
          deviceId: "device-123",
        },
      };
      const result = validateRefreshTokenRequest(req);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors[0].field, "refreshToken");
    });
  });

  describe("validateUpdateProfileRequest", () => {
    it("should return valid for correct data", () => {
      const req = {
        body: {
          displayName: "New Name",
          avatarUrl: "http://example.com/avatar.png",
        },
      };
      const result = validateUpdateProfileRequest(req);
      assert.strictEqual(result.isValid, true);
    });

    it("should return valid if only displayName is provided", () => {
        const req = {
            body: {
                displayName: "New Name",
            },
        };
        const result = validateUpdateProfileRequest(req);
        assert.strictEqual(result.isValid, true);
    });

    it("should return invalid if displayName is too short", () => {
      const req = {
        body: {
          displayName: "a",
        },
      };
      const result = validateUpdateProfileRequest(req);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors[0].field, "displayName");
    });

    it("should return invalid if avatarUrl is not a string", () => {
        const req = {
            body: {
                avatarUrl: 123,
            },
        };
        const result = validateUpdateProfileRequest(req);
        assert.strictEqual(result.isValid, false);
        assert.strictEqual(result.errors[0].field, "avatarUrl");
    });
  });
});
