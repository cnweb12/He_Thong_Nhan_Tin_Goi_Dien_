import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { uploadFilesApi } from '../services/upload.service';

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
  attachments: message?.attachments || [],
});

const resolvePeerUser = (chat) => chat?.peer || {
  userId: chat?.peerUserId || chat?.peer?.userId || '',
  displayName: chat?.name || chat?.peer?.displayName || 'Cuộc trò chuyện',
  avatarUrl: chat?.avatarUrl || chat?.peer?.avatarUrl || '',
};

const normalizeConversationFromSocket = (conversation, currentUserId) => {
  if (!conversation) return null;

  const { members = [], type, _id, title, avatarUrl: groupAvatarUrl } = conversation;
  const newConversation = {
    ...conversation,
    conversationId: _id,
    id: _id,
  };

  if (type === 'direct') {
    const peerMember = members.find(m => m.userId !== currentUserId);
    if (peerMember && peerMember.user) {
      newConversation.displayName = peerMember.user.displayName;
      newConversation.displayAvatarUrl = peerMember.user.avatarUrl;
      newConversation.peer = peerMember.user;
    }
  } else {
    newConversation.displayName = title;
    newConversation.displayAvatarUrl = groupAvatarUrl;
  }
  return newConversation;
}

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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(true);

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

    const handleNewMessage = (data) => {
      console.log('🔴 [DEBUG CLIENT] Đã nhận event new_message từ server:', data);
      const { message: rawMessage, conversation: backendConv } = data;

      if (!rawMessage || !backendConv) {
        console.warn('🔴 [DEBUG CLIENT] Payload của new_message không hợp lệ!');
        return;
      }

      const normalizedMessage = normalizeMessage(rawMessage);
      const conversationId = resolveConversationId(backendConv);

      if (!conversationId) {
        console.warn('🔴 [DEBUG CLIENT] Không tìm thấy conversationId trong tin nhắn!');
        return;
      }

      // Update messages list
      setMessagesByConversation((prev) => {
        const currentMessages = prev[conversationId] || [];

        const pendingMessageIndex = currentMessages.findIndex(m =>
          m.clientMessageId && m.clientMessageId === normalizedMessage.clientMessageId
        );

        if (pendingMessageIndex !== -1) {
          const updatedMessages = [...currentMessages];
          updatedMessages[pendingMessageIndex] = { ...normalizedMessage, status: 'sent' };
          return { ...prev, [conversationId]: updatedMessages };
        }

        const isDuplicate = currentMessages.some(m => m.id === normalizedMessage.id);
        if (isDuplicate) {
          return prev;
        }
        
        return {
          ...prev,
          [conversationId]: [...currentMessages, normalizedMessage],
        };
      });

      // Update conversations list in sidebar
      setConversations((prev) => {
        const index = prev.findIndex((c) => resolveConversationId(c) === conversationId);

        // Case 1: This is a new conversation
        if (index === -1) {
          console.log('🔴 [DEBUG CLIENT] Phát hiện cuộc trò chuyện mới, thêm vào danh sách.');
          const newConversation = normalizeConversationFromSocket(backendConv, currentUserId);
          if (!newConversation) return prev;

          newConversation.lastMessage = normalizedMessage.text;
          newConversation.time = normalizedMessage.time;
          newConversation.lastActivityAt = normalizedMessage.createdAt;
          newConversation.unread = 1;

          // Add new room to socket
          const id = resolveConversationId(newConversation);
          if (id && !joinedRoomsRef.current.has(id)) {
            console.log(`🔴 [DEBUG CLIENT] Đang join room cho hội thoại MỚI:`, id);
            socket.emit('join_room', { conversationId: id });
            joinedRoomsRef.current.add(id);
          }

          return [newConversation, ...prev];
        }

        // Case 2: This is an existing conversation
        const updatedConversations = [...prev];
        const updatedConv = { ...updatedConversations[index] };
        updatedConv.lastMessage = normalizedMessage.text;
        updatedConv.time = normalizedMessage.time;
        updatedConv.lastActivityAt = normalizedMessage.createdAt;

        if (selectedId !== conversationId) {
          updatedConv.unread = (updatedConv.unread || 0) + 1;
        }

        // Move to top
        updatedConversations.splice(index, 1);
        updatedConversations.unshift(updatedConv);
        return updatedConversations;
      });

      // Mark as read if we are looking at it
      const isOwnMessage = normalizedMessage.from === currentUserId;
      if (selectedId === conversationId && !isOwnMessage && normalizedMessage.seq != null) {
        markConversationReadApi(accessToken, conversationId, normalizedMessage.seq).catch(console.error);
      }
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, selectedId, accessToken, currentUserId, setConversations]);

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
    if (selectedId === conversationId) return; // Tránh chọn lại gây lỗi đơ
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

  const handleSend = async (messageData) => {
    if (!selected || !accessToken) return;

    const conversationId = resolveConversationId(selected);
    if (!conversationId) return;

    const clientMessageId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `client-${Date.now()}`;

    setSendingMessage(true);
    
    // messageData can be a string (text) or an object {text, type, attachments}
    const isObject = typeof messageData === 'object' && messageData !== null;
    const text = isObject ? (messageData.text || '') : messageData;
    const type = isObject && messageData.type ? messageData.type : 'text';
    const attachments = isObject && messageData.attachments ? messageData.attachments : [];

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
      type,
      attachments,
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
        lastMessage: text || (type === 'image' ? '[Hình ảnh]' : type === 'file' ? '[Tệp đính kèm]' : ''),
        time: formatTime(new Date()),
        unread: 0,
      };
    }));

    // Send API in background
    try {
      let finalAttachments = [...attachments];
      
      const filesToUpload = attachments.filter(a => a.file).map(a => a.file);
      if (filesToUpload.length > 0) {
        const uploadedFiles = await uploadFilesApi(filesToUpload, accessToken);
        finalAttachments = uploadedFiles.map(file => ({
            fileName: file.originalname,
            url: file.url,
            mimeType: file.mimetype,
            size: file.size
        }));
      }

      const payload = {
        conversationId,
        type,
        clientMessageId,
      };
      if (text) payload.text = text;
      if (finalAttachments.length > 0) payload.attachments = finalAttachments;

      const sentMessage = await sendMessageApi(accessToken, payload);

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
    <div className="relative h-screen flex w-full overflow-hidden text-slate-900 bg-[linear-gradient(135deg,_#f8fafc_0%,_#eef2f7_35%,_#f4f7fb_100%)]">
      <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-slate-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-10 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />

      {socketError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-300 text-yellow-900 text-sm px-4 py-2 rounded-md shadow">
          Realtime tạm thời gián đoạn. Ứng dụng vẫn chạy với dữ liệu REST.
        </div>
      )}

      <div className="z-20 h-full flex-shrink-0 relative">
        <SidebarLeft 
            active={sidebarView} 
            onSelect={setSidebarView} 
            isChatListOpen={isChatListOpen}
            setIsChatListOpen={setIsChatListOpen}
        />
      </div>

      {sidebarView === 'chat' ? (
        <div className={`z-10 h-full flex flex-col transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-xl flex-shrink-0 border-r border-slate-200/80 overflow-hidden shadow-lg ${!isChatListOpen ? 'w-0 opacity-0 border-none' : 'w-[25%] min-w-[280px] max-w-[400px] opacity-100'}`}>
          <div className="w-full h-full">
            <ChatSidebar
              user={user}
              accessToken={accessToken}
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelectConversation}
              onStartConversation={handleStartConversation}
            />
          </div>
        </div>
      ) : (
        <div className={`z-10 h-full flex flex-col transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-xl flex-shrink-0 border-r border-slate-200/80 overflow-hidden shadow-lg ${!isChatListOpen ? 'w-0 opacity-0 border-none' : 'w-[25%] min-w-[280px] max-w-[400px] opacity-100 p-4'}`}>
          <div className="w-full h-full">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-3">{viewTitle}</div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
              Nội dung {viewTitle} đang hiển thị ở đây.
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 h-full flex flex-col relative">
        {sidebarView === 'chat' && selectedId ? (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <ChatArea
              chat={selected}
              messages={selectedMessages}
              currentUserId={currentUserId}
              loading={messagesLoadingId === selectedId}
              error={threadError}
              onSend={handleSend}
              sending={sendingMessage}
              onToggleInfo={() => setIsInfoOpen(!isInfoOpen)}
              onBack={() => {
                setSelectedId(null);
                setIsInfoOpen(false);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
               <div className="w-20 h-20 mb-4 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
                   <span className="text-blue-300 text-3xl font-semibold">C</span>
               </div>
               <p className="text-lg font-medium text-slate-700">Chưa chọn nội dung nào</p>
               <p className="text-sm mt-1">Hãy chọn một mục từ danh sách bên trái để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Cột thông tin bên phải */}
      <div className={`z-30 h-full flex flex-col transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-xl border-l border-slate-200/80 overflow-hidden shadow-lg flex-shrink-0 ${isInfoOpen && selectedId ? 'w-[25%] min-w-[280px] max-w-[400px] opacity-100' : 'w-0 opacity-0 border-none'}`}>
        <div className="w-full h-full">
           {isInfoOpen && selectedId && (
             <ConversationInfo 
               chat={selected} 
               messages={selectedMessages} 
               currentUserId={currentUserId} 
               onClose={() => setIsInfoOpen(false)} 
             />
           )}
        </div>
      </div>
    </div>
  );
}
