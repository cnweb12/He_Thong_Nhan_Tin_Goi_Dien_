const { Schema, model, models } = require("mongoose");
const { normalizeDirectKey } = require("../../../../database/mongo/normalize");

const LastMessageSchema = new Schema(
  {
    seq: { type: Number, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    type: { type: String, enum: ["text", "image", "file", "system"], required: true },
    text: { type: String },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const ConversationSchema = new Schema(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    directKey: {
      type: String,
      set: (value) => {
        if (!value) {
          return value;
        }

        const [left, right] = String(value).split(":");
        return right ? normalizeDirectKey(left, right) : value;
      },
    },
    title: { type: String },
    avatarUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
    memberCount: { type: Number, default: 2, min: 1 },
    lastMessage: { type: LastMessageSchema },
    lastMessageSeq: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

ConversationSchema.index({ createdBy: 1, createdAt: -1 });
ConversationSchema.index(
  { directKey: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "direct", directKey: { $exists: true } },
  }
);

const ConversationModel = models.conversations || model("conversations", ConversationSchema);

module.exports = {
  ConversationModel,
};
