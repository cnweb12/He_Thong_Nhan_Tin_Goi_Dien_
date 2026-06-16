import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import SidebarLeft from '../components/SidebarLeft';
import ChatSidebar from '../features/chats/components/ChatSidebar';
import ChatArea from '../features/chats/components/ChatArea';
import ConversationInfo from '../features/chats/components/ConversationInfo';
import { useAppSocket } from '../features/realtime/hooks/useAppSocket';
import { useConversations } from '../features/conversations/hooks/useConversations';
import { getDirectConversationApi } from '../features/conversations/services/conversationApi';
import {
  getConversationMessagesApi,
  markConversationReadApi,
  sendMessageApi,
  recallMessageApi,
  clearHistoryApi,
} from '../features/messages/services/messageApi';
import { uploadFilesApi } from '../services/upload.service';
import { listPendingRequestsApi } from '../features/users/services/userApi';
import ContactsPage from '../features/users/ContactsPage';
import CloudPage from '../features/users/CloudPage';
import TasksPage from '../features/users/TasksPage';

// Custom socket hooks (tách ra khỏi Home để giảm độ phức tạp)
import { useSocketMessages } from '../features/chats/hooks/useSocketMessages';
import { useSocketTyping } from '../features/chats/hooks/useSocketTyping';
import { useSocketReadReceipt } from '../features/chats/hooks/useSocketReadReceipt';

// Shared utils
import {
  resolveConversationId,
  normalizeMessage,
  formatTime,
} from '../utils/conversationUtils';

// ─── component ──────────────────────────────────────────────────────────────

export default function Home() {
  const { user, accessToken, fetchCurrentUser, logout, restoreSession } = useAuth();
  const { socket, isConnected, isConnecting, error: socketError } = useAppSocket();
  const {
    conversations,
    setConversations,
    fetchInbox,
    loading: inboxLoading,
    error: inboxError,
  } = useConversations();

  const location = useLocation();
  const [sidebarView, setSidebarView] = useState(location.state?.sidebarView || 'chat');
  const [selectedId, setSelectedId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [messagesLoadingId, setMessagesLoadingId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [initialError, setInitialError] = useState(null);
  const [threadError, setThreadError] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const currentUserId = user?.userId || user?.id || user?._id || '';
  const joinedRoomsRef = useRef(new Set());

  // Refs để tránh stale closure trong socket event listeners
  const selectedIdRef = useRef(selectedId);
  const accessTokenRef = useRef(accessToken);
  const messagesByConversationRef = useRef(messagesByConversation);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    accessTokenRef.current = accessToken;
  }, [selectedId, accessToken]);

  useEffect(() => {
    messagesByConversationRef.current = messagesByConversation;
  }, [messagesByConversation]);

  // ── Socket hooks (đã tách ra riêng) ───────────────────────────────────────
  useSocketMessages({
    socket,
    isConnected,
    currentUserId,
    selectedIdRef,
    accessTokenRef,
    messagesByConversationRef,
    setMessagesByConversation,
    setConversations,
    userSettings: user?.settings,
    markReadApi: markConversationReadApi,
  });

  useSocketReadReceipt({
    socket,
    isConnected,
    currentUserId,
    setConversations,
    setMessagesByConversation,
  });

  const { typingUsers } = useSocketTyping({
    socket,
    isConnected,
    currentUserId,
  });

  // ── Join socket rooms khi có conversation mới ─────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !conversations.length) return;
    conversations.forEach((c) => {
      const id = resolveConversationId(c);
      if (id && !joinedRoomsRef.current.has(id)) {
        socket.emit('join_room', { conversationId: id });
        joinedRoomsRef.current.add(id);
      }
    });
  }, [socket, isConnected, conversations]);

  // ── Bootstrap: load user + inbox sau khi socket sẵn sàng ──────────────────
  useEffect(() => {
    if (!accessToken) {
      setIsBootstrapped(false);
      setInitialLoading(true);
      return;
    }
    if (isBootstrapped) return;
    if (!isConnected && isConnecting && !socketError) return;

    let active = true;
    setInitialLoading(true);
    setInitialError(null);

    (async () => {
      let hasError = false;
      try {
        const [, , requests] = await Promise.all([
          fetchCurrentUser(),
          fetchInbox(accessToken),
          listPendingRequestsApi(accessToken).catch(() => []),
        ]);
        if (active) {
          setPendingRequestsCount(requests?.length || 0);
        }
      } catch (err) {
        if (!active) return;
        hasError = true;
        const errMsg = err?.message || '';
        const isAuthError =
          errMsg.toLowerCase().includes('token') ||
          errMsg.toLowerCase().includes('unauthorized');

        if (isAuthError) {
          try {
            const newToken = await restoreSession();
            if (newToken) return;
          } catch (e) {
            // session expired
          }
        }

        setInitialError(errMsg || 'Không tải được dữ liệu ban đầu');
      } finally {
        if (active && !hasError) {
          setIsBootstrapped(true);
          setInitialLoading(false);
        }
      }
    })();

    return () => { active = false; };
  }, [isConnected, isConnecting, socketError, accessToken, isBootstrapped, fetchCurrentUser, fetchInbox, restoreSession]);

  // ── Load tin nhắn khi chọn conversation ───────────────────────────────────
  useEffect(() => {
    if (!selectedId || !accessToken) return;

    let active = true;

    const loadMessages = async () => {
      setMessagesLoadingId(selectedId);
      setThreadError(null);
      try {
        const raw = await getConversationMessagesApi(accessToken, selectedId, { limit: 50 });
        const msgs = Array.isArray(raw) ? raw.map(normalizeMessage) : [];
        if (!active) return;

        setMessagesByConversation((prev) => ({ ...prev, [selectedId]: msgs }));

        const readReceiptEnabled = user?.settings?.readReceiptEnabled !== false;
        const lastSeq = msgs.length > 0 ? msgs[msgs.length - 1].seq : null;
        if (lastSeq != null && readReceiptEnabled) {
          await markConversationReadApi(accessToken, selectedId, lastSeq);
        }
      } catch (err) {
        if (active) setThreadError(err?.message || 'Không tải được nội dung hội thoại');
      } finally {
        if (active) setMessagesLoadingId((cur) => (cur === selectedId ? null : cur));
      }
    };

    loadMessages();
    return () => { active = false; };
  }, [selectedId, accessToken, user]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const selected = useMemo(
    () => conversations.find((c) => resolveConversationId(c) === selectedId) || null,
    [conversations, selectedId]
  );

  const selectedMessages = messagesByConversation[selectedId] || [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const refreshInbox = useCallback(async () => {
    if (!accessToken) return;
    await fetchInbox(accessToken);
  }, [accessToken, fetchInbox]);

  const handleSelectConversation = useCallback((conversationId) => {
    if (selectedId === conversationId) return;
    setSelectedId(conversationId);
    setSidebarView('chat');
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setIsChatListOpen(false);
      }
    } catch (e) { /* noop */ }
  }, [selectedId]);

  const handleStartConversation = useCallback(async (peerUser) => {
    if (!accessToken || !peerUser?.userId) return;
    try {
      const direct = await getDirectConversationApi(accessToken, peerUser.userId);
      await refreshInbox();
      const id = resolveConversationId(direct);
      if (id) setSelectedId(id);
      setSidebarView('chat');
      try {
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
          setIsChatListOpen(false);
        }
      } catch (e) { /* noop */ }
    } catch (err) {
      setThreadError(err?.message || 'Không mở được cuộc trò chuyện mới');
    }
  }, [accessToken, refreshInbox]);

  const handleSend = useCallback(async (messageData) => {
    if (!selected || !accessToken) return;

    const convId = resolveConversationId(selected);
    if (!convId) return;

    const clientMessageId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `client-${Date.now()}`;

    const isObject = typeof messageData === 'object' && messageData !== null;
    const text = isObject ? messageData.text || '' : messageData;
    const type = isObject && messageData.type ? messageData.type : 'text';
    const attachments = isObject && messageData.attachments ? messageData.attachments : [];

    // Optimistic UI
    const optimistic = normalizeMessage({
      _id: `temp-${clientMessageId}`,
      clientMessageId,
      content: text,
      text,
      senderId: currentUserId,
      conversationId: convId,
      createdAt: new Date().toISOString(),
      type,
      attachments,
    });
    optimistic.status = 'sending';

    setMessagesByConversation((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), optimistic],
    }));

    setConversations((prev) =>
      prev.map((c) => {
        if (resolveConversationId(c) !== convId) return c;
        return {
          ...c,
          lastMessage:
            text ||
            (type === 'image' ? '[Hình ảnh]' : type === 'file' ? '[Tệp đính kèm]' : ''),
          time: formatTime(new Date()),
          unread: 0,
        };
      })
    );

    setSendingMessage(true);

    try {
      let finalAttachments = [...attachments];
      const filesToUpload = attachments.filter((a) => a.file).map((a) => a.file);
      if (filesToUpload.length > 0) {
        const uploaded = await uploadFilesApi(filesToUpload, accessToken);
        finalAttachments = uploaded.map((f) => ({
          fileName: f.originalname,
          url: f.url,
          mimeType: f.mimetype,
          size: f.size,
        }));
      }

      const payload = { conversationId: convId, type, clientMessageId };
      if (text) payload.text = text;
      if (finalAttachments.length > 0) payload.attachments = finalAttachments;

      const sent = await sendMessageApi(accessToken, payload);
      const normalized = { ...normalizeMessage(sent), status: 'sent' };

      setMessagesByConversation((prev) => {
        const cur = prev[convId] || [];
        return {
          ...prev,
          [convId]: cur.map((m) => (m.clientMessageId === clientMessageId ? normalized : m)),
        };
      });

      // Mình là người gửi nên luôn "đọc" tin vừa gửi
      if (normalized.seq != null) {
        await markConversationReadApi(accessToken, convId, normalized.seq);
      }

      return sent;
    } catch (err) {
      setMessagesByConversation((prev) => {
        const cur = prev[convId] || [];
        return {
          ...prev,
          [convId]: cur.map((m) =>
            m.clientMessageId === clientMessageId ? { ...m, status: 'error' } : m
          ),
        };
      });
      setThreadError(err?.message || 'Không gửi được tin nhắn');
      throw err;
    } finally {
      setSendingMessage(false);
    }
  }, [selected, accessToken, currentUserId, setConversations]);

  const handleClearHistory = useCallback(async () => {
    if (!selectedId || !accessToken) return;
    try {
      await clearHistoryApi(accessToken, selectedId);
      setMessagesByConversation((prev) => ({ ...prev, [selectedId]: [] }));
      setConversations((prev) =>
        prev.map((c) =>
          resolveConversationId(c) === selectedId
            ? { ...c, lastMessage: '', time: '' }
            : c
        )
      );
    } catch (err) {
      setThreadError(err?.message || 'Không thể xóa cuộc trò chuyện');
    }
  }, [selectedId, accessToken, setConversations]);

  const handleRecallMessage = useCallback(async (messageId) => {
    if (!accessToken) return;
    try {
      await recallMessageApi(accessToken, messageId);
    } catch (err) {
      setThreadError(err?.message || 'Không thể thu hồi tin nhắn');
    }
  }, [accessToken]);

  // ── Render guards ─────────────────────────────────────────────────────────
  if (inboxError || initialError) {
    const errMsg = inboxError || initialError;
    const isAuthError =
      errMsg?.toLowerCase().includes('token') ||
      errMsg?.toLowerCase().includes('unauthorized');

    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-[#17212b] border border-slate-200 dark:border-[#1e2d3d] rounded-2xl px-6 py-5 text-center shadow max-w-md">
          <p className="text-red-600 font-semibold mb-2">Không thể tải dữ liệu</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{errMsg}</p>
          {isAuthError ? (
            <button
              type="button"
              onClick={() => logout()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Đăng nhập lại
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setInitialError(null);
                setIsBootstrapped(false);
                setInitialLoading(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isBootstrapped || initialLoading || inboxLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-[#17212b] border border-slate-200 dark:border-[#1e2d3d] rounded-2xl px-6 py-5 text-center shadow">
          <p className="text-slate-800 dark:text-slate-100 font-semibold mb-1">Đang tải dữ liệu...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Đồng bộ hồ sơ và inbox.</p>
        </div>
      </div>
    );
  }

  const isMobileNavVisible = !(sidebarView === 'chat' && !isChatListOpen);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col md:flex-row w-full h-screen h-[100dvh] overflow-hidden text-slate-900 bg-slate-100 dark:bg-[#0e1621]">
      {socketError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-300 text-yellow-900 text-sm px-4 py-2 rounded-md shadow">
          Realtime tạm gián đoạn. Ứng dụng vẫn chạy bình thường.
        </div>
      )}

      {/* Sidebar icon trái (Desktop) / dưới cùng (Mobile) */}
      <div className="z-20 flex-shrink-0 order-last md:order-first w-full md:w-auto h-auto md:h-full">
        <SidebarLeft
          active={sidebarView}
          onSelect={setSidebarView}
          isChatListOpen={isChatListOpen}
          setIsChatListOpen={setIsChatListOpen}
          hasUnreadChat={conversations.some((c) => (c.unreadCount || c.unread || 0) > 0)}
          hasPendingRequests={pendingRequestsCount > 0}
        />
      </div>

      {/* Vùng nội dung chính */}
      <div className="flex-1 min-w-0 flex flex-row overflow-hidden">
        {sidebarView === 'chat' ? (
          <>
            {/* Cột danh sách cuộc trò chuyện */}
            <div
              className={`z-10 h-full flex flex-col bg-white dark:bg-[#17212b] flex-shrink-0 border-r border-slate-200 dark:border-[#1e2d3d] overflow-hidden
                ${!isChatListOpen
                  ? 'hidden sm:hidden'
                  : 'flex w-full sm:w-[25%] sm:min-w-[280px] sm:max-w-[400px]'
                }`}
            >
              <ChatSidebar
                user={user}
                accessToken={accessToken}
                conversations={conversations}
                selectedId={selectedId}
                onSelect={handleSelectConversation}
                onStartConversation={handleStartConversation}
                typingUsers={typingUsers}
              />
            </div>

            {/* Vùng chat chính */}
            <div
              className={`min-w-0 h-full flex-col relative
                ${isChatListOpen
                  ? 'hidden sm:flex sm:flex-1'
                  : 'flex flex-1'
                }`}
            >
              {selectedId ? (
                <ChatArea
                  chat={selected}
                  messages={selectedMessages}
                  currentUserId={currentUserId}
                  loading={messagesLoadingId === selectedId}
                  error={threadError}
                  onSend={handleSend}
                  sending={sendingMessage}
                  typingUsers={typingUsers[selectedId] || []}
                  onToggleInfo={() => setIsInfoOpen((v) => !v)}
                  onBack={() => {
                    setSelectedId(null);
                    setIsInfoOpen(false);
                    try {
                      if (typeof window !== 'undefined' && window.innerWidth < 640) {
                        setIsChatListOpen(true);
                      }
                    } catch (e) { /* noop */ }
                  }}
                  onClearHistory={handleClearHistory}
                  onRecallMessage={handleRecallMessage}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-[#0e1621]">
                  <div className="w-20 h-20 mb-4 rounded-full bg-blue-50 dark:bg-[#1c2b38] flex items-center justify-center">
                    <span className="text-blue-300 text-3xl font-semibold">C</span>
                  </div>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Chưa chọn cuộc trò chuyện</p>
                  <p className="text-sm mt-1">Hãy chọn một mục từ danh sách bên trái.</p>
                </div>
              )}
            </div>

            {/* Panel thông tin bên phải */}
            <div
              className={`z-30 h-full flex-shrink-0 transition-all duration-300 bg-white dark:bg-[#17212b] border-l border-slate-200 dark:border-[#1e2d3d] overflow-hidden ${isInfoOpen && selectedId
                ? 'w-0 sm:w-[25%] sm:min-w-[280px] sm:max-w-[400px] sm:opacity-100 opacity-0 border-none'
                : 'w-0 opacity-0 border-none'
                } hidden sm:flex`}
            >
              {isInfoOpen && selectedId && (
                <ConversationInfo
                  chat={selected}
                  messages={selectedMessages}
                  currentUserId={currentUserId}
                  onClose={() => setIsInfoOpen(false)}
                />
              )}
            </div>
          </>
        ) : sidebarView === 'contacts' ? (
          <ContactsPage
            accessToken={accessToken}
            onStartConversation={handleStartConversation}
          />
        ) : sidebarView === 'cloud' ? (
          <CloudPage
            accessToken={accessToken}
            currentUser={user}
          />
        ) : sidebarView === 'task' ? (
          <TasksPage
            currentUser={user}
          />
        ) : null}
      </div>
    </div>
  );
}
