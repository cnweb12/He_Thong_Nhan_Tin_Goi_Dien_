import React from 'react';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

export default function ChatItem({ chat, active, onClick }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Cuộc trò chuyện';
    const subtitle = chat?.phone || (isPhoneLike(chat?.username) ? chat.username : '')
        || peer.phone || (isPhoneLike(peer.username) ? peer.username : '');
    const avatarUrl = chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';
    const initials = (title || 'C').slice(0, 1).toUpperCase();
    const readLabel = chat?.unread > 0
        ? `${chat.unread} chưa đọc`
        : '';

    return (
        <button
            type="button"
            onClick={() => onClick(chat.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition border-l-4 ${active ? 'bg-slate-50 border-l-slate-900' : 'border-l-transparent hover:bg-slate-50'}`}
        >
            {avatarUrl ? (
                <img src={avatarUrl} className="w-12 h-12 rounded-[1.2rem] object-cover bg-slate-200 shadow-sm" alt={title} />
            ) : (
                <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 flex items-center justify-center text-slate-700 text-sm font-semibold shadow-sm">
                    {initials}
                </div>
            )}
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <div className="font-semibold text-slate-900 text-sm truncate pr-2">{title}</div>
                    <div className="text-[11px] text-slate-400 shrink-0">{chat.time}</div>
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</div>
                <div className="text-sm text-slate-600 truncate mt-1">{chat.lastMessage}</div>
                {readLabel && <div className="text-[11px] text-slate-400 mt-1">{readLabel}</div>}
            </div>
            {chat.unread > 0 && <div className="ml-2 bg-slate-900 text-white text-xs px-2.5 py-0.5 rounded-full shadow-sm">{chat.unread}</div>}
        </button>
    );
}
