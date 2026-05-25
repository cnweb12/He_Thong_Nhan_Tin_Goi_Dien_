import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
    >
      Đăng xuất
    </button>
  );
}
