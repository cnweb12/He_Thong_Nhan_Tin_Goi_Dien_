import { get, post } from '../../../services/apiClient';

const withAuth = (accessToken) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const unwrapData = (payload) => (payload && payload.data ? payload.data : payload);

export const getInboxApi = async (accessToken, { limit = 20, skip = 0 } = {}) => {
  const query = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
  });

  const res = await get(`/api/conversations/inbox?${query.toString()}`, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Fetch inbox failed');
  return unwrapData(res.data);
};

export const getDirectConversationApi = async (accessToken, peerUserId) => {
  const res = await post('/api/conversations/direct', { peerUserId }, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Không tạo được cuộc trò chuyện');
  const payload = res.data;

  return unwrapData(payload);
};

export default {
  getInboxApi,
  getDirectConversationApi,
};
