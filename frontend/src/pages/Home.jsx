import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import SidebarLeft from '../components/SidebarLeft';
import ChatSidebar from '../features/chats/components/ChatSidebar';
import ChatArea from '../features/chats/components/ChatArea';
import ConversationInfo from '../features/chats/components/ConversationInfo';
import LogoutButton from '../features/auth/components/LogoutButton';
import { useAppSocket } from '../features/realtime/hooks/useAppSocket';
import { useConversations } from '../features/conversations/hooks/useConversations';
import { getDirectConversationApi } from '../features/conversations/services/conversationApi';
import { getConversationMessagesApi, markConversationReadApi, sendMessageApi } from '../features/messages/services/messageApi';

const formatTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const resolveConversationId = (conversation) => conversation?.conversationId || conversation?.id || conversation?._id || null;

const normalizeMessage = (message) => ({
  id: message?._id || message?.id || message?.clientMessageId || `${message?.seq || 'message'}-${message?.createdAt || ''}`,
  from: message?.senderId || message?.from || '',
  text: message?.text || message?.content || '',
  time: formatTime(message?.createdAt),
  createdAt: message?.createdAt,
  type: message?.type || 'text',
  seq: message?.seq,
  clientMessageId: message?.clientMessageId,
});

const resolvePeerUser = (chat) => chat?.peer || {
  userId: chat?.peerUserId || chat?.peer?.userId || '',
  displayName: chat?.name || chat?.peer?.displayName || 'Cuộc trò chuyện',
  avatarUrl: chat?.avatarUrl || chat?.peer?.avatarUrl || '',
};

export default function Home() {
  const { user, accessToken, fetchCurrentUser } = useAuth();
  const { socket, isConnected, isConnecting, error: socketError } = useAppSocket();
  const { conversations, setConversations, fetchInbox, loading: inboxLoading, error: inboxError } = useConversations();
  const [sidebarView, setSidebarView] = useState('chat');
  const [selectedId, setSelectedId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [messagesLoadingId, setMessagesLoadingId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [initialError, setInitialError] = useState(null);
  const [threadError, setThreadError] = useState(null);

  const currentUserId = user?.userId || user?.id || user?._id || '';

  const joinedRoomsRef = React.useRef(new Set());

  useEffect(() => {
    if (!accessToken) {
      setIsBootstrapped(false);
      setInitialLoading(true);
      return;
    }

    if (isBootstrapped) {
      return;
    }

    // Wait only while socket is still trying and has not failed yet.
    // If realtime is unavailable, continue bootstrapping protected REST data.
    if (!isConnected && isConnecting && !socketError) {
      return;
    }

    let active = true;
    setInitialLoading(true);
    setInitialError(null);

    (async () => {
      try {
        await Promise.all([
          fetchCurrentUser(),
          fetchInbox(accessToken),
        ]);
      } catch (err) {
        if (!active) return;
        setInitialError(err?.message || 'Không tải được dữ liệu ban đầu');
      } finally {
        if (active) {
          setIsBootstrapped(true);
          setInitialLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [isConnected, isConnecting, socketError, accessToken, isBootstrapped, fetchCurrentUser, fetchInbox]);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(resolveConversationId(conversations[0]));
    }
  }, [selectedId, conversations]);

  useEffect(() => {
    if (!selectedId || !accessToken) {
      return;
    }

    let active = true;

    const loadMessages = async () => {
      setMessagesLoadingId(selectedId);
      setThreadError(null);

      try {
        const loadedMessages = await getConversationMessagesApi(accessToken, selectedId, { limit: 50 });
        const normalizedMessages = Array.isArray(loadedMessages) ? loadedMessages.map(normalizeMessage) : [];

        if (!active) return;

        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedId]: normalizedMessages,
        }));

        const lastSeenSeq = normalizedMessages.length > 0 ? normalizedMessages[normalizedMessages.length - 1].seq : null;
        if (lastSeenSeq !== null && lastSeenSeq !== undefined) {
          await markConversationReadApi(accessToken, selectedId, lastSeenSeq);
        }
      } catch (err) {
        if (!active) return;
        setThreadError(err?.message || 'Không tải được nội dung hội thoại');
      } finally {
        if (active) {
          setMessagesLoadingId((current) => (current === selectedId ? null : current));
        }
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, [selectedId, accessToken]);

  // Join ALL socket rooms to receive background updates for Inbox
  useEffect(() => {
    if (!socket || !isConnected || !conversations) return;

    conversations.forEach((c) => {
      const id = resolveConversationId(c);
      if (id && !joinedRoomsRef.current.has(id)) {
        console.log(`🔴 [DEBUG CLIENT] Đang join room cho hội thoại:`, id);
        socket.emit('join_room', { conversationId: id });
        joinedRoomsRef.current.add(id);
      }
    });
  }, [socket, isConnected, conversations]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message) => {
      console.log('🔴 [DEBUG CLIENT] Đã nhận event new_message từ server:', message);
      const normalizedMessage = normalizeMessage(message);
      const conversationId = message.conversationId || message.conversationId?._id || message.conversationId?.id;

      if (!conversationId) {
        console.warn('🔴 [DEBUG CLIENT] Không tìm thấy conversationId trong tin nhắn!');
        return;
      }

      // Update messages list
      setMessagesByConversation((prev) => {
        const currentMessages = prev[conversationId] || [];

        // Check if this message matches a pending message (by clientMessageId)
        const pendingMessageIndex = currentMessages.findIndex(m =>
          m.clientMessageId && m.clientMessageId === normalizedMessage.clientMessageId
        );

        if (pendingMessageIndex !== -1) {
          // Replace pending message with real message and update status
          console.log('🔴 [DEBUG CLIENT] Cập nhật tin nhắn đang gửi với dữ liệu thật.');
          const updatedMessages = [...currentMessages];
          updatedMessages[pendingMessageIndex] = { ...normalizedMessage, status: 'sent' };
          return {
            ...prev,
            [conversationId]: updatedMessages,
          };
        }

        // Prevent duplicate messages - check by id or content + senderId
        const isDuplicate = currentMessages.some(m =>
          m.id === normalizedMessage.id ||
          (m.text === normalizedMessage.text && m.from === normalizedMessage.from)
        );
        if (isDuplicate) {
          console.log('🔴 [DEBUG CLIENT] Bỏ qua tin nhắn vì bị trùng lặp (duplicate).');
          return prev;
        }

        console.log('🔴 [DEBUG CLIENT] Đã thêm tin nhắn mới vào state messagesByConversation.');
        return {
          ...prev,
          [conversationId]: [...currentMessages, normalizedMessage],
        };
      });

      // Update conversations list in sidebar
      setConversations((prev) => {
        const index = prev.findIndex((c) => resolveConversationId(c) === conversationId);
        if (index === -1) {
          refreshInbox(); // Fetch updated inbox if it's a new conversation
          return prev;
        }

        const updatedConversations = [...prev];
        const updatedConv = { ...updatedConversations[index] };
        updatedConv.lastMessage = normalizedMessage.text;
        updatedConv.time = normalizedMessage.time;
        if (selectedId !== conversationId) {
          updatedConv.unread = (updatedConv.unread || 0) + 1;
        }

        // Move to top
        updatedConversations.splice(index, 1);
        updatedConversations.unshift(updatedConv);
        return updatedConversations;
      });

      // Mark as read if we are looking at it (but not if we just sent it ourselves)
      // The sender marks it as read in handleSend, so we only need to mark for incoming messages
      const isOwnMessage = normalizedMessage.from === currentUserId;
      if (selectedId === conversationId && !isOwnMessage && normalizedMessage.seq !== undefined && normalizedMessage.seq !== null) {
        markConversationReadApi(accessToken, conversationId, normalizedMessage.seq).catch(console.error);
      }
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, selectedId, accessToken, setConversations]);

  const selected = useMemo(
    () => conversations.find((c) => resolveConversationId(c) === selectedId) || null,
    [conversations, selectedId],
  );

  const selectedMessages = messagesByConversation[selectedId] || [];

  const refreshInbox = async () => {
    if (!accessToken) return;
    await fetchInbox(accessToken);
  };

  const handleSelectConversation = (conversationId) => {
    setSelectedId(conversationId);
    setSidebarView('chat');
  };

  const handleStartConversation = async (peerUser) => {
    if (!accessToken || !peerUser?.userId) return;

    try {
      const directConversation = await getDirectConversationApi(accessToken, peerUser.userId);
      await refreshInbox();
      const conversationId = resolveConversationId(directConversation);
      if (conversationId) {
        setSelectedId(conversationId);
      }
      setSidebarView('chat');
    } catch (err) {
      setThreadError(err?.message || 'Không mở được cuộc trò chuyện mới');
    }
  };

  const handleSend = async (text) => {
    if (!selected || !accessToken) return;

    const conversationId = resolveConversationId(selected);
    if (!conversationId) return;

    const clientMessageId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `client-${Date.now()}`;

    setSendingMessage(true);

    // Optimistic UI - add message immediately with status 'sending'
    const optimisticMessage = normalizeMessage({
      _id: `temp-${clientMessageId}`,
      clientMessageId,
      content: text,
      text,
      senderId: currentUserId,
      from: currentUserId,
      conversationId,
      createdAt: new Date().toISOString(),
      type: 'text',
    });
    optimisticMessage.status = 'sending';

    setMessagesByConversation((prev) => {
      const currentMessages = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: [...currentMessages, optimisticMessage],
      };
    });

    setConversations((prev) => prev.map((conversation) => {
      const id = resolveConversationId(conversation);
      if (id !== conversationId) return conversation;

      return {
        ...conversation,
        lastMessage: text,
        time: formatTime(new Date()),
        unread: 0,
      };
    }));

    // Send API in background
    try {
      const sentMessage = await sendMessageApi(accessToken, {
        conversationId,
        type: 'text',
        text,
        clientMessageId,
      });

      const normalizedMessage = normalizeMessage(sentMessage);
      normalizedMessage.status = 'sent';

      // Replace optimistic message with real message
      setMessagesByConversation((prev) => {
        const currentMessages = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: currentMessages.map((msg) =>
            msg.clientMessageId === clientMessageId ? normalizedMessage : msg
          ),
        };
      });

      if (normalizedMessage.seq !== undefined && normalizedMessage.seq !== null) {
        await markConversationReadApi(accessToken, conversationId, normalizedMessage.seq);
      }

      return sentMessage;
    } catch (err) {
      // Update message status to error
      setMessagesByConversation((prev) => {
        const currentMessages = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: currentMessages.map((msg) =>
            msg.clientMessageId === clientMessageId ? { ...msg, status: 'error' } : msg
          ),
        };
      });
      setThreadError(err?.message || 'Không gửi được tin nhắn');
      throw err;
    } finally {
      setSendingMessage(false);
    }
  };

  const viewTitle = sidebarView === 'chat'
    ? 'Tin nhắn'
    : sidebarView === 'contacts'
      ? 'Danh bạ'
      : sidebarView === 'cloud'
        ? 'Cloud'
        : 'Công việc';

  if (inboxError || initialError) {
    return (
      <div className="h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#f7fafc,_#eef2f7_42%,_#f4f7fb_100%)]">
        <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-[1.5rem] px-6 py-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] max-w-md">
          <p className="text-red-600 font-semibold mb-2">Không thể tải dữ liệu khởi tạo</p>
          <p className="text-sm text-slate-600 mb-4">{inboxError || initialError}</p>
          <button
            type="button"
            onClick={() => {
              setInitialError(null);
              setIsBootstrapped(false);
              setInitialLoading(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0068ff] text-white hover:bg-[#005bd6] transition shadow-md"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Only block UI for protected data bootstrap. Realtime can recover in background.
  if (!isBootstrapped || initialLoading || inboxLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#f7fafc,_#eef2f7_42%,_#f4f7fb_100%)]">
        <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-[1.5rem] px-6 py-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <p className="text-slate-800 font-semibold mb-2">Đang tải dữ liệu...</p>
          <p className="text-sm text-slate-500">Đồng bộ hồ sơ cá nhân và inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex overflow-hidden text-slate-900 bg-[linear-gradient(135deg,_#f8fafc_0%,_#eef2f7_35%,_#f4f7fb_100%)]">
      <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-slate-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-10 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />

      <div className="absolute top-4 right-4 z-50">
        <LogoutButton />
      </div>

      {socketError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-300 text-yellow-900 text-sm px-4 py-2 rounded-md shadow">
          Realtime tạm thời gián đoạn. Ứng dụng vẫn chạy với dữ liệu REST.
        </div>
      )}

      <SidebarLeft active={sidebarView} onSelect={setSidebarView} />

      {sidebarView === 'chat' ? (
        <ChatSidebar
          user={user}
          accessToken={accessToken}
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
          onStartConversation={handleStartConversation}
        />
      ) : (
        <div style={{ width: 360 }} className="flex-shrink-0 bg-white/80 backdrop-blur border-r border-slate-200 p-4 shadow-[8px_0_30px_rgba(15,23,42,0.04)]">
          <div className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-3">{viewTitle}</div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            Nội dung {viewTitle} đang hiển thị ở đây.
          </div>
        </div>
      )}

      {sidebarView === 'chat' ? (
        <ChatArea
          chat={selected}
          messages={selectedMessages}
          currentUserId={currentUserId}
          loading={messagesLoadingId === selectedId}
          error={threadError}
          onSend={handleSend}
          sending={sendingMessage}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-base">
          Chuyển sang {viewTitle}
        </div>
      )}

      <ConversationInfo chat={selected} messages={selectedMessages} currentUserId={currentUserId} />
    </div>
  );
}

