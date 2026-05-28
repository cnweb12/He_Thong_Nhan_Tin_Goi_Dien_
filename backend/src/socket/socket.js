const { Server } = require("socket.io");
const { verifyJWTToken } = require("../modules/auth/middleware/auth.middleware");
const { ConversationMemberModel } = require("../modules/conversations/models/conversation-member.model");
const { UserDeviceModel } = require("../modules/devices/models/user-device.model");
const config = require("../config/env");

let io;

/**
 * Helper: Lấy danh sách userId của những người có chung hội thoại (để gửi trạng thái)
 */
async function getPeerUserIds(userId) {
  try {
    const userMemberships = await ConversationMemberModel.find({ userId, isActive: true }, 'conversationId');
    const conversationIds = userMemberships.map(m => m.conversationId);
    
    const peerMembers = await ConversationMemberModel.find({
      conversationId: { $in: conversationIds },
      userId: { $ne: userId }, // Loại trừ bản thân
      isActive: true
    }, 'userId');
    return [...new Set(peerMembers.map(m => m.userId.toString()))];
  } catch (error) {
    console.error('[socket] Error getting peer user ids:', error);
    return [];
  }
}

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication error: Missing token"));
      }

      // Extract token if it's in "Bearer <token>" format
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      
      const payload = verifyJWTToken(actualToken, config.jwtSecret);
      
      if (!payload) {
        return next(new Error("Authentication error: Invalid or expired token"));
      }

      // Attach user info to socket
      socket.user = {
        userId: payload.userId,
        phone: payload.phone,
        role: payload.role || "user",
      };

      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", async (socket) => {
    const { userId } = socket.user;
    const deviceId = socket.handshake.auth.deviceId;

    console.log(`[socket] User connected: ${userId}, Device: ${deviceId}`);

    // Đưa user vào một room cá nhân mang tên chính userId của họ (để nhận global events)
    socket.join(userId.toString());

    // Join room event
    socket.on("join_room", async (data, callback) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          if (callback) callback({ ok: false, error: "conversationId is required" });
          return;
        }

        // Verify user is a participant in the conversation
        const member = await ConversationMemberModel.findOne({
          conversationId,
          userId,
          isActive: true,
        });

        if (!member) {
          if (callback) callback({ ok: false, error: "Not a participant in this conversation" });
          return;
        }

        // Join the room
        await socket.join(conversationId);
        console.log(`[socket] User ${userId} joined room ${conversationId}`);
        
        if (callback) callback({ ok: true });
      } catch (error) {
        console.error(`[socket] Error joining room:`, error);
        if (callback) callback({ ok: false, error: "Failed to join room" });
      }
    });

    // Leave room event
    socket.on("leave_room", async (data, callback) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          if (callback) callback({ ok: false, error: "conversationId is required" });
          return;
        }

        await socket.leave(conversationId);
        console.log(`[socket] User ${userId} left room ${conversationId}`);
        
        if (callback) callback({ ok: true });
      } catch (error) {
        console.error(`[socket] Error leaving room:`, error);
        if (callback) callback({ ok: false, error: "Failed to leave room" });
      }
    });

    // Typing start event
    socket.on("typing_start", async (data) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return;
        }

        // Broadcast to other users in the room (excluding sender)
        socket.to(conversationId).emit("typing_start", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error(`[socket] Error handling typing_start:`, error);
      }
    });

    // Typing stop event
    socket.on("typing_stop", async (data) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return;
        }

        // Broadcast to other users in the room (excluding sender)
        socket.to(conversationId).emit("typing_stop", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error(`[socket] Error handling typing_stop:`, error);
      }
    });

    // Disconnect handler
    socket.on("disconnect", async () => {
      console.log(`[socket] User disconnected: ${userId}, Device: ${deviceId}`);

      // Update device presence to offline
      try {
        if (deviceId) {
          await UserDeviceModel.findOneAndUpdate(
            { userId, deviceId },
            { $set: { isOnline: false, lastActiveAt: new Date() } }
          );

          // Kịch bản Multi-device: Kiểm tra xem user còn thiết bị nào online không
          const onlineCount = await UserDeviceModel.countDocuments({ userId, isOnline: true });
          if (onlineCount === 0) {
            const peerIds = await getPeerUserIds(userId);
            peerIds.forEach(peerId => {
              io.to(peerId).emit("user_offline", { userId });
            });
          }
        }
      } catch (error) {
        console.error(`[socket] Error updating device presence on disconnect:`, error);
      }
    });

    // LƯU Ý QUAN TRỌNG: Cập nhật DB sau khi đã gắn xong các sự kiện socket.on
    // Tránh Race Condition: Nếu gọi DB trước, client gửi sự kiện ngay lập tức sẽ bị rớt gói tin.
    try {
      if (deviceId) {
        await UserDeviceModel.findOneAndUpdate(
          { userId, deviceId },
          { $set: { isOnline: true, lastActiveAt: new Date() } },
          { upsert: true }
        );

        // Kịch bản Multi-device: Kiểm tra xem đây có phải là thiết bị ĐẦU TIÊN online không
        const onlineCount = await UserDeviceModel.countDocuments({ userId, isOnline: true });
        if (onlineCount === 1) {
          const peerIds = await getPeerUserIds(userId);
          peerIds.forEach(peerId => {
            io.to(peerId).emit("user_online", { userId });
          });
        }
      }
    } catch (error) {
      console.error(`[socket] Error updating device presence:`, error);
    }
  });

  return io;
}

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO server instance
 */
function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
}

/**
 * Reset all devices to offline status
 * Called on server startup to handle crash/restart scenarios
 */
async function resetAllDevicesToOffline() {
  try {
    await UserDeviceModel.updateMany({}, { $set: { isOnline: false } });
    console.log("[socket] Reset all devices to offline status");
  } catch (error) {
    console.error("[socket] Error resetting devices to offline:", error);
  }
}

module.exports = {
  initializeSocket,
  getIO,
  resetAllDevicesToOffline,
};
