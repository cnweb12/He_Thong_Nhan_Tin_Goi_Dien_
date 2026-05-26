import React, { useState } from 'react';
import { Paperclip, Send, Smile } from 'lucide-react';

export default function MessageInput({ onSend }) {
    const [text, setText] = useState('');

    const send = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    };

    return (
        <div className="p-3 border-t border-white/70 bg-white/90 backdrop-blur flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-600">
                <button className="p-2 rounded-xl hover:bg-slate-100"><Smile size={18} /></button>
                <button className="p-2 rounded-xl hover:bg-slate-100"><Paperclip size={18} /></button>
            </div>

            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <button
                onClick={send}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-md hover:shadow-lg transition"
            >
                <Send size={18} />
            </button>
        </div>
    );
}
