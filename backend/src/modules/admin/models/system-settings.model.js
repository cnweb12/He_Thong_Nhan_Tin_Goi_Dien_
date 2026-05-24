const { Schema, model, models } = require("mongoose");

const SystemSettingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "object", "array"],
      default: "string",
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, versionKey: false }
);

SystemSettingsSchema.index({ key: 1 }, { unique: true });

const SystemSettingsModel =
  models.system_settings || model("system_settings", SystemSettingsSchema);

module.exports = {
  SystemSettingsModel,
};
