import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUserId }) {
    return (
        <div className="flex-1 overflow-y-auto p-6 bg-[#f7fafc]">
            <div className="max-w-3xl mx-auto">
                {messages.map((m, idx) => (
                    <MessageBubble key={idx} m={m} isMine={m.from === currentUserId} />
                ))}
            </div>
        </div>
    );
}
