import React from 'react';

export default function ChatHeader({ chat }) {
    return (
        <div className="h-[70px] flex items-center justify-between px-4 border-b bg-white">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg"></div>
                <div>
                    <div className="font-semibold text-gray-900 text-sm">{chat?.name || 'Chọn hội thoại'}</div>
                    <div className="text-xs text-gray-500">Đã online</div>
                </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
                <button className="p-2 rounded hover:bg-gray-100">🔍</button>
                <button className="p-2 rounded hover:bg-gray-100">📞</button>
                <button className="p-2 rounded hover:bg-gray-100">🎥</button>
                <button className="p-2 rounded hover:bg-gray-100">ℹ️</button>
            </div>
        </div>
    );
}