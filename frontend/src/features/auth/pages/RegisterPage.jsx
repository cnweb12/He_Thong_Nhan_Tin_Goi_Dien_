import React, { useState } from 'react';
import { registerApi } from '../services/authApi';

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // no need to access auth context here for simple register

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!phone || !password || !displayName) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi(phone, displayName, password, confirm);
      // backend returns created user data in `res` (see API docs)
      if (res) {
        window.location.href = '/login';
      }
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,_#f7fafc,_#eef2f7_42%,_#f4f7fb_100%)]">
      <div className="w-full max-w-md rounded-[1.75rem] bg-white border border-slate-200 shadow-[0_24px_70px_rgba(15,23,42,0.10)] p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white font-semibold shadow-sm">N</div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Đăng ký</h2>
          <p className="mt-2 text-sm text-slate-500">Tạo tài khoản mới để bắt đầu trò chuyện.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên hiển thị</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên hiển thị"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-2xl text-white font-semibold bg-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-slate-800 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-600">
          <a href="/login" className="text-slate-900 font-medium hover:underline">Quay lại đăng nhập</a>
        </div>
      </div>
    </div>
  );
}
