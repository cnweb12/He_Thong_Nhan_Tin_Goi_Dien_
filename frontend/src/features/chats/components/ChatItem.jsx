import React, { useState } from 'react';

/** Lấy id hội thoại từ nhiều shape khác nhau của API */
const resolveId = (c) => c?.conversationId || c?.id || c?._id || null;

/** Format giờ từ ISO string → "HH:MM" */
const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/** Cắt ngắn text nếu quá dài */
const truncate = (text, max = 35) =>
    text && text.length > max ? `${text.substring(0, max)}...` : text;

/** Lấy chữ cái đầu từ tên */
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/** Màu nền avatar từ tên */
function getAvatarColor(name) {
    const colors = [
        '#4f8ef7', '#f75c5c', '#f7a825', '#34c77b',
        '#a855f7', '#0ea5e9', '#ec4899', '#f97316',
    ];
    if (!name) return colors[0];
    const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[code % colors.length];
}

function AvatarCircle({ name, size = 'w-10 h-10' }) {
    const hasName = Boolean(name?.trim());

    if (hasName) {
        return (
            <span
                className={`${size} rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold select-none`}
                style={{ backgroundColor: getAvatarColor(name) }}
                title={name}
            >
                {getInitials(name)}
            </span>
        );
    }

    return (
        <span
            className={`${size} rounded-full flex-shrink-0 flex items-center justify-center bg-slate-300 text-slate-700 text-xs font-semibold select-none`}
            title="Người dùng"
        >
            ?
        </span>
    );
}

/**
 * ChatItem — một hàng hội thoại trong danh sách.
 *
 * Props:
 *  - chat   : object — dữ liệu hội thoại (từ ConversationProvider)
 *  - active : boolean — đang được chọn
 *  - onClick: (conversationId: string) => void
 */
export default function ChatItem({ chat, active, onClick }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Cuộc trò chuyện';
    const avatar = chat?.displayAvatarUrl || chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl;
    const convId = resolveId(chat);
    const time = chat?.lastActivityAt
        ? formatTime(chat.lastActivityAt)
        : (chat?.time || '');

    const lastMsg = truncate(chat?.lastMessage) || 'Chưa có tin nhắn';

    const unreadCount = chat?.unreadCount || chat?.unread || 0;
    const hasUnread = unreadCount > 0;

    const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&rounded=true&font-size=0.45`;

    return (
        <button
            type="button"
            onClick={() => onClick?.(convId)}
            className={[
                'w-full flex items-center gap-3 px-4 py-3 text-left',
                'transition-colors duration-150 cursor-pointer border-b border-slate-100',
                active ? 'bg-blue-50/80' : 'hover:bg-slate-100',
            ].join(' ')}
        >
            {/* ── Avatar ── */}
            <div className="relative shrink-0">
                <img
                    src={avatar || avatarFallback}
                    alt={title}
                    onError={(e) => { e.currentTarget.src = avatarFallback; }}
                    className="w-10 h-10 rounded-full object-cover bg-slate-200"
                />
                {/* Chấm online — hiển thị nếu peer có isOnline */}
                {peer.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
            </div>

            {/* ── Tên + tin nhắn cuối ── */}
            <div className="flex-1 min-w-0">
                <p className={[
                    'text-sm truncate',
                    hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700',
                ].join(' ')}>
                    {title}
                </p>
                <p className={[
                    'text-xs truncate mt-0.5',
                    hasUnread ? 'text-blue-600 font-semibold' : 'text-slate-500',
                ].join(' ')}>
                    {lastMsg}
                </p>
            </div>

            {/* ── Giờ + badge unread ── */}
            <div className="flex flex-col items-end self-start shrink-0 min-w-[40px]">
                <span className="text-[11px] text-slate-400">{time}</span>
                {hasUnread && (
                    <span className="mt-1.5 min-w-[20px] h-5 px-1 flex items-center justify-center
                                     rounded-full bg-blue-500 text-white text-[10px] font-bold shadow">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </div>
        </button>
    );
}