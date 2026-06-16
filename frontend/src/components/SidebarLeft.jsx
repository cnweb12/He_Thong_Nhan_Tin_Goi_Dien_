import React from 'react';
import {
    Bell, CircleUserRound, Clock3, LayoutGrid,
    MessageCircle, Settings, UserRound, LogOut,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

const NAV_ITEMS = [
    { id: 'chat',     icon: MessageCircle, label: 'Tin nhắn' },
    { id: 'contacts', icon: UserRound,     label: 'Danh bạ'  },
    { id: 'cloud',    icon: LayoutGrid,    label: 'Cloud'     },
    { id: 'task',     icon: Clock3,        label: 'Công việc' },
];

/**
 * SidebarLeft — cột icon dọc bên trái.
 *
 * Props:
 *  - active            : id mục đang active ('chat' | 'contacts' | ...)
 *  - onSelect          : callback khi bấm mục nav, nhận id
 *  - isChatListOpen    : boolean — danh sách chat đang mở hay đóng
 *  - setIsChatListOpen : setter để toggle
 */
export default function SidebarLeft({ active, onSelect, isChatListOpen, setIsChatListOpen }) {
    const { logout, user } = useAuth();
    const avatarUrl = user?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.name || 'U')}&background=0D8ABC&color=fff&rounded=true&font-size=0.45`;

    const navigate   = useNavigate();

    const handleSelect = (id) => {
        if (typeof onSelect === 'function') {
            onSelect(id);
        } else {
            navigate('/');
        }
    };

    return (
        <aside
            className="h-full flex-shrink-0 relative z-50 w-[84px]"
            aria-label="Thanh điều hướng"
        >
            <div className="h-full flex flex-col justify-between bg-[#0f172a] text-white px-3 py-5 shadow-[12px_0_40px_rgba(15,23,42,0.18)]">

                {/* ── Phần trên: toggle + avatar ── */}
                <div className="flex flex-col items-center gap-4">

                    {/* Avatar / Tài khoản */}
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        aria-label="Tài khoản"
                        className={[
                            // Thêm overflow-hidden và p-[2px] để ảnh nằm gọn bên trong viền bo góc
                            'h-12 w-12 rounded-[1.3rem] border flex items-center justify-center shadow-sm cursor-pointer transition-colors overflow-hidden p-[2px]',
                            active === 'account'
                                ? 'bg-white border-white'
                                : 'bg-white/10 border-white/10 hover:bg-white/20',
                        ].join(' ')}
                    >
                        <img
                            src={avatarUrl}
                            alt={user?.displayName || 'Avatar'}
                            className="w-full h-full object-cover rounded-[1rem] bg-slate-800"
                        />
                    </button>

                    <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">
                        Chat
                    </span>
                </div>

                {/* ── Phần giữa: nav items ── */}
                <nav className="flex flex-col items-center gap-2">
                    {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                        <button
                            type="button"
                            key={id}
                            onClick={() => handleSelect(id)}
                            aria-label={label}
                            aria-current={active === id ? 'page' : undefined}
                            className={[
                                'w-11 h-11 rounded-[1rem] flex items-center justify-center transition duration-200 border cursor-pointer focus:outline-none',
                                active === id
                                    ? 'bg-white text-slate-900 border-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
                            ].join(' ')}
                        >
                            <Icon size={21} strokeWidth={active === id ? 2.4 : 2} />
                        </button>
                    ))}
                </nav>

                {/* ── Phần dưới: bell, settings, logout ── */}
                <div className="flex flex-col items-center gap-3">

                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        aria-label="Cài đặt"
                        className="w-11 h-11 rounded-[1rem] bg-white/5 border border-white/10
                                   flex items-center justify-center
                                   hover:bg-white/10 hover:border-white/20 focus:outline-none cursor-pointer"
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={logout}
                        aria-label="Đăng xuất"
                        className="w-11 h-11 rounded-[1rem] bg-red-500/10 border border-red-500/20
                                   text-red-400 flex items-center justify-center mt-2
                                   hover:bg-red-500/20 hover:text-red-300 transition-colors
                                   focus:outline-none cursor-pointer"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

            </div>
        </aside>
    );
}