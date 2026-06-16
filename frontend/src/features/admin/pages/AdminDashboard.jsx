import React, { useState, useEffect, useCallback } from 'react';
import { getUsers } from '../../../services/adminApi';
import { useAuth } from '../../auth/hooks/useAuth';
import UserTable from '../components/UserTable';
import { Search, Filter, Loader2, RefreshCw, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { accessToken, logout } = useAuth();
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
  const [searchInput, setSearchInput] = useState(''); // for debouncing/manual submit

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
      setError(err.message || 'Error fetching users');
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
    setPage(1); // Reset to first page on new search
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0e1621] text-slate-900 dark:text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage users and system settings</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchUsersList}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg transition-colors shadow-sm"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-[#17212b] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#1e2d3d] flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by phone, username, or name..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#2b394a] bg-slate-50 dark:bg-[#0e1621] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
            />
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter size={18} className="text-slate-500 dark:text-slate-400" />
            <select 
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#2b394a] bg-slate-50 dark:bg-[#0e1621] focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-[#17212b] rounded-xl shadow-sm border border-slate-200 dark:border-[#1e2d3d] overflow-hidden">
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="inline-block p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Failed to load users</h3>
              <p className="text-slate-500 dark:text-slate-400">{error}</p>
              <button 
                onClick={fetchUsersList}
                className="mt-4 px-4 py-2 bg-slate-100 dark:bg-[#2b394a] hover:bg-slate-200 dark:hover:bg-[#36475b] rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-[#1e2d3d] bg-slate-50/50 dark:bg-[#0e1621]/50 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Total Users: <span className="text-blue-600 dark:text-blue-400 font-bold">{totalUsers}</span>
                </span>
              </div>
              
              <UserTable users={users} loading={loading} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-[#1e2d3d] flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Page <span className="font-medium text-slate-900 dark:text-white">{page}</span> of <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || loading}
                      className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#2b394a] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#2b394a] transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages || loading}
                      className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#2b394a] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#2b394a] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
