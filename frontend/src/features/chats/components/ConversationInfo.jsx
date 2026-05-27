import React from 'react';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

export default function ConversationInfo({ chat, messages, currentUserId }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Chưa chọn hội thoại';
    const subtitle = chat?.phone || (isPhoneLike(chat?.username) ? chat.username : '')
        || peer.phone || (isPhoneLike(peer.username) ? peer.username : '');
    const avatarUrl = chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';
    const unread = chat?.unread || 0;
    const totalMessages = messages?.length || 0;
    const myMessages = Array.isArray(messages) ? messages.filter((message) => message.from === currentUserId).length : 0;

    return (
        <div style={{ width: 320 }} className="flex-shrink-0 bg-white/90 backdrop-blur border-l border-slate-200 p-4 overflow-y-auto">
            {chat ? (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        {avatarUrl ? (
                            <img src={avatarUrl} className="w-16 h-16 rounded-[1.4rem] object-cover bg-slate-200 shadow-sm ring-1 ring-slate-200" alt={title} />
                        ) : (
                            <div className="w-16 h-16 rounded-[1.4rem] bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                                {(title || 'C').slice(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="font-semibold text-slate-900">{title}</div>
                            <div className="text-sm text-slate-500">{subtitle || 'Mô tả nhóm hoặc thông tin'}</div>
                        </div>
                    </div>

                    <div className="mb-4 bg-white border border-slate-200 p-3 rounded-[1.25rem] shadow-sm">
                        <h4 className="font-semibold mb-2 text-slate-800">Thông tin nhanh</h4>
                        <div className="text-sm text-slate-600 space-y-1.5">
                            <div>Tin nhắn: {totalMessages}</div>
                            <div>Tin của tôi: {myMessages}</div>
                            <div>Chưa đọc: {unread}</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2 text-slate-800">Tệp đính kèm</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="h-20 bg-slate-100 rounded-[1rem]" />
                            <div className="h-20 bg-slate-50 border border-slate-200 rounded-[1rem]" />
                            <div className="h-20 bg-slate-100 rounded-[1rem]" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-slate-500">Chưa chọn hội thoại</div>
            )}
        </div>
    );
}
