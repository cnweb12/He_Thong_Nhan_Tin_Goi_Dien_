import React from 'react';
import { MessageCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { EmptyState, MessageBubbleSkeleton } from '../../../components/ui';

export default function MessageList({ messages, currentUserId, loading, error }) {
    return (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-slate-100">
            <div className="max-w-3xl mx-auto space-y-2 pb-4">
                {loading && <MessageBubbleSkeleton count={5} />}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm">
                        {error}
                    </div>
                )}
                {!loading && !error && messages.length === 0 && (
                    <EmptyState
                        icon={MessageCircle}
                        title="Chưa có tin nhắn"
                        description="Hãy gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện."
                    />
                )}
                {!loading && messages.map((m, idx) => (
                    <MessageBubble key={m.id || idx} m={m} isMine={m.from === currentUserId} />
                ))}
            </div>
        </div>
    );
}
