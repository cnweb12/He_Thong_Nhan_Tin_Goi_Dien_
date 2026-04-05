const { RefreshTokenModel } = require("../models/refresh-token.model");

async function createRefreshToken(payload) {
  return RefreshTokenModel.create(payload);
}

async function findRefreshToken(userId, deviceId) {
  return RefreshTokenModel.findOne({
    userId,
    deviceId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

async function findUserRefreshTokens(userId) {
  return RefreshTokenModel.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
}

async function verifyRefreshToken(userId, deviceId, tokenHash) {
  return RefreshTokenModel.findOne({
    userId,
    deviceId,
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

async function revokeRefreshToken(userId, deviceId) {
  return RefreshTokenModel.updateMany(
    {
      userId,
      deviceId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    }
  );
}

async function revokeAllUserRefreshTokens(userId) {
  return RefreshTokenModel.updateMany(
    {
      userId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    }
  );
}

async function revokeOtherDeviceTokens(userId, currentDeviceId) {
  return RefreshTokenModel.updateMany(
    {
      userId,
      deviceId: { $ne: currentDeviceId },
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    }
  );
}

async function deleteExpiredTokens() {
  return RefreshTokenModel.deleteMany({
    expiresAt: { $lte: new Date() },
  });
}

module.exports = {
  createRefreshToken,
  findRefreshToken,
  findUserRefreshTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  revokeOtherDeviceTokens,
  deleteExpiredTokens,
};
