import React from 'react';
import { Bell, CircleUserRound, Clock3, LayoutGrid, MessageCircle, Settings, UserRound, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';

const sidebarItems = [
    { id: 'chat', icon: MessageCircle, label: 'Tin nhắn' },
    { id: 'contacts', icon: UserRound, label: 'Danh bạ' },
    { id: 'cloud', icon: LayoutGrid, label: 'Cloud' },
    { id: 'task', icon: Clock3, label: 'Công việc' },
];

export default function SidebarLeft({ active, onSelect, isChatListOpen, setIsChatListOpen }) {
    const { logout } = useAuth();

    return (
        <div className="h-full flex-shrink-0 relative z-50 w-[84px]">
            <div className="h-full flex flex-col justify-between bg-[#0f172a] text-white px-3 py-5 shadow-[12px_0_40px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col items-center gap-4">
                    {/* Nút Toggle ẩn/hiện danh sách ở trên cùng */}
                    {setIsChatListOpen && (
                        <button
                            type="button"
                            onClick={() => setIsChatListOpen(!isChatListOpen)}
                            className="w-11 h-11 rounded-[1rem] bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors shadow-sm focus:outline-none mb-2 cursor-pointer"
                            aria-label={isChatListOpen ? 'Đóng danh sách' : 'Mở danh sách'}
                        >
                            {isChatListOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                    )}

                    <button type="button" className="w-13 h-13 rounded-[1.3rem] bg-white/10 border border-white/10 flex items-center justify-center shadow-sm cursor-pointer" aria-label="Tài khoản">
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
                            className={`w-11 h-11 rounded-[1rem] flex items-center justify-center transition duration-200 border cursor-pointer ${active === item.id ? 'bg-white text-slate-900 border-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'} focus:outline-none`}
                            aria-label={item.label}
                        >
                            <item.icon size={21} strokeWidth={active === item.id ? 2.4 : 2} />
                        </button>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-3">
                    <button type="button" className="w-11 h-11 rounded-[1rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 focus:outline-none cursor-pointer" aria-label="Thông báo">
                        <Bell size={18} />
                    </button>
                    <button type="button" className="w-11 h-11 rounded-[1rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 focus:outline-none cursor-pointer" aria-label="Cài đặt">
                        <Settings size={18} />
                    </button>
                    {/* Nút Đăng xuất gọn gàng trong action bar */}
                    <button 
                        type="button" 
                        onClick={logout}
                        className="w-11 h-11 rounded-[1rem] bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-300 transition-colors focus:outline-none mt-2 cursor-pointer" 
                        aria-label="Đăng xuất"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
