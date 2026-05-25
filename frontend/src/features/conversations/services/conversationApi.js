import { get } from '../../../services/apiClient';

const withAuth = (accessToken) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

export const getInboxApi = async (accessToken, { limit = 20, skip = 0 } = {}) => {
  const query = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
  });

  const res = await get(`/api/conversations/inbox?${query.toString()}`, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Fetch inbox failed');
  return res.data && res.data.data ? res.data.data : res.data;
};

export default {
  getInboxApi,
};
