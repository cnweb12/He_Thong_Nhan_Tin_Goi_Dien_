import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatArea({ chat, messages, currentUserId, loading, error, onSend, sending, onToggleInfo, onBack, onClearHistory, onRecallMessage }) {
    return (
        <div className="flex-1 flex flex-col bg-[#f7fbff] overflow-hidden min-h-0">
            <ChatHeader chat={chat} onToggleInfo={onToggleInfo} onBack={onBack} onClearHistory={onClearHistory} />
            <MessageList messages={messages} currentUserId={currentUserId} loading={loading} error={error} onRecallMessage={onRecallMessage} />
            <MessageInput onSend={onSend} disabled={!chat} sending={sending} />
        </div>
    );
}
