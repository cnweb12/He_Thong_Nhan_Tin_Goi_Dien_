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
  const { isConnected, isConnecting, error: socketError } = useAppSocket();
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

    try {
      const sentMessage = await sendMessageApi(accessToken, {
        conversationId,
        type: 'text',
        text,
        clientMessageId,
      });

      const normalizedMessage = normalizeMessage(sentMessage);

      setMessagesByConversation((prev) => {
        const currentMessages = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: [...currentMessages, normalizedMessage],
        };
      });

      setConversations((prev) => prev.map((conversation) => {
        const id = resolveConversationId(conversation);
        if (id !== conversationId) return conversation;

        return {
          ...conversation,
          lastMessage: text,
          time: formatTime(sentMessage?.createdAt || new Date()),
          unread: 0,
        };
      }));

      if (normalizedMessage.seq !== undefined && normalizedMessage.seq !== null) {
        await markConversationReadApi(accessToken, conversationId, normalizedMessage.seq);
      }

      return sentMessage;
    } catch (err) {
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

