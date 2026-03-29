const { Schema, model, models } = require("mongoose");

const UserDeviceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    deviceId: { type: String, required: true },
    platform: { type: String, enum: ["web", "android", "ios"], required: true },
    pushToken: { type: String },
    isOnline: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

UserDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
UserDeviceSchema.index({ userId: 1, lastActiveAt: -1 });

const UserDeviceModel = models.user_devices || model("user_devices", UserDeviceSchema);

module.exports = {
  UserDeviceModel,
};
