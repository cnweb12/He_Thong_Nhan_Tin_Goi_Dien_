import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatArea({ chat, messages, currentUserId, onSend }) {
    return (
        <div className="flex-1 flex flex-col">
            <ChatHeader chat={chat} />
            <MessageList messages={messages} currentUserId={currentUserId} />
            <MessageInput onSend={onSend} />
        </div>
    );
}
