import React from 'react';

export default function MessageBubble({ m, isMine }) {
    return (
        <div className={`mb-3 flex items-end ${isMine ? 'justify-end' : 'justify-start'}`}>
            {!isMine && <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3 text-sm">T</div>}

            <div className={`p-3 max-w-[65%] ${isMine ? 'bg-[#0068ff] text-white rounded-lg rounded-br-none' : 'bg-[#f3f4f6] text-gray-900 rounded-lg rounded-bl-none'}`}>
                <div className="text-sm leading-5">{m.text}</div>
                <div className={`text-xs mt-1 ${isMine ? 'text-white/80' : 'text-gray-500'}`}>{m.time}</div>
            </div>

            {isMine && <div className="w-8 h-8 ml-3" />}
        </div>
    );
}
