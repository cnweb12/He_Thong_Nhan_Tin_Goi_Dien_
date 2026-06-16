import { useEffect, useRef } from 'react';
import { resolveConversationId } from '../../../utils/conversationUtils';

/**
 * Hook xử lý socket event message_read.
 * - Nếu userId là chính mình: reset unread count của conversation đó về 0
 * - Nếu là người khác: đánh dấu tin nhắn cuối cùng mình gửi (seq <= lastSeenSeq) là 'read'
 *
 * @param {object} params
 * @param {object} params.socket
 * @param {boolean} params.isConnected
 * @param {string} params.currentUserId
 * @param {Function} params.setConversations
 * @param {Function} params.setMessagesByConversation
 */
export function useSocketReadReceipt({
  socket,
  isConnected,
  currentUserId,
  setConversations,
  setMessagesByConversation,
}) {
  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageRead = ({ conversationId, userId, lastSeenSeq }) => {
      if (userId === currentUserIdRef.current) {
        // Mình vừa đọc → reset unread badge
        setConversations((prev) =>
          prev.map((c) =>
            resolveConversationId(c) === conversationId ? { ...c, unread: 0 } : c
          )
        );
      } else if (lastSeenSeq != null) {
        // Đối phương đọc → hiện avatar "Đã xem" trên tin nhắn cuối cùng
        setMessagesByConversation((prev) => {
          const cur = prev[conversationId] || [];
          if (cur.length === 0) return prev;

          // Bước 1: Xóa tất cả trạng thái 'read' cũ
          let updated = cur.map((msg) =>
            msg.from === currentUserIdRef.current && msg.status === 'read'
              ? { ...msg, status: 'sent' }
              : msg
          );

          // Bước 2: Tìm từ cuối mảng, đánh dấu tin nhắn của mình đầu tiên gặp là 'read'
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].from === currentUserIdRef.current && updated[i].seq <= lastSeenSeq) {
              updated[i] = { ...updated[i], status: 'read' };
              break;
            }
          }

          return { ...prev, [conversationId]: updated };
        });
      }
    };

    socket.on('message_read', handleMessageRead);
    return () => socket.off('message_read', handleMessageRead);
  }, [socket, isConnected, setConversations, setMessagesByConversation]);
}
