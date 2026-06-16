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
} from '../features/messages/services/messageApi';
import { uploadFilesApi } from '../services/upload.service';
import { listPendingRequestsApi } from '../features/users/services/userApi';
import ContactsPage from '../features/users/ContactsPage';
import CloudPage from '../features/users/CloudPage';
import TasksPage from '../features/users/TasksPage';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const resolveConversationId = (conversation) =>
  conversation?.conversationId || conversation?.id || conversation?._id || null;

const normalizeMessage = (message) => ({
  id:
    message?._id ||
    message?.id ||
    message?.clientMessageId ||
    `${message?.seq || 'msg'}-${message?.createdAt || ''}`,
  from: message?.senderId || message?.from || '',
  sender: message?.sender || message?.user || message?.fromUser || null,
  text: message?.text || message?.content || '',
  time: formatTime(message?.createdAt),
  createdAt: message?.createdAt,
  type: message?.type || 'text',
  seq: message?.seq,
  clientMessageId: message?.clientMessageId,
  attachments: message?.attachments || [],
  // Giữ nguyên status nếu có (ví dụ: 'read', 'sent'), nếu không thì mặc định là 'sent'
  status: message?.status || 'sent',
});

const normalizeConversationFromSocket = (conversation, currentUserId) => {
  if (!conversation) return null;
  const { members = [], type, _id, title, avatarUrl: groupAvatarUrl } = conversation;
  const base = { ...conversation, conversationId: _id, id: _id };

  if (type === 'direct') {
    const peer = members.find((m) => m.userId !== currentUserId);
    if (peer?.user) {
      base.displayName = peer.user.displayName;
      base.displayAvatarUrl = peer.user.avatarUrl;
      base.peer = peer.user;
    }
  } else {
    base.displayName = title;
    base.displayAvatarUrl = groupAvatarUrl;
  }
  return base;
};

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
  const [typingUsers, setTypingUsers] = useState({});

  const currentUserId = user?.userId || user?.id || user?._id || '';
  const joinedRoomsRef = useRef(new Set());
  const processedMsgIdsRef = useRef(new Set());

  // Lưu trữ giá trị bằng Ref để tránh việc re-bind Socket Event Listener liên tục khi state thay đổi
  const selectedIdRef = useRef(selectedId);
  const accessTokenRef = useRef(accessToken);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    accessTokenRef.current = accessToken;
    currentUserIdRef.current = currentUserId;
  }, [selectedId, accessToken, currentUserId]);

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
        const [_, __, requests] = await Promise.all([
            fetchCurrentUser(), 
            fetchInbox(accessToken),
            listPendingRequestsApi(accessToken).catch(() => [])
        ]);
        if (active) {
            setPendingRequestsCount(requests?.length || 0);
        }
      } catch (err) {
        if (!active) return;
        hasError = true;
        const errMsg = err?.message || '';
        const isAuthError = errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('unauthorized');
        
        if (isAuthError) {
            try {
                const newToken = await restoreSession();
                if (newToken) return; 
            } catch (e) {}
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
  }, [isConnected, isConnecting, socketError, accessToken, isBootstrapped, fetchCurrentUser, fetchInbox]);

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

        // Chỉ đánh dấu đã đọc khi bật read receipt
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

  // ── Nhận tin nhắn mới từ socket ───────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data) => {
      const { message: rawMessage, conversation: backendConv } = data;
      if (!rawMessage || !backendConv) return;

      const msg = normalizeMessage(rawMessage);
      const convId = resolveConversationId(backendConv);
      if (!convId || !msg.id) return;

      // Loại bỏ duplicate event do backend gửi vào 2 room (room conversation và room cá nhân)
      if (processedMsgIdsRef.current.has(msg.id)) return;
      processedMsgIdsRef.current.add(msg.id);
      if (processedMsgIdsRef.current.size > 200) {
        const firstElement = processedMsgIdsRef.current.values().next().value;
        processedMsgIdsRef.current.delete(firstElement);
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
          // Conversation mới
          const newConv = normalizeConversationFromSocket(backendConv, currentUserIdRef.current);
          if (!newConv) return prev;
          newConv.lastMessage = msg.text;
          newConv.time = msg.time;
          newConv.lastActivityAt = msg.createdAt;
          newConv.unread = 1;

          // Side Effect join_room đã được lược bỏ ở đây vì đã có useEffect chuyên dụng ở trên handle tự động
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

      // Đánh dấu đã đọc nếu đang xem conversation này và bật read receipt
      const readReceiptEnabled = user?.settings?.readReceiptEnabled !== false;
      if (selectedIdRef.current === convId && msg.from !== currentUserIdRef.current && msg.seq != null && readReceiptEnabled) {
        markConversationReadApi(accessTokenRef.current, convId, msg.seq).catch(() => { });
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, isConnected, setConversations]);

  // ── Người kia đã đọc tin ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageRead = ({ conversationId, userId, lastSeenSeq }) => {
      if (userId === currentUserIdRef.current) {
        setConversations((prev) =>
          prev.map((c) =>
            resolveConversationId(c) === conversationId ? { ...c, unread: 0 } : c
          )
        );
      } else if (lastSeenSeq != null) {
        // Đối phương đã đọc -> Đánh dấu tin nhắn cuối cùng mình gửi (<= lastSeenSeq) là 'read'
        setMessagesByConversation((prev) => {
          const cur = prev[conversationId] || [];
          if (cur.length === 0) return prev;
          
          let updated = cur.map(msg => {
              if (msg.from === currentUserIdRef.current && msg.status === 'read') {
                  return { ...msg, status: 'sent' }; // Xóa trạng thái read cũ
              }
              return msg;
          });
          
          // Tìm tin nhắn cuối cùng của mình mà đối phương đã xem
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
  }, [socket, isConnected, setConversations]);

  // ── Typing Indicator ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleTypingStart = ({ conversationId, userId, displayName }) => {
      if (userId === currentUserIdRef.current) return;
      setTypingUsers(prev => {
         const current = prev[conversationId] || [];
         if (current.find(u => u.userId === userId)) return prev;
         return { ...prev, [conversationId]: [...current, { userId, displayName }] };
      });
    };
    
    const handleTypingStop = ({ conversationId, userId }) => {
      if (userId === currentUserIdRef.current) return;
      setTypingUsers(prev => {
         const current = prev[conversationId] || [];
         const updated = current.filter(u => u.userId !== userId);
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
    // On small screens, close the chat list to show the chat area full-screen
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

      // Mình là người gửi nên luôn "đọc" tin vừa gửi (kể cả khi tắt read receipt)
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

  // ── Render guards ─────────────────────────────────────────────────────────
  if (inboxError || initialError) {
    const isAuthError = (inboxError || initialError)?.toLowerCase().includes('token') || (inboxError || initialError)?.toLowerCase().includes('unauthorized');

    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 text-center shadow max-w-md">
          <p className="text-red-600 font-semibold mb-2">Không thể tải dữ liệu</p>
          <p className="text-sm text-slate-600 mb-4">{inboxError || initialError}</p>
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
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 text-center shadow">
          <p className="text-slate-800 font-semibold mb-1">Đang tải dữ liệu...</p>
          <p className="text-sm text-slate-500">Đồng bộ hồ sơ và inbox.</p>
        </div>
      </div>
    );
  }

  const viewTitle =
    sidebarView === 'chat'
      ? 'Tin nhắn'
      : sidebarView === 'contacts'
        ? 'Danh bạ'
        : sidebarView === 'cloud'
          ? 'Cloud'
          : 'Công việc';

  const isMobileNavVisible = !(sidebarView === 'chat' && !isChatListOpen);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className={`relative h-screen flex w-full overflow-hidden text-slate-900 bg-slate-100 ${isMobileNavVisible ? 'pb-[64px] md:pb-0' : ''}`}>
      {socketError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-300 text-yellow-900 text-sm px-4 py-2 rounded-md shadow">
          Realtime tạm gián đoạn. Ứng dụng vẫn chạy bình thường.
        </div>
      )}

      {/* Sidebar icon trái */}
      <div className="z-20 h-full flex-shrink-0">
        <SidebarLeft
          active={sidebarView}
          onSelect={setSidebarView}
          isChatListOpen={isChatListOpen}
          setIsChatListOpen={setIsChatListOpen}
          hasUnreadChat={conversations.some(c => (c.unreadCount || c.unread || 0) > 0)}
          hasPendingRequests={pendingRequestsCount > 0}
        />
      </div>

      {/* Vùng nội dung chính */}
      <div className="flex-1 min-w-0 h-full flex overflow-hidden">
        {sidebarView === 'chat' ? (
          <>
            {/* Cột danh sách cuộc trò chuyện
                - Desktop: luôn hiện (trừ khi bị thu bằng nút toggle)
                - Mobile: chỉ hiện khi isChatListOpen = true (chưa chọn conv)
            */}
            <div
              className={`z-10 h-full flex flex-col transition-all duration-300 bg-white flex-shrink-0 border-r border-slate-200 overflow-hidden
                ${!isChatListOpen
                  ? 'w-0 opacity-0 border-none'
                  : 'w-full sm:w-[25%] sm:min-w-[280px] sm:max-w-[400px] opacity-100'
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

            {/* Vùng chat chính
                - Desktop: luôn hiện (flex-1)
                - Mobile: chỉ hiện khi đã chọn conversation (!isChatListOpen)
            */}
            <div
              className={`min-w-0 h-full flex-col relative transition-all duration-300
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
                    // Trên mobile, quay lại danh sách khi nhấn back
                    try {
                      if (typeof window !== 'undefined' && window.innerWidth < 640) {
                        setIsChatListOpen(true);
                      }
                    } catch (e) { /* noop */ }
                  }}
                />
              ) : (
                // Placeholder chỉ hiện trên desktop khi chưa chọn conv
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                  <div className="w-20 h-20 mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-300 text-3xl font-semibold">C</span>
                  </div>
                  <p className="text-lg font-medium text-slate-600">Chưa chọn cuộc trò chuyện</p>
                  <p className="text-sm mt-1">Hãy chọn một mục từ danh sách bên trái.</p>
                </div>
              )}
            </div>

            {/* Panel thông tin bên phải — chỉ hiện trên desktop */}
            <div
              className={`z-30 h-full flex-shrink-0 transition-all duration-300 bg-white border-l border-slate-200 overflow-hidden ${isInfoOpen && selectedId
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
