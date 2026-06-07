import React, { useState } from 'react';
import { registerApi } from '../services/authApi';
import { Phone, Lock, User, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    displayName: '',
    password: '',
    confirm: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    const errors = {};
    const phoneRegex = /(84|0[\d])+([0-9]{8})\b/;
    
    if (!formData.phone) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ (Ví dụ: 0912345678)';
    }

    if (!formData.displayName) {
      errors.displayName = 'Vui lòng nhập tên hiển thị';
    } else if (formData.displayName.trim().length < 2) {
      errors.displayName = 'Tên hiển thị phải có ít nhất 2 ký tự';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirm) {
      errors.confirm = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirm) {
      errors.confirm = 'Mật khẩu xác nhận không khớp';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi(formData.phone, formData.displayName, formData.password, formData.confirm);
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 relative overflow-hidden py-10">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob [animation-delay:2000ms]"></div>
      <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob [animation-delay:4000ms]"></div>

      <div className="w-full max-w-md rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 relative z-10">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 mb-6">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tạo tài khoản</h2>
          <p className="mt-3 text-slate-500">Tham gia ngay để kết nối với mọi người.</p>
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
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
                className={`w-full px-4 py-3.5 rounded-2xl border ${fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20'} bg-white/50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200`}
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tên hiển thị</label>
            <div className="relative">
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Tên hiển thị của bạn"
                className={`w-full px-4 py-3.5 rounded-2xl border ${fieldErrors.displayName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20'} bg-white/50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {fieldErrors.displayName && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.displayName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                className={`w-full px-4 py-3.5 rounded-2xl border ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20'} bg-white/50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Xác nhận mật khẩu"
                className={`w-full px-4 py-3.5 rounded-2xl border ${fieldErrors.confirm ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20'} bg-white/50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200`}
              />
            </div>
            {fieldErrors.confirm && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {fieldErrors.confirm}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 mt-2 rounded-2xl text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-teal-500/30 transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
