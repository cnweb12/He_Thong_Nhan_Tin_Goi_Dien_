const { Schema, model, models } = require("mongoose");

const AttachmentSchema = new Schema(
  {
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const ReactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "conversations", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    seq: { type: Number, required: true, min: 1 },
    clientMessageId: { type: String },
    type: { type: String, enum: ["text", "image", "file", "system"], default: "text" },
    text: { type: String },
    replyToMessageId: { type: Schema.Types.ObjectId, ref: "messages" },
    attachments: { type: [AttachmentSchema], default: [] },
    reactions: { type: [ReactionSchema], default: [] },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

MessageSchema.index({ conversationId: 1, seq: -1 }, { unique: true });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index(
  { conversationId: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string" } },
  }
);

const MessageModel = models.messages || model("messages", MessageSchema);

module.exports = {
  MessageModel,
};
