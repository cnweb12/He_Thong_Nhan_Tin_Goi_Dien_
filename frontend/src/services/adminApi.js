import { get, post, patch, del, withAuth } from './apiClient';

// Users
export const getUsers = async (params = {}) => {
  const { page = 1, limit = 20, role, search, accessToken } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  if (role) queryParams.append('role', role);
  if (search) queryParams.append('search', search);

  const path = `/api/admin/users?${queryParams.toString()}`;
  const response = await get(path, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to fetch users');
  return response.data;
};

export const getUserDetails = async (userId, accessToken) => {
  const path = `/api/admin/users/${userId}`;
  const response = await get(path, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to fetch user details');
  return response.data;
};

export const lockUserAccount = async (userId, accessToken) => {
  const path = `/api/admin/users/${userId}/lock`;
  const response = await post(path, {}, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to lock user');
  return response.data;
};

export const unlockUserAccount = async (userId, accessToken) => {
  const path = `/api/admin/users/${userId}/unlock`;
  const response = await post(path, {}, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to unlock user');
  return response.data;
};

export const changeUserRole = async (userId, role, accessToken) => {
  const path = `/api/admin/users/${userId}/role`;
  const response = await patch(path, { role }, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to change user role');
  return response.data;
};

// Messages
export const getAllMessages = async (params = {}) => {
  const { page = 1, limit = 50, conversationId, senderId, startDate, endDate, accessToken } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  if (conversationId) queryParams.append('conversationId', conversationId);
  if (senderId) queryParams.append('senderId', senderId);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  const path = `/api/admin/messages?${queryParams.toString()}`;
  const response = await get(path, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to fetch messages');
  return response.data;
};

export const deleteMessageAdmin = async (messageId, accessToken) => {
  const path = `/api/admin/messages/${messageId}`;
  const response = await del(path, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to delete message');
  return response.data;
};

// Settings
export const getSystemSettings = async (accessToken) => {
  const path = `/api/admin/settings`;
  const response = await get(path, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to fetch settings');
  return response.data;
};

export const updateSystemSettings = async (settings, accessToken) => {
  const path = `/api/admin/settings`;
  const response = await patch(path, { settings }, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to update settings');
  return response.data;
};

// Banned Keywords
export const getBannedKeywords = async (accessToken) => {
  const path = `/api/admin/banned-keywords`;
  const response = await get(path, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to fetch keywords');
  return response.data;
};

export const addBannedKeyword = async (keyword, accessToken) => {
  const path = `/api/admin/banned-keywords`;
  const response = await post(path, { keyword }, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to add keyword');
  return response.data;
};

export const removeBannedKeyword = async (keyword, accessToken) => {
  const path = `/api/admin/banned-keywords/${encodeURIComponent(keyword)}`;
  const response = await del(path, withAuth(accessToken));
  if (!response.ok) throw new Error(response.error || 'Failed to remove keyword');
  return response.data;
};
