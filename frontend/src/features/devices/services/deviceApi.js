import { get, put, patch } from '../../../services/apiClient';

const withAuth = (accessToken) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const unwrapData = (payload) => (payload && payload.data ? payload.data : payload);

export const getMyDevicesApi = async (accessToken) => {
  const res = await get('/api/devices/me', withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không tải được danh sách thiết bị');
  return unwrapData(res.data);
};

export const upsertCurrentDeviceApi = async (accessToken, payload) => {
  const res = await put('/api/devices/current', payload, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không thể đồng bộ thiết bị');
  return unwrapData(res.data);
};

export const updateCurrentPresenceApi = async (accessToken, payload) => {
  const res = await patch('/api/devices/current/presence', payload, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không thể cập nhật trạng thái hoạt động');
  return unwrapData(res.data);
};

export default {
  getMyDevicesApi,
  upsertCurrentDeviceApi,
  updateCurrentPresenceApi,
};
