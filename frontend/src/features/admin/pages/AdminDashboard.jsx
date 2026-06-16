import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import AdminLayout from '../components/AdminLayout';
import UsersTab from '../components/UsersTab';

const AdminDashboard = () => {
  const { accessToken, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Kiểm tra quyền
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0e1621]">
        <div className="text-center p-8 bg-white dark:bg-[#17212b] rounded-xl shadow-sm border border-red-200 dark:border-red-900/30 max-w-md">
          <div className="inline-block p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Truy cập bị từ chối</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Bạn không có quyền truy cập vào khu vực Quản trị viên.</p>
          <button 
            onClick={logout}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm w-full"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab accessToken={accessToken} currentUserRole={user.role} />;
      case 'messages':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Quản lý tin nhắn</h2>
            <p>Tính năng đang trong giai đoạn phát triển (Phase 2).</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
