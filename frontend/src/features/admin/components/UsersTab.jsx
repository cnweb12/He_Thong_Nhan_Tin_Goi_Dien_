import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, lockUserAccount, unlockUserAccount, changeUserRole } from '../../../services/adminApi';
import UserTable from './UserTable';
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react';

const UsersTab = ({ accessToken, currentUserRole }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsersList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const responseData = await getUsers({
        page,
        limit,
        role: roleFilter,
        search: searchQuery,
        accessToken
      });
      setUsers(responseData.data?.users || []);
      setTotalPages(responseData.data?.pagination?.totalPages || 1);
      setTotalUsers(responseData.data?.pagination?.total || 0);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, searchQuery, accessToken]);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLockToggle = async (userId, isCurrentlyLocked) => {
    try {
      if (isCurrentlyLocked) {
        if (!window.confirm("Bạn có chắc muốn mở khóa người dùng này?")) return;
        await unlockUserAccount(userId, accessToken);
      } else {
        if (!window.confirm("Bạn có chắc muốn khóa người dùng này? Họ sẽ không thể đăng nhập.")) return;
        await lockUserAccount(userId, accessToken);
      }
      fetchUsersList();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển quyền người dùng này thành ${newRole}?`)) return;
    try {
      await changeUserRole(userId, newRole, accessToken);
      fetchUsersList();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý người dùng</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Danh sách, phân quyền và khóa tài khoản</p>
        </div>
        <button 
          onClick={fetchUsersList}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm self-start md:self-auto"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-[#17212b] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#1e2d3d] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo SĐT, tên..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#2b394a] bg-slate-50 dark:bg-[#0e1621] focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={18} className="text-slate-500 dark:text-slate-400" />
          <select 
            value={roleFilter}
            onChange={handleRoleChange}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#2b394a] bg-slate-50 dark:bg-[#0e1621] focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-[#17212b] rounded-xl shadow-sm border border-slate-200 dark:border-[#1e2d3d] overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-[#1e2d3d] bg-slate-50/50 dark:bg-[#0e1621]/50">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Tổng số: <span className="text-blue-600 dark:text-blue-400 font-bold">{totalUsers}</span>
              </span>
            </div>
            
            <UserTable 
              users={users} 
              loading={loading} 
              currentUserRole={currentUserRole}
              onLockToggle={handleLockToggle}
              onChangeRole={handleChangeRole}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-[#1e2d3d] flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Trang <span className="font-medium text-slate-900 dark:text-white">{page}</span> / <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                    className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#2b394a] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#2b394a]"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || loading}
                    className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#2b394a] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#2b394a]"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersTab;
