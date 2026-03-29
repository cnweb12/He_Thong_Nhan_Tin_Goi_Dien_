/**
 * Shared Mongo type helpers for the current CommonJS backend.
 * These JSDoc typedefs keep the API readable until the backend is migrated to TypeScript.
 */

const mongoose = require("mongoose");

/** @typedef {string|import("mongoose").Types.ObjectId} ObjectIdLike */
/** @typedef {{ createdAt: Date, updatedAt: Date }} TimestampFields */
/** @typedef {{ deletedAt?: Date|null, isDeleted?: boolean }} SoftDeleteFields */

function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return new mongoose.Types.ObjectId(String(value));
}

module.exports = {
  toObjectId,
};
