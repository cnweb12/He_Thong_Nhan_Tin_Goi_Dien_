import React from 'react';

export default function ConversationInfo({ chat, messages, currentUserId }) {
    const peer = chat?.peer || {};
    const title = peer.displayName || chat?.name || 'Chưa chọn hội thoại';
    const unread = chat?.unread || 0;
    const totalMessages = messages?.length || 0;
    const myMessages = Array.isArray(messages) ? messages.filter((message) => message.from === currentUserId).length : 0;

    return (
        <div style={{ width: 320 }} className="flex-shrink-0 bg-white/80 backdrop-blur border-l border-white/60 p-4 overflow-y-auto">
            {chat ? (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg font-semibold text-slate-700"></div>
                        <div>
                            <div className="font-semibold text-gray-900">{title}</div>
                            <div className="text-sm text-gray-500">{peer.userId ? `@${peer.username || peer.userId}` : 'Mô tả nhóm hoặc thông tin'}</div>
                        </div>
                    </div>

                    <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                        <h4 className="font-medium mb-2 text-gray-800">Thông tin nhanh</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>Tin nhắn: {totalMessages}</div>
                            <div>Tin của tôi: {myMessages}</div>
                            <div>Chưa đọc: {unread}</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2 text-gray-800">Tệp đính kèm</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="h-20 bg-slate-200 rounded-2xl" />
                            <div className="h-20 bg-slate-200 rounded-2xl" />
                            <div className="h-20 bg-slate-200 rounded-2xl" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-gray-500">Chưa chọn hội thoại</div>
            )}
        </div>
    );
}
