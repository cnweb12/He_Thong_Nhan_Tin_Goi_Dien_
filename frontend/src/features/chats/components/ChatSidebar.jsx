import React from 'react';
import SearchBar from './SearchBar';
import ChatItem from './ChatItem';

export default function ChatSidebar({ user, conversations, selectedId, onSelect }) {
    return (
        <div style={{ width: 360 }} className="flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg"></div>
                    <div>
                        <div className="font-semibold text-gray-900 text-sm">{user?.name || 'Khách'}</div>
                        <div className="text-xs text-gray-500">{user?.phone || ''}</div>
                    </div>
                </div>
            </div>

            <SearchBar />

            <div className="px-4">
                <div className="flex gap-2 mt-2 text-sm">
                    <button className="px-3 py-1 bg-gray-100 rounded-full text-sm">Ưu tiên</button>
                    <button className="px-3 py-1 text-gray-500 text-sm">Khác</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-2">
                {conversations.map((c) => (
                    <ChatItem key={c.id} chat={c} active={c.id === selectedId} onClick={onSelect} />
                ))}
            </div>
        </div>
    );
}
