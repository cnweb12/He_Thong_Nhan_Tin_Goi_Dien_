const { Schema, model, models } = require("mongoose");

const FriendSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    friendId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    status: { type: String, enum: ["pending", "accepted"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

FriendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

const FriendModel = models.user_friends || model("user_friends", FriendSchema);

module.exports = {
  FriendModel,
};
