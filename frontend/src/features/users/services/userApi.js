import { get, post, patch, del } from '../../../services/apiClient';

const withAuth = (accessToken) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const unwrapData = (payload) => (payload && payload.data ? payload.data : payload);

const normalizeUserRecord = (user) => {
  if (!user) return user;

  return {
    ...user,
    userId: user.userId || user._id || user.id || null,
  };
};

export const searchUsersApi = async (accessToken, query, { limit = 10 } = {}) => {
  const searchParams = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await get(`/api/users/search?${searchParams.toString()}`, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Search users failed');
  const payload = unwrapData(res.data);
  return Array.isArray(payload) ? payload.map(normalizeUserRecord) : payload;
};

export const getCurrentUserProfileApi = async (accessToken) => {
  const res = await get('/api/users/me', withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không tải được hồ sơ');
  return normalizeUserRecord(unwrapData(res.data));
};

export const updateCurrentUserProfileApi = async (accessToken, payload) => {
  const res = await patch('/api/users/me', payload, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không cập nhật được hồ sơ');
  return normalizeUserRecord(unwrapData(res.data));
};

export const updateCurrentUserSettingsApi = async (accessToken, payload) => {
  const res = await patch('/api/users/me/settings', payload, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không cập nhật được cài đặt');
  return normalizeUserRecord(unwrapData(res.data));
};

export const listFriendsApi = async (accessToken) => {
  const res = await get('/api/users/me/friends', withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không tải được danh sách bạn bè');
  return unwrapData(res.data);
};

export const listPendingRequestsApi = async (accessToken) => {
  const res = await get('/api/users/me/friend-requests', withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không tải được danh sách lời mời kết bạn');
  return unwrapData(res.data);
};

export const sendFriendRequestApi = async (accessToken, targetUserId) => {
  const res = await post(`/api/users/${targetUserId}/friends`, {}, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không gửi được lời mời kết bạn');
  return unwrapData(res.data);
};

export const acceptFriendRequestApi = async (accessToken, requesterId) => {
  const res = await post(`/api/users/${requesterId}/friends/accept`, {}, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không chấp nhận được lời mời kết bạn');
  return unwrapData(res.data);
};

export const removeFriendApi = async (accessToken, targetUserId) => {
  const res = await del(`/api/users/${targetUserId}/friends`, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không hủy được kết bạn');
  return unwrapData(res.data);
};

export default {
  searchUsersApi,
  getCurrentUserProfileApi,
  updateCurrentUserProfileApi,
  updateCurrentUserSettingsApi,
  listFriendsApi,
  listPendingRequestsApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  removeFriendApi,
};
