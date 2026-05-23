import React, { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import SidebarLeft from '../components/SidebarLeft';
import ChatSidebar from '../features/chats/components/ChatSidebar';
import ChatArea from '../features/chats/components/ChatArea';
import ConversationInfo from '../features/chats/components/ConversationInfo';

const sampleConversations = [
  {
    id: 1,
    name: 'My Documents',
    lastMessage: 'Đã gửi tài liệu báo cáo.pdf',
    time: '14:17',
    unread: 2,
    messages: [
      { from: 2, text: 'Chào bạn, gửi file nhé', time: '14:10' },
      { from: 1, text: 'Cảm ơn, nhận được rồi', time: '14:17' },
    ],
  },
  {
    id: 2,
    name: 'HUST/IT DEV',
    lastMessage: 'Link form: https://...',
    time: '09:12',
    unread: 0,
    messages: [
      { from: 2, text: 'Reminder: deadline hôm nay', time: '09:00' },
    ],
  },
  {
    id: 3,
    name: 'Ba vì 23/5',
    lastMessage: 'Ok nhé',
    time: '07:29',
    unread: 0,
    messages: [{ from: 2, text: 'Gặp nhau lúc 7', time: '07:29' }],
  },
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarView, setSidebarView] = useState('chat');
  const [conversations, setConversations] = useState(sampleConversations);
  const [selectedId, setSelectedId] = useState(conversations[0]?.id || null);

  const currentUserId = 1;

  const selected = conversations.find((c) => c.id === selectedId) || null;

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

  return (
    <div className="h-screen flex overflow-hidden">
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

