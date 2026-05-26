import { get, patch, post } from '../../../services/apiClient';

const withAuth = (accessToken) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const unwrapData = (payload) => (payload && payload.data ? payload.data : payload);

export const getConversationMessagesApi = async (accessToken, conversationId, { limit = 50, beforeSeq } = {}) => {
  const query = new URLSearchParams({ limit: String(limit) });

  if (beforeSeq !== undefined && beforeSeq !== null && beforeSeq !== '') {
    query.set('beforeSeq', String(beforeSeq));
  }

  const res = await get(`/api/messages/conversations/${conversationId}?${query.toString()}`, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Fetch messages failed');
  return unwrapData(res.data);
};

export const sendMessageApi = async (accessToken, body) => {
  const res = await post('/api/messages', body, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Send message failed');
  return unwrapData(res.data);
};

export const markConversationReadApi = async (accessToken, conversationId, lastSeenSeq) => {
  const res = await patch(`/api/conversations/${conversationId}/read`, { lastSeenSeq }, withAuth(accessToken));
  if (!res.ok) throw new Error(res.error || 'Mark read failed');
  return unwrapData(res.data);
};

export default {
  getConversationMessagesApi,
  sendMessageApi,
  markConversationReadApi,
};