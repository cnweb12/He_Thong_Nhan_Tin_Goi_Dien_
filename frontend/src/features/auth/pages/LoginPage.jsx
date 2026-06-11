// import React, { useState } from 'react';
// import { useAuth } from '../hooks/useAuth';

// export default function LoginPage() {
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const { login, loading, error } = useAuth();

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!phone || !password) {
//       alert('Vui lòng nhập đầy đủ số điện thoại và mật khẩu');
//       return;
//     }

//     await login(phone, password);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,_#f7fafc,_#eef2f7_42%,_#f4f7fb_100%)]">
//       <div className="w-full max-w-md rounded-[1.75rem] bg-white border border-slate-200 shadow-[0_24px_70px_rgba(15,23,42,0.10)] p-8">
//         <div className="mb-8 text-center">
//           <div className="inline-flex items-center justify-center w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white font-semibold shadow-sm">T</div>
//           <h2 className="mt-4 text-2xl font-semibold text-slate-900">Đăng nhập</h2>
//           <p className="mt-2 text-sm text-slate-500">Truy cập vào hệ thống nhắn tin nội bộ.</p>
//         </div>

//         {error && (
//           <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm text-center">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
//             <input
//               type="text"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="Nhập số điện thoại"
//               className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Nhập mật khẩu"
//               className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className={`w-full py-3.5 px-4 rounded-2xl text-white font-semibold bg-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-slate-800 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             {loading ? 'Đang xử lý...' : 'Đăng nhập'}
//           </button>
//         </form>

//         <div className="mt-5 text-center text-sm text-slate-600">
//           <a href="/register" className="text-slate-900 font-medium hover:underline">Tạo tài khoản mới</a>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
// 1. Import logo mới từ thư mục assets
import logoNew from "../../../assets/logo.png";

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
    /* 2. ĐÃ SỬA: Xóa bỏ lớp bg-[radial-gradient...] cũ để lộ ra hình nền 
         mạng lưới công nghệ đã cài đặt ở global.css.
    */
    <div className="min-h-screen flex items-center justify-center px-4">

      {/* Khung Form đăng nhập */}
      <div className="w-full max-w-md rounded-[1.75rem] bg-white border border-slate-200 shadow-[0_24px_70px_rgba(15,23,42,0.15)] p-8">

        <div className="mb-8 text-center">
          {/* 3. ĐÃ SỬA: Thay thế khối div chữ "T" màu đen cũ bằng thẻ img chứa Logo mới 
          */}
          <div className="inline-flex items-center justify-center w-16 h-16">
            <img
              src={logoNew}
              alt="App Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-500">Truy cập vào hệ thống nhắn tin nội bộ.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-600 flex items-start gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
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
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
              required
            />
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