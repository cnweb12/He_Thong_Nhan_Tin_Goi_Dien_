import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUserId, loading, error }) {
    // Đặt console.log ở đây để kiểm tra chính xác cấu trúc của các tin nhắn
    console.log("Danh sách tin nhắn (kiểm tra cấu trúc m):", messages);

    return (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-slate-100">
            <div className="max-w-3xl mx-auto space-y-2 pb-4">
                {loading && (
                    <div className="text-center text-sm text-slate-500 py-6">Đang tải tin nhắn...</div>
                )}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm">
                        {error}
                    </div>
                )}
                {!loading && !error && messages.length === 0 && (
                    <div className="text-center text-sm text-slate-500 py-6">
                        Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên.
                    </div>
                )}
                {messages.map((m, idx) => (
                    <MessageBubble key={m.id || idx} m={m} isMine={m.from === currentUserId} />
                ))}
            </div>
        </div>
    );
}
