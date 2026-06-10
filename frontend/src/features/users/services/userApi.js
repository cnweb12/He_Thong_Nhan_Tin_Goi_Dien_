import { get, patch } from '../../../services/apiClient';

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

export default {
  searchUsersApi,
  getCurrentUserProfileApi,
  updateCurrentUserProfileApi,
  updateCurrentUserSettingsApi,
};
