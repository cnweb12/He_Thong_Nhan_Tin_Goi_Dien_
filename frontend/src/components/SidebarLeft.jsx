import React from 'react';
import { Bell, CircleUserRound, Clock3, LayoutGrid, MessageCircle, Settings, UserRound } from 'lucide-react';

const sidebarItems = [
    { id: 'chat', icon: MessageCircle, label: 'Tin nhắn' },
    { id: 'contacts', icon: UserRound, label: 'Danh bạ' },
    { id: 'cloud', icon: LayoutGrid, label: 'Cloud' },
    { id: 'task', icon: Clock3, label: 'Công việc' },
];

export default function SidebarLeft({ active, onSelect }) {
    return (
        <div style={{ width: 84 }} className="flex-shrink-0">
            <div className="h-screen flex flex-col justify-between bg-[#0f172a] text-white px-3 py-5 shadow-[12px_0_40px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col items-center gap-4">
                    <button type="button" className="w-13 h-13 rounded-[1.3rem] bg-white/10 border border-white/10 flex items-center justify-center shadow-sm" aria-label="Tài khoản">
                        <CircleUserRound size={28} />
                    </button>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">Chat</div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    {sidebarItems.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={`w-11 h-11 rounded-[1rem] flex items-center justify-center transition duration-200 border ${active === item.id ? 'bg-white text-slate-900 border-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'} focus:outline-none`}
                            aria-label={item.label}
                        >
                            <item.icon size={21} strokeWidth={active === item.id ? 2.4 : 2} />
                        </button>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-3">
                    <button type="button" className="w-11 h-11 rounded-[1rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 focus:outline-none" aria-label="Thông báo">
                        <Bell size={18} />
                    </button>
                    <button type="button" className="w-11 h-11 rounded-[1rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 focus:outline-none" aria-label="Cài đặt">
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
