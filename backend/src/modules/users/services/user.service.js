const { mapMongoError } = require("../../../../database/mongo/mongo-error.mapper");
const { normalizePhone, normalizeUsername } = require("../../../../database/mongo/normalize");
const { UserModel } = require("../models/user.model");
const { FriendModel } = require("../models/friend.model");

/**
 * Hàm này sẽ có nhiệm vụ chuyển đổi từ object dạng document của Mongoose về object thường của JS. Nếu truyền vào object thường thì sẽ trả về y nguyên
 * @param {*} value object là document của Mongoose
 * @returns object chuẩn của JS
 */
function toPlainObject(value) {
  if (!value) {
    return value;
  }

  if (typeof value.toObject === "function") {
    return value.toObject();
  }

  return value;
}
/**
 * Lọc bỏ các field nhạy cảm ra khỏi record được truyền vào, là lớp bảo vệ dữ liệu.
 * @param {*} user record dữ liệu mục tiêu
 * @returns record đã lọc các field nhạy cảm
 */
function sanitizeUser(user, options = {}) {
  if (!user) {
    return null;
  }

  const plainUser = toPlainObject(user);
  const { includePhone = false } = options;
  const { passwordHash, __v, phone, ...safeUser } = plainUser;

  if (includePhone) {
    safeUser.phone = phone;
  }

  return safeUser;
}

/**
 * Hàm tạo lỗi HTTP theo một format chung
 * @param {*} statusCode 
 * @param {*} message 
 * @param {*} details 
 * @returns object mô tả lỗi theo format
 */
function createHttpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
}

/**
 * Hàm này sẽ escape các ký tự regex đặc biệt trong xâu. Mục tiêu là đảm bảo an toàn cho xâu tìm kiếm.
 * @param {string} value 
 * @returns xâu đã escape các ký tự regex
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Hàm này tạo ra một user service mới
 * @param {*} dependencies các dependency cần inject khi test, sẽ được ưu tiên hơn dependency đang hardcode 
 * @returns các method bên trong, tương tự việc export ra ngoài các hàm.
 */
function createUserService(dependencies = {}) {
  const userModel = dependencies.UserModel || UserModel;
  const mongoErrorMapper = dependencies.mapMongoError || mapMongoError;

  /** tương tự getUserById nhưng dùng để tìm user hiện tại đang đăng nhập*/
  async function getCurrentUser(userId) {
    const user = await userModel.findById(userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return sanitizeUser(user, { includePhone: true });
  }

  /**
   * Hàm này trả về object đã được sanitized mô tả thông tin của user với userId được cho trước
   * @param {*} userId 
   * @returns 
   */
  async function getUserById(userId) {
    const user = await userModel.findById(userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return sanitizeUser(user);
  }

  /**
   * Thực hiện tìm kiếm user theo query cho trước, nếu query rỗng thì trả về []
   * @param {object} param0 object đầu vào gồm 3 cặp key value: 
   * - query: xâu query cần truyền.
   * - limit: giới hạn số lượng kết quả tìm kiếm, default là 20.
   * - excludeUserId: userId bị loại khỏi kết quả tìm kiếm 
   * @returns một array chứa các kết quả tìm kiếm đã được sanitized
   */
  async function searchUsers({ query, limit = 20, excludeUserId } = {}) {
    const trimmedQuery = String(query || "").trim();
    if (!trimmedQuery) {
      return [];
    }

    const safeRegex = new RegExp(escapeRegex(trimmedQuery), "i");
    const normalizedQuery = normalizeUsername(trimmedQuery);
    const normalizedPhoneQuery = normalizePhone(trimmedQuery);
    const filter = {
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
      $or: [
        { displayName: safeRegex },
        { username: normalizedQuery },
        { phone: normalizedPhoneQuery },
      ],
    };

    const users = await userModel.find(filter).sort({ displayName: 1, createdAt: -1 }).limit(limit);
    return users.map((user) => sanitizeUser(user));
  }

  async function updateProfile(userId, payload = {}) {
    const updateData = {};

    if (payload.username !== undefined) {
      updateData.username = payload.username;
    }

    if (payload.displayName !== undefined) {
      updateData.displayName = payload.displayName;
    }

    if (payload.avatarUrl !== undefined) {
      updateData.avatarUrl = payload.avatarUrl;
    }

    try {
      const user = await userModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });

      if (!user) {
        throw createHttpError(404, "User not found");
      }

      return sanitizeUser(user, { includePhone: true });
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  async function updateSettings(userId, settings = {}) {
    const $set = {};

    if (settings.theme !== undefined) {
      $set["settings.theme"] = settings.theme;
    }

    if (settings.language !== undefined) {
      $set["settings.language"] = settings.language;
    }

    if (settings.allowStrangerMessages !== undefined) {
      $set["settings.allowStrangerMessages"] = settings.allowStrangerMessages;
    }

    try {
      const user = await userModel.findByIdAndUpdate(userId, { $set }, { new: true, runValidators: true });

      if (!user) {
        throw createHttpError(404, "User not found");
      }

      return sanitizeUser(user, { includePhone: true });
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  async function sendFriendRequest(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) {
      throw createHttpError(400, "Missing user id");
    }

    if (String(fromUserId) === String(toUserId)) {
      throw createHttpError(400, "Cannot send friend request to yourself");
    }

    const toUser = await userModel.findById(toUserId);
    if (!toUser) {
      throw createHttpError(404, "User not found");
    }

    const existing = await FriendModel.findOne({ userId: fromUserId, friendId: toUserId });
    if (existing) {
      if (existing.status === "pending") {
        throw createHttpError(409, "Friend request already sent");
      }
      if (existing.status === "accepted") {
        throw createHttpError(409, "Already friends");
      }
    }

    try {
      const created = await FriendModel.create({ userId: fromUserId, friendId: toUserId, status: "pending" });
      return toPlainObject(created);
    } catch (error) {
      const mapped = mongoErrorMapper(error);
      throw createHttpError(mapped.statusCode, mapped.message, mapped.details);
    }
  }

  async function acceptFriendRequest(currentUserId, requesterId) {
    const request = await FriendModel.findOne({ userId: requesterId, friendId: currentUserId, status: "pending" });
    if (!request) {
      throw createHttpError(404, "Friend request not found");
    }

    request.status = "accepted";
    await request.save();

    const reciprocal = await FriendModel.findOne({ userId: currentUserId, friendId: requesterId });
    if (!reciprocal) {
      await FriendModel.create({ userId: currentUserId, friendId: requesterId, status: "accepted" });
    } else if (reciprocal.status !== "accepted") {
      reciprocal.status = "accepted";
      await reciprocal.save();
    }

    return { ok: true };
  }

  async function listFriends(userId) {
    const relations = await FriendModel.find({ userId, status: "accepted" }).select("friendId -_id");
    const ids = relations.map((r) => r.friendId);
    if (!ids.length) return [];

    const users = await userModel.find({ _id: { $in: ids } }).select("_id displayName phone");
    return users.map((u) => ({
      userId: u._id,
      displayName: u.displayName,
      phone: u.phone,
    }));
  }

  async function listPendingRequests(userId) {
    const relations = await FriendModel.find({ friendId: userId, status: "pending" }).select("userId -_id");
    const ids = relations.map((r) => r.userId);
    if (!ids.length) return [];

    const users = await userModel.find({ _id: { $in: ids } }).select("_id displayName phone");
    return users.map((u) => ({
      userId: u._id,
      displayName: u.displayName,
      phone: u.phone,
    }));
  }

  async function removeFriend(userId, friendId) {
    const result = await FriendModel.deleteMany({ $or: [ { userId, friendId }, { userId: friendId, friendId: userId } ] });
    if (!result.deletedCount) {
      throw createHttpError(404, "Friend relationship not found");
    }

    return { ok: true };
  }

  return {
    getCurrentUser,
    getUserById,
    searchUsers,
    updateProfile,
    updateSettings,
    sanitizeUser,
    sendFriendRequest,
    acceptFriendRequest,
    listFriends,
    listPendingRequests,
    removeFriend,
  };
}

module.exports = {
  createUserService,
  sanitizeUser,
  userService: createUserService(),
};
