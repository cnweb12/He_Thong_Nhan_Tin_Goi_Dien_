db = db.getSiblingDB("messaging_app");

db.createUser({
  user: "app_user",
  pwd: "app_password_123",
  roles: [{ role: "readWrite", db: "messaging_app" }],
});

db.createCollection("users");
db.createCollection("userdevices");
db.createCollection("relationships"); //quản lý quan hệ của người dùng như bạn bè,...
//cho đoạn chat
db.createCollection("conversations");
db.createCollection("messages");
db.createCollection("messages_attachments");
db.createCollection("messages_reactions");
db.createCollection("user_conversations_inbox");
db.createCollection("conversation_members");
//cho cuộc gọi
db.createCollection("calls");
db.createCollection("call_participants");
