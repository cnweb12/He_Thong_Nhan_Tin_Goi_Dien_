const assert = require("assert");
const { describe, it, mock } = require("node:test");
const { RefreshTokenModel } = require("../../../src/modules/auth/models/refresh-token.model");
const authService = require("../../../src/modules/auth/services/auth.service");

describe("Auth Service (RefreshToken)", () => {
  it("should create a refresh token", async () => {
    const payload = { userId: "1", deviceId: "d1", tokenHash: "hash" };
    
    mock.method(RefreshTokenModel, "create", async (p) => {
      assert.deepStrictEqual(p, payload);
      return { ...payload, _id: "rt1" };
    });

    const result = await authService.createRefreshToken(payload);
    assert.strictEqual(result._id, "rt1");
  });

  it("should find a refresh token", async () => {
    const findOneMock = mock.method(RefreshTokenModel, "findOne", async () => ({ _id: "rt1" }));
    
    await authService.findRefreshToken("1", "d1");
    
    const call = findOneMock.mock.calls[0];
    assert.strictEqual(call.arguments[0].userId, "1");
    assert.strictEqual(call.arguments[0].deviceId, "d1");
    assert.ok(call.arguments[0].expiresAt.$gt);
  });

  it("should verify a refresh token", async () => {
    const findOneMock = mock.method(RefreshTokenModel, "findOne", async () => ({ _id: "rt1" }));
    
    await authService.verifyRefreshToken("1", "d1", "hash");

    const call = findOneMock.mock.calls[0];
    assert.strictEqual(call.arguments[0].userId, "1");
    assert.strictEqual(call.arguments[0].deviceId, "d1");
    assert.strictEqual(call.arguments[0].tokenHash, "hash");
  });

  it("should revoke a refresh token", async () => {
    const updateManyMock = mock.method(RefreshTokenModel, "updateMany", async () => ({ nModified: 1 }));
    
    await authService.revokeRefreshToken("1", "d1");

    const call = updateManyMock.mock.calls[0];
    assert.strictEqual(call.arguments[0].userId, "1");
    assert.strictEqual(call.arguments[0].deviceId, "d1");
    assert.ok(call.arguments[1].$set.revokedAt);
  });

  it("should revoke all user refresh tokens", async () => {
    const updateManyMock = mock.method(RefreshTokenModel, "updateMany", async () => ({ nModified: 2 }));
    
    await authService.revokeAllUserRefreshTokens("1");
    
    const call = updateManyMock.mock.calls[0];
    assert.strictEqual(call.arguments[0].userId, "1");
    assert.ok(call.arguments[1].$set.revokedAt);
  });

  it("should revoke other device tokens", async () => {
    const updateManyMock = mock.method(RefreshTokenModel, "updateMany", async () => ({ nModified: 1 }));

    await authService.revokeOtherDeviceTokens("1", "d1");

    const call = updateManyMock.mock.calls[0];
    assert.strictEqual(call.arguments[0].userId, "1");
    assert.strictEqual(call.arguments[0].deviceId.$ne, "d1");
    assert.ok(call.arguments[1].$set.revokedAt);
  });

  it("should delete expired tokens", async () => {
    const deleteManyMock = mock.method(RefreshTokenModel, "deleteMany", async () => ({ deletedCount: 5 }));
    
    await authService.deleteExpiredTokens();

    const call = deleteManyMock.mock.calls[0];
    assert.ok(call.arguments[0].expiresAt.$lte);
  });
});
