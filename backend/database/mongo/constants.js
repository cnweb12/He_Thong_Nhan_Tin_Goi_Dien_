module.exports = {
  MONGO_READY_STATES: Object.freeze({
    disconnected: 0,
    connected: 1,
    connecting: 2,
    disconnecting: 3,
  }),
  MESSAGE_TYPES: Object.freeze(["text", "image", "file", "system"]),
  DEVICE_PLATFORMS: Object.freeze(["web", "android", "ios"]),
  CONVERSATION_TYPES: Object.freeze(["direct", "group"]),
  CONVERSATION_MEMBER_ROLES: Object.freeze(["owner", "admin", "member"]),
  CALL_TYPES: Object.freeze(["audio", "video"]),
  CALL_STATUSES: Object.freeze(["missed", "completed", "cancelled", "rejected"]),
};
