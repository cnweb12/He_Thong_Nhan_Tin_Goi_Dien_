import React from 'react';
import { Users, MessageSquare, Settings, ShieldBan, LogOut } from 'lucide-react';

const AdminLayout = ({ activeTab, onTabChange, onLogout, children }) => {
  const tabs = [
    { id: 'users', label: 'Quản lý người dùng', icon: Users },
    { id: 'messages', label: 'Quản lý tin nhắn', icon: MessageSquare },
  ];

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-[#0e1621] flex text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#17212b] border-r border-slate-200 dark:border-[#1e2d3d] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200 dark:border-[#1e2d3d]">
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-500">Admin Panel</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">System Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1e2d3d]'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-[#1e2d3d]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-6 md:p-8 overflow-y-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
