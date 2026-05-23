// import { post } from './apiClient';   // Import đúng đường dẫn

// export const loginApi = async (phone, password) => {
//   const body = {
//     phone,
//     password,
//     deviceId: 'device-uuid-1234',   // Có thể thay bằng uuid thật sau
//     platform: 'web',
//   };

//   try {
//     const res = await post('/api/auth/login', body);

//     if (!res.ok) {
//       throw new Error(res.error?.message || res.error || 'Đăng nhập thất bại');
//     }

//     return res.data;
//   } catch (err) {
//     console.error('Login API error:', err);
//     throw err;
//   }
// };
import { post } from '../../../services/apiClient';   // Import đúng đường dẫn

// Fake data để test FE khi backend chưa chạy
const isTestMode = true; // Đổi thành false khi muốn gọi API thật

export const loginApi = async (phone, password) => {
  if (isTestMode) {
    // === FAKE DATA ĐỂ TEST FRONTEND ===
    await new Promise(resolve => setTimeout(resolve, 700)); // giả lập delay

    return {
      accessToken: "fake-access-token-" + Date.now(),
      refreshToken: "fake-refresh-token-" + Date.now(),
      user: {
        id: 1,
        name: "Ly",
        phone: phone,
        avatar: `https://via.placeholder.com/40/0068ff/ffffff?text=${phone.slice(-2)}`
      }
    };
  }

  // === GỌI API THẬT ===
  const body = {
    phone,
    password,
    deviceId: 'device-uuid-1234',
    platform: 'web',
  };

  const res = await post('/api/auth/login', body);

  if (!res.ok) throw new Error(res.error || 'Login failed');
  return res.data;
};