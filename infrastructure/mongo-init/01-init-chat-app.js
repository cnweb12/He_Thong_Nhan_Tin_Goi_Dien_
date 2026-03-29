const appDbName = process.env.MONGO_APP_DB || "chat_app";
const appUser = process.env.MONGO_APP_USER || "chat_app_user";
const appPassword = process.env.MONGO_APP_PASSWORD || "chat_app_password";

const appDb = db.getSiblingDB(appDbName);

function createAppUser() {
  const existingUser = appDb.getUser(appUser);
  if (!existingUser) {
    appDb.createUser({
      user: appUser,
      pwd: appPassword,
      roles: [
        { role: "readWrite", db: appDbName },
        { role: "dbAdmin", db: appDbName }
      ]
    });
    print(`Created application user '${appUser}' on database '${appDbName}'.`);
  } else {
    print(`Application user '${appUser}' already exists.`);
  }
}

function createCollectionIfMissing(name, options) {
  const exists = appDb.getCollectionNames().includes(name);
  if (!exists) {
    appDb.createCollection(name, options);
    print(`Created collection '${name}'.`);
  } else {
    print(`Collection '${name}' already exists.`);
  }
}

function createIndexSafely(collectionName, indexSpec, options) {
  appDb.getCollection(collectionName).createIndex(indexSpec, options || {});
}

function createJsonSchemaCollections() {
  createCollectionIfMissing("users", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["phone", "displayName", "passwordHash", "settings", "createdAt", "updatedAt"],
        properties: {
          _id: { bsonType: "objectId" },
          phone: { bsonType: "string", minLength: 8, maxLength: 20 },
          username: { bsonType: ["string", "null"], minLength: 3, maxLength: 32 },
          displayName: { bsonType: "string", minLength: 1, maxLength: 80 },
          passwordHash: { bsonType: "string" },
          avatarUrl: { bsonType: ["string", "null"] },
          statusMessage: { bsonType: ["string", "null"] },
          settings: {
            bsonType: "object",
            required: ["allowStrangerMessage", "readReceiptEnabled", "theme"],
            properties: {
              allowStrangerMessage: { bsonType: "bool" },
              readReceiptEnabled: { bsonType: "bool" },
              theme: { enum: ["light", "dark", "system"] }
            }
          },
          lastSeenAt: { bsonType: ["date", "null"] },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });

  createCollectionIfMissing("user_devices", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "deviceId", "platform", "lastActiveAt", "createdAt", "updatedAt"],
        properties: {
          _id: { bsonType: "objectId" },
          userId: { bsonType: "objectId" },
          deviceId: { bsonType: "string" },
          platform: { enum: ["web", "android", "ios"] },
          pushToken: { bsonType: ["string", "null"] },
          isOnline: { bsonType: "bool" },
          lastActiveAt: { bsonType: "date" },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });

  createCollectionIfMissing("conversations", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["type", "createdBy", "memberCount", "lastMessageSeq", "lastActivityAt", "createdAt", "updatedAt"],
        properties: {
          _id: { bsonType: "objectId" },
          type: { enum: ["direct", "group"] },
          directKey: { bsonType: ["string", "null"] },
          title: { bsonType: ["string", "null"], maxLength: 120 },
          avatarUrl: { bsonType: ["string", "null"] },
          createdBy: { bsonType: "objectId" },
          memberCount: { bsonType: ["int", "long"], minimum: 1 },
          lastMessageSeq: { bsonType: ["int", "long"], minimum: 0 },
          lastMessage: {
            bsonType: ["object", "null"],
            properties: {
              messageId: { bsonType: ["objectId", "null"] },
              senderId: { bsonType: ["objectId", "null"] },
              type: { bsonType: ["string", "null"] },
              textPreview: { bsonType: ["string", "null"] },
              createdAt: { bsonType: ["date", "null"] }
            }
          },
          lastActivityAt: { bsonType: "date" },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });

  createCollectionIfMissing("conversation_members", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["conversationId", "userId", "role", "joinedAt", "isMuted", "isPinned", "isActive", "lastReadSeq", "unreadCount", "updatedAt"],
        properties: {
          _id: { bsonType: "objectId" },
          conversationId: { bsonType: "objectId" },
          userId: { bsonType: "objectId" },
          role: { enum: ["owner", "admin", "member"] },
          joinedAt: { bsonType: "date" },
          leftAt: { bsonType: ["date", "null"] },
          isMuted: { bsonType: "bool" },
          isPinned: { bsonType: "bool" },
          isActive: { bsonType: "bool" },
          lastReadSeq: { bsonType: ["int", "long"], minimum: 0 },
          unreadCount: { bsonType: ["int", "long"], minimum: 0 },
          updatedAt: { bsonType: "date" }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });

  createCollectionIfMissing("messages", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["conversationId", "senderId", "seq", "type", "createdAt"],
        properties: {
          _id: { bsonType: "objectId" },
          conversationId: { bsonType: "objectId" },
          senderId: { bsonType: "objectId" },
          seq: { bsonType: ["int", "long"], minimum: 1 },
          clientMessageId: { bsonType: ["string", "null"] },
          type: { enum: ["text", "image", "file", "voice", "system"] },
          text: { bsonType: ["string", "null"], maxLength: 5000 },
          replyToMessageId: { bsonType: ["objectId", "null"] },
          attachments: {
            bsonType: ["array", "null"],
            items: {
              bsonType: "object",
              required: ["type", "url", "fileName"],
              properties: {
                type: { enum: ["image", "file", "audio"] },
                fileName: { bsonType: "string" },
                mimeType: { bsonType: ["string", "null"] },
                size: { bsonType: ["int", "long", "null"], minimum: 0 },
                url: { bsonType: "string" },
                thumbnailUrl: { bsonType: ["string", "null"] }
              }
            }
          },
          reactions: {
            bsonType: ["array", "null"],
            items: {
              bsonType: "object",
              required: ["userId", "emoji", "createdAt"],
              properties: {
                userId: { bsonType: "objectId" },
                emoji: { bsonType: "string", minLength: 1, maxLength: 16 },
                createdAt: { bsonType: "date" }
              }
            }
          },
          editedAt: { bsonType: ["date", "null"] },
          deletedAt: { bsonType: ["date", "null"] },
          createdAt: { bsonType: "date" }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });

  createCollectionIfMissing("user_conversation_inbox", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "conversationId", "displayName", "unreadCount", "isPinned", "isMuted", "lastActivityAt", "updatedAt"],
        properties: {
          _id: { bsonType: "objectId" },
          userId: { bsonType: "objectId" },
          conversationId: { bsonType: "objectId" },
          displayName: { bsonType: "string", maxLength: 120 },
          displayAvatarUrl: { bsonType: ["string", "null"] },
          lastMessageSeq: { bsonType: ["int", "long", "null"], minimum: 0 },
          lastMessage: {
            bsonType: ["object", "null"],
            properties: {
              messageId: { bsonType: ["objectId", "null"] },
              senderId: { bsonType: ["objectId", "null"] },
              type: { bsonType: ["string", "null"] },
              textPreview: { bsonType: ["string", "null"] },
              createdAt: { bsonType: ["date", "null"] }
            }
          },
          unreadCount: { bsonType: ["int", "long"], minimum: 0 },
          isPinned: { bsonType: "bool" },
          isMuted: { bsonType: "bool" },
          lastActivityAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });

  createCollectionIfMissing("calls", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["conversationId", "initiatedBy", "type", "status", "startedAt", "participants", "createdAt", "updatedAt"],
        properties: {
          _id: { bsonType: "objectId" },
          conversationId: { bsonType: "objectId" },
          initiatedBy: { bsonType: "objectId" },
          type: { enum: ["audio", "video"] },
          status: { enum: ["ringing", "ongoing", "ended", "missed", "rejected", "cancelled"] },
          startedAt: { bsonType: "date" },
          endedAt: { bsonType: ["date", "null"] },
          durationSec: { bsonType: ["int", "long", "null"], minimum: 0 },
          participants: {
            bsonType: "array",
            minItems: 1,
            items: {
              bsonType: "object",
              required: ["userId", "joinedAt", "state"],
              properties: {
                userId: { bsonType: "objectId" },
                joinedAt: { bsonType: "date" },
                leftAt: { bsonType: ["date", "null"] },
                state: { enum: ["invited", "joined", "left", "missed", "rejected"] }
              }
            }
          },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });
}

function createIndexes() {
  createIndexSafely("users", { phone: 1 }, { unique: true, name: "uq_users_phone" });
  createIndexSafely(
    "users",
    { username: 1 },
    {
      unique: true,
      sparse: true,
      name: "uq_users_username"
    }
  );

  createIndexSafely("user_devices", { userId: 1, deviceId: 1 }, { unique: true, name: "uq_user_devices_user_device" });
  createIndexSafely("user_devices", { pushToken: 1 }, { sparse: true, name: "idx_user_devices_push_token" });

  createIndexSafely(
    "conversations",
    { directKey: 1 },
    {
      unique: true,
      partialFilterExpression: { type: "direct", directKey: { $type: "string" } },
      name: "uq_conversations_direct_key"
    }
  );
  createIndexSafely("conversations", { lastActivityAt: -1 }, { name: "idx_conversations_last_activity" });

  createIndexSafely(
    "conversation_members",
    { conversationId: 1, userId: 1 },
    { unique: true, name: "uq_conversation_members_conversation_user" }
  );
  createIndexSafely("conversation_members", { userId: 1, isPinned: -1, updatedAt: -1 }, { name: "idx_conversation_members_user_sidebar" });

  createIndexSafely("messages", { conversationId: 1, seq: -1 }, { unique: true, name: "uq_messages_conversation_seq" });
  createIndexSafely("messages", { conversationId: 1, createdAt: -1 }, { name: "idx_messages_conversation_created_desc" });
  createIndexSafely(
    "messages",
    { conversationId: 1, senderId: 1, clientMessageId: 1 },
    {
      unique: true,
      partialFilterExpression: { clientMessageId: { $type: "string" } },
      name: "uq_messages_client_dedupe"
    }
  );

  createIndexSafely(
    "user_conversation_inbox",
    { userId: 1, conversationId: 1 },
    { unique: true, name: "uq_inbox_user_conversation" }
  );
  createIndexSafely("user_conversation_inbox", { userId: 1, isPinned: -1, lastActivityAt: -1 }, { name: "idx_inbox_user_sort" });

  createIndexSafely("calls", { conversationId: 1, startedAt: -1 }, { name: "idx_calls_conversation_started_desc" });
  createIndexSafely("calls", { initiatedBy: 1, startedAt: -1 }, { name: "idx_calls_initiator_started_desc" });
}

createAppUser();
createJsonSchemaCollections();
createIndexes();

print(`MongoDB bootstrap finished for database '${appDbName}'.`);
