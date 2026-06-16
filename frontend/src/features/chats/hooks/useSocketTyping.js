import { useEffect, useRef, useState } from 'react';

/**
 * Hook xử lý socket events typing_start và typing_stop.
 * Trả về object typingUsers: { [conversationId]: [{userId, displayName}] }
 *
 * @param {object} params
 * @param {object} params.socket
 * @param {boolean} params.isConnected
 * @param {string} params.currentUserId
 * @returns {{ typingUsers: object }}
 */
export function useSocketTyping({ socket, isConnected, currentUserId }) {
  const [typingUsers, setTypingUsers] = useState({});
  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTypingStart = ({ conversationId, userId, displayName }) => {
      if (userId === currentUserIdRef.current) return;
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        if (current.find((u) => u.userId === userId)) return prev;
        return { ...prev, [conversationId]: [...current, { userId, displayName }] };
      });
    };

    const handleTypingStop = ({ conversationId, userId }) => {
      if (userId === currentUserIdRef.current) return;
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        const updated = current.filter((u) => u.userId !== userId);
        if (updated.length === current.length) return prev;
        return { ...prev, [conversationId]: updated };
      });
    };

    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, isConnected]);

  return { typingUsers };
}
