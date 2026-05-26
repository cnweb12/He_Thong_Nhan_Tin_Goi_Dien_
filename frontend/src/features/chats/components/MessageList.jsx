import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUserId, loading, error }) {
    return (
        <div className="flex-1 overflow-y-auto p-6 bg-[linear-gradient(180deg,_rgba(255,255,255,0.45),_rgba(247,250,252,1))]">
            <div className="max-w-3xl mx-auto space-y-3">
                {loading && (
                    <div className="text-center text-sm text-slate-500 py-6">Đang tải tin nhắn...</div>
                )}
                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
