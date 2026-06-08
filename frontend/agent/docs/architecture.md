# Frontend Architecture

## 1. Cấu trúc thư mục (Folder Structure)
Dự án chia thư mục theo mức độ tái sử dụng và chức năng:
- `/components`: Các UI component tĩnh, dùng chung ở nhiều nơi (Button, Input).
- `/pages`: Các màn hình chính kết hợp nhiều feature (Home, Login).
- `/features`: Các mô-đun chức năng độc lập (auth, chats, calls). Bên trong có thể chứa component, hooks, API riêng của feature đó.
- `/services`: Các hàm gọi API (fetch/axios) và tích hợp Socket.io.
- `/constants`: Biến môi trường, hằng số cấu hình.
- `/utils`: Hàm hỗ trợ chung.

## 2. Quản lý State & Luồng dữ liệu
- **Local State:** Dùng `useState` và `useReducer`.
- **Global State:** Kết hợp React Context với custom hooks cho các dữ liệu dùng chung toàn app (Auth, Theme).
- **Dữ liệu Real-time:** Xử lý qua `Socket.io-client`, khởi tạo ở layer cao (App/Provider) và truyền xuống via Context hoặc custom hook.
