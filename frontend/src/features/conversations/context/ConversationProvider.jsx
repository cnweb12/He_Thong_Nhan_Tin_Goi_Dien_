import React, { createContext, useCallback, useMemo, useState } from 'react';
import { getInboxApi } from '../services/conversationApi';

export const ConversationContext = createContext(null);

const formatConversationTime = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const mapInboxItemToConversation = (item) => ({
  id: item.conversationId,
  conversationId: item.conversationId,
  name: item?.peer?.displayName || 'Unknown',
  lastMessage: item?.lastMessage?.content || '',
  time: formatConversationTime(item?.lastMessage?.createdAt),
  unread: item?.unreadCount || 0,
  peer: item?.peer || null,
  messages: [],
});

export function ConversationProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInbox = useCallback(async (accessToken, options = {}) => {
    if (!accessToken) {
      setConversations([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const inboxItems = await getInboxApi(accessToken, options);
      const normalized = Array.isArray(inboxItems)
        ? inboxItems.map(mapInboxItemToConversation)
        : [];
      setConversations(normalized);
      return normalized;
    } catch (err) {
      setError(err?.message || 'Không tải được inbox');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    conversations,
    setConversations,
    loading,
    error,
    fetchInbox,
  }), [conversations, loading, error, fetchInbox]);

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export default ConversationProvider;
