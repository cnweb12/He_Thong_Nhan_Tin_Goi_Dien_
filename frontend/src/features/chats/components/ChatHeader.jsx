import React from 'react';
import { Info, MoreVertical, Phone, Search, Video } from 'lucide-react';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

export default function ChatHeader({ chat }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Chọn hội thoại';
    const subtitle = chat?.phone || (isPhoneLike(chat?.username) ? chat.username : '')
        || peer.phone || (isPhoneLike(peer.username) ? peer.username : '');
    const avatarUrl = chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';

    return (
        <div className="h-[72px] flex items-center justify-between px-4 border-b border-white/70 bg-white/85 backdrop-blur shadow-[0_1px_0_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
                {avatarUrl ? (
                    <img src={avatarUrl} className="w-11 h-11 rounded-2xl object-cover bg-slate-200" alt={title} />
                ) : (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg font-semibold text-slate-700">
                        {(title || 'C').slice(0, 1).toUpperCase()}
                    </div>
                )}
                <div>
                    <div className="font-semibold text-gray-900 text-sm">{title}</div>
                    <div className="text-xs text-gray-500">
                        {subtitle || 'Chưa có số điện thoại'}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 text-slate-600">
                <button className="p-2 rounded-xl hover:bg-slate-100"><Search size={18} /></button>
                <button className="p-2 rounded-xl hover:bg-slate-100"><Phone size={18} /></button>
                <button className="p-2 rounded-xl hover:bg-slate-100"><Video size={18} /></button>
                <button className="p-2 rounded-xl hover:bg-slate-100"><Info size={18} /></button>
                <button className="p-2 rounded-xl hover:bg-slate-100"><MoreVertical size={18} /></button>
            </div>
        </div>
    );
}