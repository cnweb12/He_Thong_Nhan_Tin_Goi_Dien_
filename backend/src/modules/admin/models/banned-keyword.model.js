const { Schema, model, models } = require("mongoose");

const BannedKeywordSchema = new Schema(
  {
    keyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

BannedKeywordSchema.index({ keyword: 1 }, { unique: true });
BannedKeywordSchema.index({ isActive: 1 });
BannedKeywordSchema.index({ addedBy: 1 });

const BannedKeywordModel =
  models.banned_keywords || model("banned_keywords", BannedKeywordSchema);

module.exports = {
  BannedKeywordModel,
};
