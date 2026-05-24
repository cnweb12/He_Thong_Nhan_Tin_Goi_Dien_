const { UserModel } = require("../../users/models/user.model");
const { MessageModel } = require("../../messages/models/message.model");
const { SystemSettingsModel } = require("../models/system-settings.model");
const { BannedKeywordModel } = require("../models/banned-keyword.model");

/**
 * Get all users with pagination and filters
 */
async function getAllUsers(filters = {}) {
  const { page = 1, limit = 20, role, search } = filters;

  const query = {};
  if (role) {
    query.role = role;
  }
  if (search) {
    query.$or = [
      { phone: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    UserModel.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    UserModel.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  return UserModel.findById(userId).select("-passwordHash");
}

/**
 * Lock user account
 */
async function lockUser(userId) {
  return UserModel.findByIdAndUpdate(
    userId,
    { isLocked: true, lockedAt: new Date() },
    { new: true }
  ).select("-passwordHash");
}

/**
 * Unlock user account
 */
async function unlockUser(userId) {
  return UserModel.findByIdAndUpdate(
    userId,
    { isLocked: false, lockedAt: null },
    { new: true }
  ).select("-passwordHash");
}

/**
 * Change user role (super admin only)
 */
async function changeUserRole(userId, newRole, requesterRole) {
  // Only super admin can change roles
  if (requesterRole !== "super_admin") {
    throw new Error("Only super admin can change user roles");
  }

  // Prevent changing super admin role
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "super_admin") {
    throw new Error("Cannot change super admin role");
  }

  // Prevent creating multiple super admins
  if (newRole === "super_admin") {
    const existingSuperAdmin = await UserModel.findOne({ role: "super_admin" });
    if (existingSuperAdmin && existingSuperAdmin._id.toString() !== userId) {
      throw new Error("Cannot create multiple super admins");
    }
  }

  return UserModel.findByIdAndUpdate(
    userId,
    { role: newRole },
    { new: true }
  ).select("-passwordHash");
}

/**
 * Get all messages with filters
 */
async function getAllMessages(filters = {}) {
  const {
    page = 1,
    limit = 50,
    conversationId,
    senderId,
    startDate,
    endDate,
  } = filters;

  const query = {};
  if (conversationId) {
    query.conversationId = conversationId;
  }
  if (senderId) {
    query.senderId = senderId;
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    MessageModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "displayName phone avatarUrl")
      .populate("conversationId", "type title"),
    MessageModel.countDocuments(query),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Delete message
 */
async function deleteMessage(messageId) {
  return MessageModel.findByIdAndUpdate(
    messageId,
    { deletedAt: new Date() },
    { new: true }
  );
}

/**
 * Get system settings
 */
async function getSystemSettings() {
  const settings = await SystemSettingsModel.find({});
  const settingsMap = {};
  settings.forEach((setting) => {
    settingsMap[setting.key] = {
      value: setting.value,
      type: setting.type,
      description: setting.description,
    };
  });
  return settingsMap;
}

/**
 * Update system settings
 */
async function updateSystemSettings(settingsData) {
  const updates = Object.entries(settingsData).map(([key, value]) => ({
    updateOne: {
      filter: { key },
      update: {
        $set: {
          value,
          type: Array.isArray(value) ? "array" : typeof value,
        },
      },
      upsert: true,
    },
  }));

  if (updates.length > 0) {
    await SystemSettingsModel.bulkWrite(updates);
  }

  return getSystemSettings();
}

/**
 * Get banned keywords
 */
async function getBannedKeywords() {
  return BannedKeywordModel.find({ isActive: true }).sort({ keyword: 1 });
}

/**
 * Add banned keyword
 */
async function addBannedKeyword(keyword, addedBy) {
  return BannedKeywordModel.create({
    keyword: keyword.toLowerCase().trim(),
    addedBy,
  });
}

/**
 * Remove banned keyword
 */
async function removeBannedKeyword(keyword) {
  return BannedKeywordModel.findOneAndUpdate(
    { keyword: keyword.toLowerCase().trim() },
    { isActive: false },
    { new: true }
  );
}

module.exports = {
  getAllUsers,
  getUserById,
  lockUser,
  unlockUser,
  changeUserRole,
  getAllMessages,
  deleteMessage,
  getSystemSettings,
  updateSystemSettings,
  getBannedKeywords,
  addBannedKeyword,
  removeBannedKeyword,
};
