import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getAllUsersApi,
  lockUserApi,
  unlockUserApi,
  changeUserRoleApi,
} from '../services/adminApi';

const ROLE_LABEL = {
  user: 'Người dùng',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const ROLE_BADGE = {
  user: 'bg-slate-100 text-slate-600',
  admin: 'bg-blue-100 text-blue-700',
  super_admin: 'bg-purple-100 text-purple-700',
};

export default function UsersPage() {
  const { accessToken, user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadUsers = useCallback(async (page = 1) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAllUsersApi(accessToken, {
        page,
        limit: 20,
        role: roleFilter || undefined,
        search: search || undefined,
      });
      setUsers(result.users || []);
      setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [accessToken, roleFilter, search]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleToggleLock = async (targetUser) => {
    if (!accessToken) return;
    setActionError(null);
    setBusyId(targetUser._id);
    try {
      if (targetUser.isLocked) {
        await unlockUserApi(accessToken, targetUser._id);
      } else {
        await lockUserApi(accessToken, targetUser._id);
      }
      await loadUsers(pagination.page);
    } catch (err) {
      setActionError(err.message || 'Thao tác thất bại');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (!accessToken || newRole === targetUser.role) return;
    setActionError(null);
    setBusyId(targetUser._id);
    try {
      await changeUserRoleApi(accessToken, targetUser._id, newRole);
      await loadUsers(pagination.page);
    } catch (err) {
      setActionError(err.message || 'Đổi role thất bại');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng {pagination.total} người dùng
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo SĐT, username, tên..."
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả role</option>
          <option value="user">Người dùng</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <button
          type="button"
          onClick={() => loadUsers(1)}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Làm mới
        </button>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">SĐT</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Không có người dùng nào.
                </td>
              </tr>
            )}
            {!loading && users.map((u) => {
              const isSelf = u._id === currentUser?.userId || u._id === currentUser?._id;
              return (
                <tr key={u._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.phone)}&background=random&color=fff&rounded=true`}
                        alt={u.displayName}
                        className="w-9 h-9 rounded-full object-cover bg-slate-200"
                      />
                      <div>
                        <p className="font-medium text-slate-800">{u.displayName || 'Chưa đặt tên'}</p>
                        {u.username && <p className="text-xs text-slate-400">@{u.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                  <td className="px-4 py-3">
                    {isSuperAdmin && !isSelf ? (
                      <select
                        value={u.role || 'user'}
                        disabled={busyId === u._id}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className={`text-xs font-medium rounded-lg px-2 py-1 border-0 ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}
                      >
                        <option value="user">Người dùng</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <span className={`text-xs font-medium rounded-lg px-2 py-1 ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>
                        {ROLE_LABEL[u.role] || 'Người dùng'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.isLocked ? (
                      <span className="text-xs font-medium rounded-lg px-2 py-1 bg-red-100 text-red-700">Đã khóa</span>
                    ) : (
                      <span className="text-xs font-medium rounded-lg px-2 py-1 bg-green-100 text-green-700">Hoạt động</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <button
                        type="button"
                        disabled={busyId === u._id}
                        onClick={() => handleToggleLock(u)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
                          u.isLocked
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-red-200 text-red-700 hover:bg-red-50'
                        }`}
                      >
                        {u.isLocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    )}
                    {isSelf && <span className="text-xs text-slate-400">Bạn</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => loadUsers(pagination.page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            Trước
          </button>
          <span className="text-sm text-slate-500">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadUsers(pagination.page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
