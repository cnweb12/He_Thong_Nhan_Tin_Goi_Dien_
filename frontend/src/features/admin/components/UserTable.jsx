import React from 'react';
import { User, Shield, ShieldAlert, Calendar } from 'lucide-react';

const UserTable = ({ users, loading }) => {
  if (!users || users.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        No users found matching your criteria.
      </div>
    );
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
            <ShieldAlert size={12} />
            Super Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <User size={12} />
            User
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-[#0e1621] border-b border-slate-200 dark:border-[#1e2d3d] text-slate-500 dark:text-slate-400 text-sm font-medium">
            <th className="py-3 px-4 pl-6">User</th>
            <th className="py-3 px-4">Phone</th>
            <th className="py-3 px-4">Role</th>
            <th className="py-3 px-4">Last Seen</th>
            <th className="py-3 px-4 pr-6">Joined</th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-slate-100 dark:divide-[#1e2d3d] transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-[#1a2432] transition-colors group">
              <td className="py-4 px-4 pl-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-[#2b394a] flex-shrink-0 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 font-semibold text-lg uppercase">
                        {user.displayName?.[0] || user.username?.[0] || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      @{user.username}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                {user.phone}
              </td>
              <td className="py-4 px-4">
                {getRoleBadge(user.role)}
              </td>
              <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                {user.lastSeenAt ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {formatDate(user.lastSeenAt)}
                  </span>
                ) : 'Never'}
              </td>
              <td className="py-4 px-4 pr-6 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  {formatDate(user.createdAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
