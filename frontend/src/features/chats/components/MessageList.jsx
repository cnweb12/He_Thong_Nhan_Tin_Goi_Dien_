import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUserId, loading, error, chat, typingUsers = [] }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, typingUsers]);

    return (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-slate-100 dark:bg-slate-900">
            <div className="max-w-3xl mx-auto space-y-2 pb-4">
                {loading && (
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">Đang tải tin nhắn...</div>
                )}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm">
                        {error}
                    </div>
                )}
                {!loading && !error && messages.length === 0 && (
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
                        Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên.
                    </div>
                )}
                {messages.map((m, idx) => (
                    <MessageBubble key={m.id || idx} m={m} isMine={m.from === currentUserId} chat={chat} />
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-end justify-start gap-2 pt-2">
                        <div className="w-7 h-7 rounded-full flex-shrink-0 bg-slate-300 flex items-center justify-center text-slate-700 text-[10px] font-semibold select-none">
                            {typingUsers[0]?.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <div className="bg-slate-200 dark:bg-[#182533] px-3.5 py-3 rounded-2xl rounded-bl-lg flex items-center gap-1.5 h-[36px]">
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[10px] text-slate-500 ml-1">
                                {typingUsers.map(u => u.displayName).join(', ')} đang gõ...
                            </span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}