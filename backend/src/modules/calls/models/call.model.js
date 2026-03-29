const { Schema, model, models } = require("mongoose");

const CallParticipantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    joinedAt: { type: Date },
    leftAt: { type: Date },
  },
  { _id: false }
);

const CallSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "conversations", required: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
    type: { type: String, enum: ["audio", "video"], required: true },
    status: { type: String, enum: ["missed", "completed", "cancelled", "rejected"], required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationSec: { type: Number, default: 0 },
    participants: { type: [CallParticipantSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

CallSchema.index({ conversationId: 1, startedAt: -1 });
CallSchema.index({ initiatedBy: 1, createdAt: -1 });

const CallModel = models.calls || model("calls", CallSchema);

module.exports = {
  CallModel,
};
