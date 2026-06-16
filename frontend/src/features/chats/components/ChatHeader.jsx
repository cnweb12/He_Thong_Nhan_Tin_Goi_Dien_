import React, { useState } from 'react';
import { ArrowLeft, Info, MoreVertical, Phone, Search, Video } from 'lucide-react';
import { useCall } from '../../calls/hooks/useCall';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());
const resolvePeerId = (peer) => peer?._id || peer?.id || peer?.userId || null;

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

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

export default function ChatHeader({ chat, onToggleInfo, onBack }) {
    const { makeCall } = useCall();
    const conversationId = chat?._id || chat?.id || chat?.conversationId;

    // Determine peer object: prefer explicit `chat.peer`, otherwise if `chat` looks
    // like a user object (no members/participants) use `chat` as peer.
    const inferredPeer = chat?.peer || chat?.participant || ((chat && !chat.members && !chat.participants && (chat.displayName || chat.name || chat.phone || chat.username)) ? chat : null);
    const peer = inferredPeer || {};

    const title = chat?.displayName || peer.displayName || chat?.name || 'Chọn hội thoại';
    const subtitle = (chat?.phone || (isPhoneLike(chat?.username) ? chat.username : ''))
        || (peer?.phone || (isPhoneLike(peer?.username) ? peer.username : '')) || '';
    const avatarUrl = chat?.displayAvatarUrl || chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';
    const peerId = resolvePeerId(peer);

    const handleCallClick = (type = 'audio') => {
        if (peerId && conversationId) {
            makeCall(peer, conversationId, type);
        } else {
            console.warn('[ChatHeader] Cannot initiate call: missing peer info or conversation ID', chat);
        }
    };

    return (
        <div className="h-[68px] flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#1e2d3d] bg-white dark:bg-[#17212b]">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1c2b38] sm:hidden text-slate-600 dark:text-slate-300">
                    <ArrowLeft size={20} />
                </button>

                <div className="relative">
                    <img
                        src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&rounded=true&font-size=0.45`}
                        alt={title}
                        className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                    />
                    {peer.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#17212b] rounded-full" />
                    )}
                </div>

                <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {peer.isOnline
                            ? 'Đang hoạt động'
                            : peer.lastActiveAt
                                ? `Hoạt động ${formatRelativeTime(peer.lastActiveAt)}`
                                : null}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <button onClick={() => handleCallClick('audio')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1c2b38] transition-colors cursor-pointer text-emerald-600 dark:text-emerald-400" title="Gọi thoại">
                    <Phone size={20} />
                </button>
                <button onClick={() => handleCallClick('video')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1c2b38] transition-colors cursor-pointer text-blue-600 dark:text-blue-400" title="Gọi video">
                    <Video size={20} />
                </button>
                <button
                    onClick={onToggleInfo}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1c2b38] transition-colors cursor-pointer"
                    title="Thông tin hội thoại"
                >
                    <Info size={20} />
                </button>
            </div>
        </div>
    );
}