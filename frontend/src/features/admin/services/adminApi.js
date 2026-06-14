import { get, post, patch, del } from '../../../services/apiClient';

const withAuth = (accessToken) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});

const unwrap = (res, fallback) => {
  if (!res.ok) throw new Error(res.error || fallback);
  return res.data?.data ?? res.data;
};

// ── Users ────────────────────────────────────────────────────────────────
export const getAllUsersApi = async (accessToken, { page = 1, limit = 20, role, search } = {}) => {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (role) params.set('role', role);
  if (search) params.set('search', search);
  const res = await get(`/api/admin/users?${params.toString()}`, withAuth(accessToken));
  return unwrap(res, 'Không lấy được danh sách user');
};

export const getUserByIdApi = async (accessToken, userId) => {
  const res = await get(`/api/admin/users/${userId}`, withAuth(accessToken));
  return unwrap(res, 'Không lấy được thông tin user');
};

export const lockUserApi = async (accessToken, userId) => {
  const res = await post(`/api/admin/users/${userId}/lock`, {}, withAuth(accessToken));
  return unwrap(res, 'Không khóa được user');
};

export const unlockUserApi = async (accessToken, userId) => {
  const res = await post(`/api/admin/users/${userId}/unlock`, {}, withAuth(accessToken));
  return unwrap(res, 'Không mở khóa được user');
};

export const changeUserRoleApi = async (accessToken, userId, role) => {
  const res = await patch(`/api/admin/users/${userId}/role`, { role }, withAuth(accessToken));
  return unwrap(res, 'Không đổi được role');
};

// ── Messages ─────────────────────────────────────────────────────────────
export const getAllMessagesApi = async (accessToken, { page = 1, limit = 50, conversationId, senderId, startDate, endDate } = {}) => {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (conversationId) params.set('conversationId', conversationId);
  if (senderId) params.set('senderId', senderId);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const res = await get(`/api/admin/messages?${params.toString()}`, withAuth(accessToken));
  return unwrap(res, 'Không lấy được danh sách tin nhắn');
};

export const deleteMessageApi = async (accessToken, messageId) => {
  const res = await del(`/api/admin/messages/${messageId}`, withAuth(accessToken));
  return unwrap(res, 'Không xóa được tin nhắn');
};

// ── System settings ─────────────────────────────────────────────────────
export const getSystemSettingsApi = async (accessToken) => {
  const res = await get('/api/admin/settings', withAuth(accessToken));
  return unwrap(res, 'Không lấy được cài đặt hệ thống');
};

export const updateSystemSettingsApi = async (accessToken, settings) => {
  const res = await patch('/api/admin/settings', { settings }, withAuth(accessToken));
  return unwrap(res, 'Không cập nhật được cài đặt');
};

// ── Banned keywords ──────────────────────────────────────────────────────
export const getBannedKeywordsApi = async (accessToken) => {
  const res = await get('/api/admin/banned-keywords', withAuth(accessToken));
  return unwrap(res, 'Không lấy được danh sách từ khóa cấm');
};

export const addBannedKeywordApi = async (accessToken, keyword) => {
  const res = await post('/api/admin/banned-keywords', { keyword }, withAuth(accessToken));
  return unwrap(res, 'Không thêm được từ khóa cấm');
};

export const removeBannedKeywordApi = async (accessToken, keyword) => {
  const res = await del(`/api/admin/banned-keywords/${encodeURIComponent(keyword)}`, withAuth(accessToken));
  return unwrap(res, 'Không xóa được từ khóa cấm');
};
