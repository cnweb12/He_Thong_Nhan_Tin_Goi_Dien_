import { get } from './apiClient';

export const getUsers = async (params = {}) => {
  const { page = 1, limit = 20, role, search, accessToken } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  if (role) queryParams.append('role', role);
  if (search) queryParams.append('search', search);

  const path = `/api/admin/users?${queryParams.toString()}`;
  
  const opts = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const response = await get(path, opts);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch users');
  }
  return response.data;
};

export const getUserDetails = async (userId, accessToken) => {
  const path = `/api/admin/users/${userId}`;
  const opts = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const response = await get(path, opts);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch user details');
  }
  return response.data;
};
