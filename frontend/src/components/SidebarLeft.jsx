import React from 'react';
import {
    Clock3, LayoutGrid,
    MessageCircle, Settings, UserRound, LogOut, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import Avatar from './Avatar';

const NAV_ITEMS = [
    { id: 'chat', icon: MessageCircle, label: 'Tin nhắn' },
    { id: 'contacts', icon: UserRound, label: 'Danh bạ' },
    { id: 'cloud', icon: LayoutGrid, label: 'Cloud' },
    { id: 'task', icon: Clock3, label: 'Công việc' },
];

/**
 * SidebarLeft — cột icon dọc bên trái (desktop) / thanh ngang cuối màn hình (mobile).
 *
 * Props:
 *  - active            : id mục đang active ('chat' | 'contacts' | ...)
 *  - onSelect          : callback khi bấm mục nav, nhận id
 *  - isChatListOpen    : boolean — danh sách chat đang mở hay đóng
 *  - setIsChatListOpen : setter để toggle
 */
export default function SidebarLeft({ active, onSelect, isChatListOpen, setIsChatListOpen, hasUnreadChat, hasPendingRequests }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleSelect = (id) => {
        if (typeof onSelect === 'function') {
            onSelect(id);
        } else {
            navigate('/');
        }
    };

    return (
        <>
            {/* ════════════════════════════════════════
                DESKTOP — cột dọc bên trái (md+)
            ════════════════════════════════════════ */}
            <aside
                className="hidden md:flex h-full flex-shrink-0 relative z-50 w-[84px]"
                aria-label="Thanh điều hướng"
            >
                <div className="h-full w-full flex flex-col justify-between bg-[#0f172a] text-white px-3 py-5 shadow-[12px_0_40px_rgba(15,23,42,0.18)]">

                    {/* Phần trên: avatar */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            aria-label="Tài khoản"
                            className={[
                                'h-12 w-12 rounded-[1.3rem] border flex items-center justify-center shadow-sm cursor-pointer transition-colors overflow-hidden p-[2px]',
                                active === 'account'
                                    ? 'bg-white border-white'
                                    : 'bg-white/10 border-white/10 hover:bg-white/20',
                            ].join(' ')}
                        >
                            <Avatar
                                src={user?.avatarUrl}
                                name={user?.displayName || user?.name || 'U'}
                                size="w-full h-full"
                                textClass="text-base font-bold"
                            />
                        </button>

                        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">
                            Chat
                        </span>
                    </div>

                    {/* Phần giữa: nav items */}
                    <nav className="flex flex-col items-center gap-2">
                        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
                            const hasBadge = (id === 'chat' && hasUnreadChat) || (id === 'contacts' && hasPendingRequests);
                            return (
                                <button
                                    type="button"
                                    key={id}
                                    onClick={() => handleSelect(id)}
                                    aria-label={label}
                                    aria-current={active === id ? 'page' : undefined}
                                    className={[
                                        'relative w-11 h-11 rounded-[1rem] flex items-center justify-center transition duration-200 border cursor-pointer focus:outline-none',
                                        active === id
                                            ? 'bg-white text-slate-900 border-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
                                    ].join(' ')}
                                >
                                    <Icon size={21} strokeWidth={active === id ? 2.4 : 2} />
                                    {hasBadge && (
                                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0f172a] rounded-full translate-x-1 -translate-y-1" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Phần dưới: settings, logout */}
                    <div className="flex flex-col items-center gap-3">
                        {user?.role === 'super_admin' && (
                            <button
                                type="button"
                                onClick={() => navigate('/admin')}
                                aria-label="Admin Dashboard"
                                className="w-11 h-11 rounded-[1rem] bg-blue-500/10 border border-blue-500/20
                                           text-blue-400 flex items-center justify-center
                                           hover:bg-blue-500/20 hover:text-blue-300 transition-colors
                                           focus:outline-none cursor-pointer"
                            >
                                <Shield size={18} />
                            </button>
                        )}

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

            {/* ════════════════════════════════════════
                MOBILE — thanh ngang cuối màn hình (< md)
            ════════════════════════════════════════ */}
            <nav
                className={[
                    'md:hidden fixed bottom-0 left-0 right-0 z-50',
                    'bg-[#0f172a] text-white px-2 py-2',
                    'shadow-[0_-4px_24px_rgba(15,23,42,0.25)] border-t border-white/10',
                    active === 'chat' && !isChatListOpen ? 'hidden' : 'flex items-center justify-around'
                ].join(' ')}
                aria-label="Thanh điều hướng"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
            >
                {/* Nav items */}
                {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
                    const hasBadge = (id === 'chat' && hasUnreadChat) || (id === 'contacts' && hasPendingRequests);
                    return (
                        <button
                            type="button"
                            key={id}
                            onClick={() => handleSelect(id)}
                            aria-label={label}
                            aria-current={active === id ? 'page' : undefined}
                            className="flex flex-col items-center gap-1 flex-1 py-1 focus:outline-none relative"
                        >
                            <span
                                className={[
                                    'relative w-10 h-10 rounded-[0.9rem] flex items-center justify-center transition duration-200 border',
                                    active === id
                                        ? 'bg-white text-slate-900 border-white shadow-[0_4px_16px_rgba(15,23,42,0.3)]'
                                        : 'bg-white/5 border-white/10',
                                ].join(' ')}
                            >
                                <Icon size={20} strokeWidth={active === id ? 2.4 : 2} />
                                {hasBadge && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#0f172a] rounded-full translate-x-1 -translate-y-1" />
                                )}
                            </span>
                            <span
                                className={[
                                    'text-[10px] font-medium leading-none',
                                    active === id ? 'text-white' : 'text-white/50',
                                ].join(' ')}
                            >
                                {label}
                            </span>
                        </button>
                    );
                })}

                {/* Divider */}
                <div className="w-px h-8 bg-white/10 mx-1" />

                {/* Settings */}
                <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    aria-label="Cài đặt"
                    className="flex flex-col items-center gap-1 flex-1 py-1 focus:outline-none"
                >
                    <span className="w-10 h-10 rounded-[0.9rem] bg-white/5 border border-white/10 flex items-center justify-center">
                        <Settings size={18} />
                    </span>
                    <span className="text-[10px] font-medium leading-none text-white/50">Cài đặt</span>
                </button>

                {/* Admin Dashboard */}
                {user?.role === 'super_admin' && (
                    <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        aria-label="Admin"
                        className="flex flex-col items-center gap-1 flex-1 py-1 focus:outline-none"
                    >
                        <span className="w-10 h-10 rounded-[0.9rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Shield size={18} />
                        </span>
                        <span className="text-[10px] font-medium leading-none text-blue-400/80">Admin</span>
                    </button>
                )}

                {/* Avatar / Profile */}
                <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    aria-label="Tài khoản"
                    className="flex flex-col items-center gap-1 flex-1 py-1 focus:outline-none"
                >
                    <span className="w-10 h-10 rounded-[0.9rem] overflow-hidden border border-white/20 flex items-center justify-center">
                        <Avatar
                            src={user?.avatarUrl}
                            name={user?.displayName || user?.name || 'U'}
                            size="w-full h-full"
                            textClass="text-sm font-bold"
                        />
                    </span>
                    <span className="text-[10px] font-medium leading-none text-white/50">Tôi</span>
                </button>
            </nav>
        </>
    );
}
