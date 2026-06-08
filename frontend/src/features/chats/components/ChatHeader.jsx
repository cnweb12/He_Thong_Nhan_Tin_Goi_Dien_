import React from 'react';
import { ArrowLeft, Info, MoreVertical, Phone, Search, Video } from 'lucide-react';

export default function ChatHeader({ chat, onToggleInfo, onBack }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Chọn hội thoại';
    const avatarUrl = chat?.displayAvatarUrl || chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';

    return (
        <div className="h-[68px] flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
                <button 
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 sm:hidden text-slate-600"
                >
                    <ArrowLeft size={20} />
                </button>
                
                <div className="relative">
                    <img 
                        src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&rounded=true&font-size=0.45`}
                        alt={title}
                        className="w-10 h-10 rounded-full object-cover bg-slate-200"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <div>
                    <div className="font-semibold text-slate-800 text-sm">{title}</div>
                    <div className="text-xs text-slate-500">
                        Đang hoạt động
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
                <button className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer" title="Gọi thoại">
                    <Phone size={20} />
                </button>
                <button className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer" title="Gọi video">
                    <Video size={20} />
                </button>
                <button 
                    onClick={onToggleInfo} 
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Thông tin hội thoại"
                >
                    <Info size={20} />
                </button>
            </div>
        </div>
    );
}