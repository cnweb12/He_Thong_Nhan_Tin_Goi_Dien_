const { Schema, model, models } = require("mongoose");

const ConversationMemberSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "conversations", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
    isMuted: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastReadSeq: { type: Number, default: 0, min: 0 },
    unreadCount: { type: Number, default: 0, min: 0 },
    clearedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

ConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
ConversationMemberSchema.index({ userId: 1, updatedAt: -1 });

const ConversationMemberModel = models.conversation_members || model("conversation_members", ConversationMemberSchema);

module.exports = {
  ConversationMemberModel,
};
