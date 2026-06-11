import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Phone, Lock, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loading, error } = useAuth();

  const validate = () => {
    const errors = {};
    const phoneRegex = /(84|0[\d])+([0-9]{8})\b/;
    
    if (!phone) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(phone)) {
      errors.phone = 'Số điện thoại không hợp lệ (Ví dụ: 0912345678)';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await login(phone, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob [animation-delay:2000ms]"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob [animation-delay:4000ms]"></div>

      <div className="w-full max-w-md rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 relative z-10">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 mb-6">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Chào mừng trở lại</h2>
          <p className="mt-3 text-slate-500">Đăng nhập để tiếp tục trò chuyện cùng bạn bè.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-600 flex items-start gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại</label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: null });
                }}
                placeholder="Nhập số điện thoại của bạn"
                className={`w-full px-4 py-3.5 rounded-2xl border ${fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'} bg-white/50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                }}
                placeholder="Nhập mật khẩu của bạn"
                className={`w-full px-4 py-3.5 rounded-2xl border ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'} bg-white/50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
