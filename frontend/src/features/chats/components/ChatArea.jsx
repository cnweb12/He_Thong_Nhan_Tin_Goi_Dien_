import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatArea({ chat, messages, currentUserId, loading, error, onSend, sending, onToggleInfo, onBack, typingUsers }) {
    return (
        <div className="flex-1 flex flex-col bg-[#f7fbff] dark:bg-[#0e1621] overflow-hidden min-h-0">
            <ChatHeader chat={chat} onToggleInfo={onToggleInfo} onBack={onBack} />
            <MessageList messages={messages} currentUserId={currentUserId} chat={chat} loading={loading} error={error} typingUsers={typingUsers} />
            <MessageInput onSend={onSend} disabled={!chat} sending={sending} chatId={chat?.id || chat?._id || chat?.conversationId} />
        </div>
    );
}
