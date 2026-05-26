const { connectMongo, disconnectMongo, registerModels } = require("../../database/mongo");
const config = require("../../src/config/env");
const { normalizeDirectKey } = require("../../database/mongo/normalize");
const { UserModel } = require("../../src/modules/users/models/user.model");
const { ConversationModel } = require("../../src/modules/conversations/models/conversation.model");
const { ConversationMemberModel } = require("../../src/modules/conversations/models/conversation-member.model");
const { UserConversationInboxModel } = require("../../src/modules/conversations/models/user-conversation-inbox.model");
const { MessageModel } = require("../../src/modules/messages/models/message.model");

async function seed() {
  registerModels();
  await connectMongo(config.mongoUri);

  const [alice, bob] = await UserModel.create([
    {
      phone: "+84900000001",
      username: "alice",
      displayName: "Alice",
      passwordHash: "dev-hash-alice",
      role: "user",
    },
    {
      phone: "+84900000002",
      username: "bob",
      displayName: "Bob",
      passwordHash: "dev-hash-bob",
      role: "user",
    },
  ]);

  const conversation = await ConversationModel.create({
    type: "direct",
    directKey: normalizeDirectKey(alice._id, bob._id),
    createdBy: alice._id,
    memberCount: 2,
    lastMessageSeq: 1,
    lastActivityAt: new Date(),
  });

  await ConversationMemberModel.create([
    { conversationId: conversation._id, userId: alice._id, role: "owner" },
    { conversationId: conversation._id, userId: bob._id, role: "member", unreadCount: 1 },
  ]);

  await MessageModel.create({
    conversationId: conversation._id,
    senderId: alice._id,
    seq: 1,
    type: "text",
    text: "Hello from dev seed",
  });

  await UserConversationInboxModel.create([
    {
      userId: alice._id,
      conversationId: conversation._id,
      displayName: "Bob",
      lastMessage: "Hello from dev seed",
      lastMessageSeq: 1,
      unreadCount: 0,
      lastActivityAt: new Date(),
    },
    {
      userId: bob._id,
      conversationId: conversation._id,
      displayName: "Alice",
      lastMessage: "Hello from dev seed",
      lastMessageSeq: 1,
      unreadCount: 1,
      lastActivityAt: new Date(),
    },
  ]);
}

seed()
  .then(() => {
    console.log("[seed] Dev data created.");
  })
  .catch((error) => {
    console.error("[seed] Failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
