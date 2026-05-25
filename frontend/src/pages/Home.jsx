import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import SidebarLeft from '../components/SidebarLeft';
import ChatSidebar from '../features/chats/components/ChatSidebar';
import ChatArea from '../features/chats/components/ChatArea';
import ConversationInfo from '../features/chats/components/ConversationInfo';
import LogoutButton from '../features/auth/components/LogoutButton';
import { useAppSocket } from '../features/realtime/hooks/useAppSocket';
import { useConversations } from '../features/conversations/hooks/useConversations';

export default function Home() {
  const { user, accessToken, fetchCurrentUser } = useAuth();
  const { isConnected, isConnecting, error: socketError } = useAppSocket();
  const { conversations, setConversations, fetchInbox, loading: inboxLoading, error: inboxError } = useConversations();
  const [sidebarView, setSidebarView] = useState('chat');
  const [selectedId, setSelectedId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [initialError, setInitialError] = useState(null);

  const currentUserId = 1;

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
      setSelectedId(conversations[0].id);
    }
  }, [selectedId, conversations]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  const handleSend = (text) => {
    if (!selected) return;
    const newMsg = { from: currentUserId, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, messages: [...c.messages, newMsg], lastMessage: text } : c));
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
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 text-center shadow-sm max-w-md">
          <p className="text-red-600 font-medium mb-2">Không thể tải dữ liệu khởi tạo</p>
          <p className="text-sm text-gray-600 mb-4">{inboxError || initialError}</p>
          <button
            type="button"
            onClick={() => {
              setInitialError(null);
              setIsBootstrapped(false);
              setInitialLoading(true);
            }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
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
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 text-center shadow-sm">
          <p className="text-gray-700 font-medium mb-2">Đang tải dữ liệu...</p>
          <p className="text-sm text-gray-500">Đồng bộ hồ sơ cá nhân và inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
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
        <ChatSidebar user={user} conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
      ) : (
        <div style={{ width: 360 }} className="flex-shrink-0 bg-white border-r border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-3">{viewTitle}</div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Nội dung {viewTitle} đang hiển thị ở đây.
          </div>
        </div>
      )}

      {sidebarView === 'chat' ? (
        <ChatArea chat={selected} messages={selected?.messages || []} currentUserId={currentUserId} onSend={handleSend} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] text-gray-600 text-base">
          Chuyển sang {viewTitle}
        </div>
      )}

      <ConversationInfo chat={selected} />
    </div>
  );
}

