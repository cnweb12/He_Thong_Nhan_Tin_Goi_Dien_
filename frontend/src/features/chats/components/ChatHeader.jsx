import React from 'react';
import { ArrowLeft, Info, MoreVertical, Phone, Search, Video } from 'lucide-react';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

export default function ChatHeader({ chat, onToggleInfo, onBack }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Chọn hội thoại';
    const subtitle = chat?.phone || (isPhoneLike(chat?.username) ? chat.username : '')
        || peer.phone || (isPhoneLike(peer.username) ? peer.username : '');
    const avatarUrl = chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';

    return (
        <div className="h-[76px] flex items-center justify-between px-5 border-b border-slate-200 bg-white/85 backdrop-blur shadow-[0_1px_0_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
                <button 
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 sm:hidden text-slate-600"
                >
                    <ArrowLeft size={20} />
                </button>
                {avatarUrl ? (
                    <img src={avatarUrl} className="w-11 h-11 rounded-[1.2rem] object-cover bg-slate-200 ring-1 ring-slate-200 shadow-sm" alt={title} />
                ) : (
                    <div className="w-11 h-11 rounded-[1.2rem] bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm">
                        {(title || 'C').slice(0, 1).toUpperCase()}
                    </div>
                )}
                <div>
                    <div className="font-semibold text-slate-900 text-sm">{title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        {subtitle || 'Chưa có số điện thoại'}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
                <button className="p-2.5 rounded-full hover:bg-slate-100 hidden sm:block cursor-pointer"><Search size={18} /></button>
                <button className="p-2.5 rounded-full hover:bg-slate-100 cursor-pointer"><Phone size={18} /></button>
                <button className="p-2.5 rounded-full hover:bg-slate-100 cursor-pointer"><Video size={18} /></button>
                <button 
                    onClick={onToggleInfo} 
                    className="p-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Thông tin hội thoại"
                >
                    <Info size={18} />
                </button>
                <button className="p-2.5 rounded-full hover:bg-slate-100 hidden sm:block cursor-pointer"><MoreVertical size={18} /></button>
            </div>
        </div>
    );
}