import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatArea({ chat, messages, currentUserId, loading, error, onSend }) {
    return (
        <div className="flex-1 flex flex-col bg-[#f7fbff]">
            <ChatHeader chat={chat} />
            <MessageList messages={messages} currentUserId={currentUserId} loading={loading} error={error} />
            <MessageInput onSend={onSend} />
        </div>
    );
}
