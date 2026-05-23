import React, { useState } from 'react';

export default function MessageInput({ onSend }) {
    const [text, setText] = useState('');

    const send = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
    };

    return (
        <div className="p-3 border-t bg-white flex items-center gap-3">
            <div className="flex items-center gap-2 text-xl text-gray-600">
                <button className="p-2">😊</button>
                <button className="p-2">🖼️</button>
                <button className="p-2">📎</button>
            </div>

            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 px-4 py-2 rounded-full border bg-white/90" />
            <button onClick={send} className="w-10 h-10 rounded-full bg-[#0068ff] flex items-center justify-center text-white">➤</button>
        </div>
    );
}
