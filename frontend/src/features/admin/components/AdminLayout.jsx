import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

const NAV_ITEMS = [
  { to: '/admin/users', label: 'Người dùng', icon: '👤' },
  { to: '/admin/messages', label: 'Tin nhắn', icon: '💬' },
  { to: '/admin/settings', label: 'Cài đặt hệ thống', icon: '⚙️' },
  { to: '/admin/keywords', label: 'Từ khóa cấm', icon: '🚫' },
];

export default function AdminLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-2xl px-6 py-4 shadow border border-slate-200 text-slate-700">
          Đang tải...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role || 'user';
  if (role !== 'admin' && role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen flex bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-lg font-semibold">Bảng quản trị</p>
          <p className="text-xs text-slate-400 mt-1">
            {user?.displayName || user?.phone} · {role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-base">←</span>
            Về trang chat
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
          >
            <span className="text-base">⏻</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
