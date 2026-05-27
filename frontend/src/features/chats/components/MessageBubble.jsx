import React from 'react';

export default function MessageBubble({ m, isMine }) {
    return (
        <div className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'} gap-3`}>
            {!isMine && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700 shrink-0">T</div>}

            <div className={`px-4 py-3 max-w-[74%] shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${isMine ? 'bg-slate-900 text-white rounded-[1.2rem] rounded-br-md' : 'bg-white text-slate-900 rounded-[1.2rem] rounded-bl-md border border-slate-100'}`}>
                <div className="text-sm leading-6 whitespace-pre-wrap break-words">{m.text}</div>
                <div className={`text-[11px] mt-1 ${isMine ? 'text-white/75' : 'text-slate-500'}`}>{m.time}</div>
            </div>

            {isMine && <div className="w-8 h-8" />}
        </div>
    );
}
