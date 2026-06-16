const { Server } = require("socket.io");
const { verifyJWTToken } = require("../modules/auth/middleware/auth.middleware");
const { ConversationMemberModel } = require("../modules/conversations/models/conversation-member.model");
const { UserDeviceModel } = require("../modules/devices/models/user-device.model");
const { UserModel } = require("../modules/users/models/user.model");
const { CallModel } = require("../modules/calls/models/call.model");
const { callService } = require("../modules/calls/services/call.service");
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

function getCallParticipantIds(call) {
  const ids = new Set();
  if (call?.initiatedBy) {
    ids.add(call.initiatedBy.toString());
  }

  if (Array.isArray(call?.participants)) {
    call.participants.forEach((participant) => {
      if (participant?.userId) {
        ids.add(participant.userId.toString());
      }
    });
  }

  return ids;
}

async function relayCallSignal({ socket, callId, targetUserId, eventName, payload, callback }) {
  if (!callId || !targetUserId) {
    if (callback) callback({ ok: false, error: "Missing required fields" });
    return;
  }

  const call = await CallModel.findById(callId);
  if (!call) {
    if (callback) callback({ ok: false, error: "Call not found" });
    return;
  }

  const participantIds = getCallParticipantIds(call);
  const senderId = socket.user.userId.toString();
  const receiverId = targetUserId.toString();

  if (!participantIds.has(senderId) || !participantIds.has(receiverId) || senderId === receiverId) {
    if (callback) callback({ ok: false, error: "Invalid call participant" });
    return;
  }

  io.to(receiverId).emit(eventName, {
    callId,
    fromUserId: senderId,
    ...payload,
  });

  if (callback) callback({ ok: true });
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
    const devicePlatform = socket.handshake.auth.platform || 'web';

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

    // --- Call Signaling Events ---

    // Call Initiate Event
    socket.on("call:initiate", async (data, callback) => {
      try {
        const { calleeId, conversationId, type } = data;

        if (!calleeId || !conversationId || !type) {
          if (callback) callback({ ok: false, error: "Missing required fields" });
          return;
        }

        const caller = await UserModel.findById(userId);
        if (!caller) {
          if (callback) callback({ ok: false, error: "Caller not found" });
          return;
        }

        // Create the call log in status "missed" by default
        const call = await callService.createCallLog({
          conversationId,
          type,
          status: "missed",
          initiatedBy: userId,
          startedAt: new Date(),
          participants: [
            { userId: userId, joinedAt: new Date() },
            { userId: calleeId }
          ]
        });

        // Emit call:incoming to the callee's room
        io.to(calleeId.toString()).emit("call:incoming", {
          callId: call._id,
          callerId: userId,
          callerName: caller.displayName,
          callerAvatar: caller.avatarUrl,
          conversationId,
          type,
        });

        if (callback) callback({ ok: true, callId: call._id });
      } catch (error) {
        console.error("[socket] Error in call:initiate:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to initiate call" });
      }
    });

    // Call Accept Event
    socket.on("call:accept", async (data, callback) => {
      try {
        const { callId } = data;
        if (!callId) {
          if (callback) callback({ ok: false, error: "Missing callId" });
          return;
        }

        const call = await CallModel.findById(callId);
        if (!call) {
          if (callback) callback({ ok: false, error: "Call not found" });
          return;
        }

        // Update callee's participant state
        await callService.upsertParticipantState({
          callId,
          userId,
          participantUserId: userId,
          joinedAt: new Date(),
        });

        // Notify caller that call was accepted. The caller will create the WebRTC offer.
        io.to(call.initiatedBy.toString()).emit("call:accepted", {
          callId,
          acceptedBy: userId,
        });

        if (callback) callback({ ok: true });
      } catch (error) {
        console.error("[socket] Error in call:accept:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to accept call" });
      }
    });

    socket.on("call:webrtc-offer", async (data, callback) => {
      try {
        const { callId, targetUserId, offer } = data;
        if (!offer) {
          if (callback) callback({ ok: false, error: "Missing offer" });
          return;
        }

        await relayCallSignal({
          socket,
          callId,
          targetUserId,
          eventName: "call:webrtc-offer",
          payload: { offer },
          callback,
        });
      } catch (error) {
        console.error("[socket] Error in call:webrtc-offer:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to relay offer" });
      }
    });

    socket.on("call:webrtc-answer", async (data, callback) => {
      try {
        const { callId, targetUserId, answer } = data;
        if (!answer) {
          if (callback) callback({ ok: false, error: "Missing answer" });
          return;
        }

        await relayCallSignal({
          socket,
          callId,
          targetUserId,
          eventName: "call:webrtc-answer",
          payload: { answer },
          callback,
        });
      } catch (error) {
        console.error("[socket] Error in call:webrtc-answer:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to relay answer" });
      }
    });

    socket.on("call:webrtc-ice", async (data, callback) => {
      try {
        const { callId, targetUserId, candidate } = data;
        if (!candidate) {
          if (callback) callback({ ok: false, error: "Missing candidate" });
          return;
        }

        await relayCallSignal({
          socket,
          callId,
          targetUserId,
          eventName: "call:webrtc-ice",
          payload: { candidate },
          callback,
        });
      } catch (error) {
        console.error("[socket] Error in call:webrtc-ice:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to relay ICE candidate" });
      }
    });

    // Call Reject Event
    socket.on("call:reject", async (data, callback) => {
      try {
        const { callId } = data;
        if (!callId) {
          if (callback) callback({ ok: false, error: "Missing callId" });
          return;
        }

        const call = await CallModel.findById(callId);
        if (!call) {
          if (callback) callback({ ok: false, error: "Call not found" });
          return;
        }

        // Update call status to rejected
        await callService.updateCallStatus({
          callId,
          userId,
          status: "rejected",
        });

        // Notify caller that call was rejected
        io.to(call.initiatedBy.toString()).emit("call:rejected", { callId });

        if (callback) callback({ ok: true });
      } catch (error) {
        console.error("[socket] Error in call:reject:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to reject call" });
      }
    });

    // Call Cancel Event
    socket.on("call:cancel", async (data, callback) => {
      try {
        const { callId, calleeId } = data;
        if (!callId || !calleeId) {
          if (callback) callback({ ok: false, error: "Missing required fields" });
          return;
        }

        // Update call status to cancelled
        await callService.updateCallStatus({
          callId,
          userId,
          status: "cancelled",
        });

        // Notify callee that call was cancelled
        io.to(calleeId.toString()).emit("call:cancelled", { callId });

        if (callback) callback({ ok: true });
      } catch (error) {
        console.error("[socket] Error in call:cancel:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to cancel call" });
      }
    });

    // Call End Event
    socket.on("call:end", async (data, callback) => {
      try {
        const { callId, durationSec } = data;
        if (!callId) {
          if (callback) callback({ ok: false, error: "Missing callId" });
          return;
        }

        const call = await CallModel.findById(callId);
        if (!call) {
          if (callback) callback({ ok: false, error: "Call not found" });
          return;
        }

        // Update participant leftAt state
        await callService.upsertParticipantState({
          callId,
          userId,
          participantUserId: userId,
          leftAt: new Date(),
        });

        // Check if all participants left or update call status
        // Usually, in browser-to-browser, ending the call by either party ends it for both
        await callService.updateCallStatus({
          callId,
          userId,
          status: "completed",
          durationSec,
        });

        // Notify both parties that call has ended
        const otherPartyId = call.initiatedBy.toString() === userId.toString()
          ? call.participants.find(p => p.userId.toString() !== userId.toString())?.userId
          : call.initiatedBy;

        io.to(userId.toString()).emit("call:ended", { callId });
        if (otherPartyId) {
          io.to(otherPartyId.toString()).emit("call:ended", { callId });
        }

        if (callback) callback({ ok: true });
      } catch (error) {
        console.error("[socket] Error in call:end:", error);
        if (callback) callback({ ok: false, error: error.message || "Failed to end call" });
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
          {
            $setOnInsert: { platform: devicePlatform, createdAt: new Date() },
            $set: { isOnline: true, lastActiveAt: new Date() },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
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
