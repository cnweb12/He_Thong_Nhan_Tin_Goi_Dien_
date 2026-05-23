import React from 'react';

export default function ChatItem({ chat, active, onClick }) {
    return (
        <button onClick={() => onClick(chat.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${active ? 'bg-[#eaf2ff]' : ''}`}>
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm"></div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-900 text-sm">{chat.name}</div>
                    <div className="text-xs text-gray-400">{chat.time}</div>
                </div>
                <div className="text-sm text-gray-500 truncate mt-1">{chat.lastMessage}</div>
            </div>
            {chat.unread > 0 && <div className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{chat.unread}</div>}
        </button>
    );
}
