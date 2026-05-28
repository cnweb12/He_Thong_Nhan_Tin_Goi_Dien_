# Frontend - Hệ Thống Nhắn Tin Gọi Điện

Frontend của dự án được xây dựng bằng **React**, **Vite**, và **Tailwind CSS**.

## Yêu cầu môi trường

- Node.js (phiên bản 18+ khuyến nghị)
- npm hoặc yarn

## Cài đặt và chạy Local (Môi trường phát triển)

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

2. Khởi chạy server phát triển:
   ```bash
   npm run dev
   ```

   Mặc định server sẽ chạy tại địa chỉ: **http://localhost:5173**.

## Chi tiết các Port (Cổng)

Trong quá trình phát triển và triển khai, hệ thống sử dụng các port sau cho frontend và các dịch vụ liên quan:

- **`5173`**: Port mặc định của Vite dùng cho môi trường phát triển (Local Development).
- **`80`**: Port mặc định khi chạy Frontend bằng Docker (Production/Nginx). Container frontend ánh xạ port 80 ra ngoài mạng máy host.
- **`3000`**: Port của Backend API. Trong môi trường dev, Vite được cấu hình proxy các request `/api` sang `http://localhost:3000` (hoặc cấu hình qua biến `VITE_API_URL`).

## Cấu hình Môi trường (Tùy chọn)

Các biến môi trường có thể được cấu hình qua file `.env` đặt tại thư mục `frontend/`:

- `VITE_API_URL`: Base URL của Backend API (Mặc định được proxy tới `http://localhost:3000` trong `vite.config.js`).
- `VITE_SOCKET_URL`: URL để kết nối Realtime Socket. Nếu backend chưa hỗ trợ, hãy để trống hoặc không khai báo để FE bỏ qua kết nối socket.

## Chạy bằng Docker (Tích hợp Docker Compose)

Frontend đã được tích hợp sẵn vào file `docker-compose.yml` ở thư mục gốc của dự án. Để chạy toàn bộ hệ thống (gồm MongoDB, Backend, và Frontend) bằng Docker:

1. Mở terminal, di chuyển ra thư mục gốc của dự án (nơi chứa file `docker-compose.yml`).
2. Chạy lệnh sau để build và khởi động các container ở chế độ nền:
   ```bash
   docker-compose up --build -d
   ```

Sau khi quá trình khởi tạo hoàn tất:
- Ứng dụng Frontend sẽ có thể truy cập qua: **http://localhost** (Nginx phục vụ file tĩnh ở port 80).
- Dịch vụ Backend sẽ chạy và mở port `3000`.
- Frontend container phụ thuộc vào backend, nó sẽ tự động đợi backend sẵn sàng (healthy) trước khi phục vụ ứng dụng.

## Cấu trúc thư mục

- `src/components`: Các component dùng chung cho toàn dự án.
- `src/features/auth`: Các chức năng đăng nhập, đăng ký, quản lý phiên.
- `src/features/conversations`: Danh sách các cuộc hội thoại, giao diện hộp thư (inbox).
- `src/features/messages`: Giao diện đoạn chat (thread), khung soạn thảo, cập nhật tin nhắn realtime.
- `src/features/calls`: Quản lý nhật ký gọi và giao diện điều khiển cuộc gọi.
- `src/features/devices`: Giao diện quản lý các thiết bị đang đăng nhập.
- `src/features/users`: Giao diện hồ sơ và cài đặt người dùng.
- `src/services`: Nơi chứa logic kết nối API, gọi network requests (`apiClient.js`).
- `src/styles`: Chứa cấu hình global CSS, các class tùy biến và tích hợp với Tailwind.
- `src/constants`: Chứa các biến, hằng số cấu hình tĩnh.
