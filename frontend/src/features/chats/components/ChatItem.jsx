import React from 'react';
import { Avatar, Badge, cn } from '../../../components/ui';

const resolveId = (c) => c?.conversationId || c?.id || c?._id || null;
const formatTime = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatItem({ chat, active, onClick }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Cuộc trò chuyện';
    const avatarUrl = chat?.displayAvatarUrl || chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl;
    const conversationId = resolveId(chat);
    const time = chat?.lastActivityAt ? formatTime(chat.lastActivityAt) : (chat.time || '');

    const lastMessageText = chat?.lastMessage ? (
        chat.lastMessage.length > 30
            ? `${chat.lastMessage.substring(0, 30)}...`
            : chat.lastMessage
    ) : 'Chưa có tin nhắn';

    const unreadCount = chat?.unreadCount || chat?.unread || 0;
    const isUnread = unreadCount > 0;

    return (
        <button
            type="button"
            onClick={() => onClick(conversationId)}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 cursor-pointer border-b border-slate-100',
                active ? 'bg-slate-200/70' : 'hover:bg-slate-100',
            )}
        >
            <Avatar src={avatarUrl} name={title} alt={title} size="md" />

            <div className="flex-1 min-w-0">
                <div className={cn('font-semibold text-sm truncate', isUnread ? 'text-slate-800' : 'text-slate-700')}>
                    {title}
                </div>
                <div className={cn('text-xs truncate mt-1', isUnread ? 'text-blue-600 font-semibold' : 'text-slate-500')}>
                    {lastMessageText}
                </div>
            </div>

            <div className="flex flex-col items-end self-start shrink-0 w-14">
                <div className="text-[11px] text-slate-400 mb-1">{time}</div>
                {isUnread && (
                    <Badge tone="primary" size="sm" className="mt-1 shadow-md">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </div>
        </button>
    );
}
