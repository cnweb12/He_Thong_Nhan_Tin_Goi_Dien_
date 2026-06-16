import React, { useState } from 'react';
import Avatar from '../../../components/Avatar';

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

    return (
        <button
            type="button"
            onClick={() => onClick?.(convId)}
            className={[
                'w-full flex items-center gap-3 px-4 py-3 text-left',
                'transition-colors duration-150 cursor-pointer border-b border-slate-100 dark:border-[#1e2d3d]/40',
                active ? 'bg-blue-50/80 dark:bg-[#2b5278]/30' : 'hover:bg-slate-100 dark:hover:bg-[#1c2b38]',
            ].join(' ')}
        >
            {/* ── Avatar ── */}
            <div className="relative shrink-0">
                <Avatar src={avatar} name={title} size="w-10 h-10" />
                {/* Chấm online — hiển thị nếu peer có isOnline */}
                {peer.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
            </div>

            {/* ── Tên + tin nhắn cuối ── */}
            <div className="flex-1 min-w-0">
                <p className={[
                    'text-sm truncate',
                    hasUnread ? 'font-bold text-slate-900 dark:text-slate-50' : 'font-semibold text-slate-700 dark:text-slate-200',
                ].join(' ')}>
                    {title}
                </p>
                <p className={[
                    'text-xs truncate mt-0.5',
                    hasUnread ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400',
                ].join(' ')}>
                    {lastMsg}
                </p>
            </div>

            {/* ── Giờ + badge unread ── */}
            <div className="flex flex-col items-end self-start shrink-0 min-w-[40px]">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{time}</span>
                {hasUnread && (
                    <span className="mt-1.5 min-w-[20px] h-5 px-1 flex items-center justify-center
                                     rounded-full bg-red-500 text-white text-[10px] font-bold shadow">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </div>
        </button>
    );
}