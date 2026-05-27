import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUserId, loading, error }) {
    return (
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(244,247,251,0.96))]">
            <div className="max-w-3xl mx-auto space-y-3 pb-8">
                {loading && (
                    <div className="text-center text-sm text-slate-500 py-6">Đang tải tin nhắn...</div>
                )}
                {error && (
                    <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
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
