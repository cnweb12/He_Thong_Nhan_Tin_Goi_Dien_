import { post } from '../../../services/apiClient';

export const loginApi = async (phone, password) => {
  const body = {
    phone,
    password,
    deviceId: 'device-uuid-1234',
    platform: 'web',
  };

  const res = await post('/api/auth/login', body);
  if (!res.ok) throw new Error(res.error || 'Login failed');
  // Normalize backend envelope: { ok: true, data: { ... } }
  return res.data && res.data.data ? res.data.data : res.data;
};

export const registerApi = async (phone, displayName, password, passwordConfirm) => {
  const body = { phone, displayName, password, passwordConfirm };
  const res = await post('/api/auth/register', body);
  if (!res.ok) throw new Error(res.error || 'Register failed');
  return res.data && res.data.data ? res.data.data : res.data;
};

export const logoutApi = async (deviceId = 'device-uuid-1234') => {
  const res = await post('/api/auth/logout', { deviceId });
  if (!res.ok) throw new Error(res.error || 'Logout failed');
  return res.data && res.data.data ? res.data.data : res.data;
};

export const refreshApi = async (refreshToken, deviceId = 'device-uuid-1234') => {
  const res = await post('/api/auth/refresh', { refreshToken, deviceId });
  if (!res.ok) throw new Error(res.error || 'Refresh failed');
  return res.data && res.data.data ? res.data.data : res.data;
};