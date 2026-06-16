const { Schema, model, models } = require("mongoose");
const {
  normalizePhone,
  normalizeUsername,
} = require("../../../../database/mongo/normalize");

// Model mô tả cấu trúc của một record của user lưu trong database
const UserSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      set: normalizePhone,
    },
    username: {
      type: String,
      trim: true,
      set: normalizeUsername,
    },
    displayName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    settings: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      language: { type: String, default: "vi" },
      allowStrangerMessage: { type: Boolean, default: true },
      readReceiptEnabled: { type: Boolean, default: true },
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
      required: true,
    },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    lastSeenAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index(
  { username: 1 },
  {
    unique: true,
    partialFilterExpression: { username: { $type: "string" } },
  },
);

const UserModel = models.users || model("users", UserSchema);

module.exports = {
  UserModel,
};
