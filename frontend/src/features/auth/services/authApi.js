import { post } from '../../../services/apiClient';

export const loginApi = async (phone, password) => {
  const body = {
    phone,
    password,
    deviceId: 'device-uuid-1234',
    platform: 'web',
  };

  const res = await post('/api/auth/login', body);
  // normalize: return data or throw
  if (!res.ok) throw new Error(res.error || 'Login failed');
  return res.data;
};