import { useEffect, useRef } from 'react';
import { normalizeMessage, resolveConversationId, normalizeConversationFromSocket, getMessagePreviewText, formatTime } from '../../../utils/conversationUtils';

/**
 * Hook xử lý tất cả socket events liên quan đến tin nhắn:
 * - new_message: thêm tin nhắn mới, cập nhật sidebar
 * - message:recalled: đánh dấu tin nhắn đã thu hồi
 *
 * @param {object} params
 * @param {object} params.socket - socket instance
 * @param {boolean} params.isConnected
 * @param {string} params.currentUserId
 * @param {React.MutableRefObject} params.selectedIdRef
 * @param {React.MutableRefObject} params.accessTokenRef
 * @param {React.MutableRefObject} params.messagesByConversationRef
 * @param {Function} params.setMessagesByConversation
 * @param {Function} params.setConversations
 * @param {object|null} params.userSettings - user.settings
 */
export function useSocketMessages({
  socket,
  isConnected,
  currentUserId,
  selectedIdRef,
  accessTokenRef,
  messagesByConversationRef,
  setMessagesByConversation,
  setConversations,
  userSettings,
  markReadApi,
}) {
  const processedMsgIdsRef = useRef(new Set());
  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  // ── new_message ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data) => {
      const { message: rawMessage, conversation: backendConv } = data;
      if (!rawMessage || !backendConv) return;

      const msg = normalizeMessage(rawMessage);
      const convId = resolveConversationId(backendConv);
      if (!convId || !msg.id) return;

      // Loại bỏ duplicate event do backend gửi vào 2 room
      if (processedMsgIdsRef.current.has(msg.id)) return;
      processedMsgIdsRef.current.add(msg.id);
      if (processedMsgIdsRef.current.size > 200) {
        const first = processedMsgIdsRef.current.values().next().value;
        processedMsgIdsRef.current.delete(first);
      }

      // Cập nhật danh sách tin nhắn
      setMessagesByConversation((prev) => {
        const cur = prev[convId] || [];
        const pendingIdx = cur.findIndex(
          (m) => m.clientMessageId && m.clientMessageId === msg.clientMessageId
        );
        if (pendingIdx !== -1) {
          const updated = [...cur];
          updated[pendingIdx] = { ...msg, status: 'sent' };
          return { ...prev, [convId]: updated };
        }
        if (cur.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [convId]: [...cur, msg] };
      });

      // Cập nhật sidebar
      setConversations((prev) => {
        const idx = prev.findIndex((c) => resolveConversationId(c) === convId);

        if (idx === -1) {
          const newConv = normalizeConversationFromSocket(backendConv, currentUserIdRef.current);
          if (!newConv) return prev;
          newConv.lastMessage = msg.text;
          newConv.time = msg.time;
          newConv.lastActivityAt = msg.createdAt;
          newConv.unread = 1;
          return [newConv, ...prev];
        }

        const updated = [...prev];
        const conv = { ...updated[idx] };
        conv.lastMessage = msg.text;
        conv.time = msg.time;
        conv.lastActivityAt = msg.createdAt;
        if (selectedIdRef.current !== convId) conv.unread = (conv.unread || 0) + 1;

        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });

      // Đánh dấu đã đọc nếu đang xem conversation này
      const readReceiptEnabled = userSettings?.readReceiptEnabled !== false;
      if (
        selectedIdRef.current === convId &&
        msg.from !== currentUserIdRef.current &&
        msg.seq != null &&
        readReceiptEnabled
      ) {
        markReadApi(accessTokenRef.current, convId, msg.seq).catch(() => {});
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, isConnected, setConversations, setMessagesByConversation, userSettings, markReadApi, selectedIdRef, accessTokenRef]);

  // ── message:recalled ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageRecalled = ({ messageId, conversationId, deletedAt }) => {
      setMessagesByConversation((prev) => {
        const currentMessages = prev[conversationId];
        if (!currentMessages) return prev;
        const updatedMessages = currentMessages.map((m) =>
          m.id === messageId ? { ...m, deletedAt, text: 'Tin nhắn đã thu hồi' } : m
        );
        return { ...prev, [conversationId]: updatedMessages };
      });

      setConversations((prevConvs) => {
        const convIndex = prevConvs.findIndex((c) => resolveConversationId(c) === conversationId);
        if (convIndex === -1) return prevConvs;

        const allMessages = messagesByConversationRef.current[conversationId] || [];
        const lastMessageInUI = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;

        if (lastMessageInUI && lastMessageInUI.id === messageId) {
          const newConversations = [...prevConvs];
          const updatedConv = { ...newConversations[convIndex] };
          const newLastMessage = allMessages.length > 1 ? allMessages[allMessages.length - 2] : null;

          updatedConv.lastMessage = getMessagePreviewText(newLastMessage);
          updatedConv.time = newLastMessage ? formatTime(newLastMessage.createdAt) : '';
          updatedConv.lastActivityAt = newLastMessage ? newLastMessage.createdAt : updatedConv.createdAt;

          newConversations[convIndex] = updatedConv;
          return newConversations;
        }

        return prevConvs;
      });
    };

    socket.on('message:recalled', handleMessageRecalled);
    return () => socket.off('message:recalled', handleMessageRecalled);
  }, [socket, isConnected, setConversations, setMessagesByConversation, messagesByConversationRef]);
}
