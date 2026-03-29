const { Schema, model, models } = require("mongoose");

const UserConversationInboxSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "conversations", required: true },
    displayName: { type: String, required: true },
    displayAvatarUrl: { type: String },
    lastMessage: { type: String },
    lastMessageSeq: { type: Number, default: 0, min: 0 },
    unreadCount: { type: Number, default: 0, min: 0 },
    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

UserConversationInboxSchema.index({ userId: 1, conversationId: 1 }, { unique: true });
UserConversationInboxSchema.index({ userId: 1, lastActivityAt: -1 });

const UserConversationInboxModel = models.user_conversation_inbox || model("user_conversation_inbox", UserConversationInboxSchema);

module.exports = {
  UserConversationInboxModel,
};
