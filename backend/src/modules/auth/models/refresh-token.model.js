const { Schema, model, models } = require("mongoose");

const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    deviceId: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

RefreshTokenSchema.index({ userId: 1, deviceId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = models.refresh_tokens || model("refresh_tokens", RefreshTokenSchema);

module.exports = {
  RefreshTokenModel,
};
