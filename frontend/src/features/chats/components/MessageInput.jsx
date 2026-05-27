import React, { useState } from 'react';
import { Paperclip, Send, Smile } from 'lucide-react';

export default function MessageInput({ onSend, disabled = false, sending = false }) {
    const [text, setText] = useState('');

    const send = async () => {
        const message = text.trim();
        if (!message || disabled || sending) return;

        try {
            await onSend(message);
            setText('');
        } catch {
            // Keep the draft so the user can retry after a backend error.
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    };

    return (
        <div className="p-4 border-t border-slate-200 bg-white/90 backdrop-blur flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-600">
                <button className="p-2.5 rounded-full hover:bg-slate-100"><Smile size={18} /></button>
                <button className="p-2.5 rounded-full hover:bg-slate-100"><Paperclip size={18} /></button>
            </div>

            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-3.5 rounded-[1.2rem] border border-slate-200 bg-slate-50 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
            />
            <button
                onClick={send}
                disabled={disabled || sending}
                className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-[0_14px_28px_rgba(15,23,42,0.20)] hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send size={18} />
            </button>
        </div>
    );
}
