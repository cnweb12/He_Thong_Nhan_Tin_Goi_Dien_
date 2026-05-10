# Zalo PC - Chat Application Frontend

Ứng dụng nhắn tin kiểu Zalo được xây dựng với Vite + React

## Tính năng

- 💬 Giao diện chat tương tác
- 🌙 Chế độ Dark Mode
- 🔍 Tìm kiếm người dùng
- 📱 Responsive Design
- 😊 Mock Data (chưa tích hợp backend)

## Cấu trúc Project

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx         # Sidebar danh sách chat
│   │   ├── Sidebar.css
│   │   ├── ChatWindow.jsx       # Cửa sổ chat chính
│   │   ├── ChatWindow.css
│   │   ├── Welcome.jsx          # Trang welcome
│   │   └── Welcome.css
│   ├── App.jsx                 # Component chính
│   ├── App.css
│   ├── main.jsx                # Entry point React
│   ├── index.css               # CSS global
│   └── mockData.js             # Dữ liệu giả
├── index.html                  # HTML template
├── vite.config.js              # Vite config
└── package.json
```

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev

# Build cho production
npm run build

# Preview build
npm run preview
```

## Mock Data

Hiện tại ứng dụng sử dụng mock data từ `src/mockData.js` bao gồm:
- 6 người dùng mẫu
- Tin nhắn mẫu cho các cuộc trò chuyện
- Avatar từ DiceBear API

## Bước tiếp theo - Tích hợp Backend

Để kết nối với backend API:

1. **Tạo API Service** - Tạo file `src/services/api.js` để gọi API từ backend
2. **Replace Mock Data** - Thay thế `mockData.js` bằng API calls
3. **State Management** - Cân nhắc sử dụng Context API hoặc Redux
4. **Real-time Chat** - Tích hợp WebSocket cho tin nhắn real-time
5. **Authentication** - Thêm login/logout functionality

## Ví dụ - Gọi Backend API

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const getUsers = async () => {
  const response = await axios.get(`${API_BASE_URL}/users`);
  return response.data;
};

export const getMessages = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/messages/${userId}`);
  return response.data;
};
```

## Styling

- Sử dụng CSS Variables cho Light/Dark Mode
- Variables được định nghĩa trong `App.css`
- Responsive design với Flexbox

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Hỗ trợ Mobile devices
