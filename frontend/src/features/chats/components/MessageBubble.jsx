import React from 'react';

export default function MessageBubble({ m, isMine }) {
    return (
        <div className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'}`}>
            {!isMine && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3 text-sm font-semibold text-slate-600">T</div>}

            <div className={`px-4 py-3 max-w-[70%] shadow-sm ${isMine ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-2xl rounded-br-sm' : 'bg-white text-slate-900 rounded-2xl rounded-bl-sm border border-slate-100'}`}>
                <div className="text-sm leading-6 whitespace-pre-wrap break-words">{m.text}</div>
                <div className={`text-[11px] mt-1 ${isMine ? 'text-white/80' : 'text-slate-500'}`}>{m.time}</div>
            </div>

            {isMine && <div className="w-8 h-8 ml-3" />}
        </div>
    );
}
