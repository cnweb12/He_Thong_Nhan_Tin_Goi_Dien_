# Kế Hoạch Tích Hợp WebSocket (Socket.IO)

## 1. Bối cảnh & Lựa chọn công nghệ

- **Thư viện**: `socket.io` (Backend) & `socket.io-client` (Frontend). Phù hợp cho project quy mô vừa và nhỏ, hỗ trợ tốt các tính năng reconnect, rooms, và broadcasting.
- **Kiến trúc mạng**: 1 Instance duy nhất (Không cần cài đặt Redis Adapter để đồng bộ state giữa nhiều server). **Lưu ý trên Cloud:** Đảm bảo luôn thiết lập số lượng instance = 1 trên dashboard (ví dụ Render) để tránh lỗi kết nối chéo trừ khi tích hợp Redis Adapter.
- **Xác thực**: JWT Access Token qua `auth` payload khi client khởi tạo kết nối.

## 2. Thiết kế Sự kiện (Events Dictionary)

| Tên Event (Client gửi) | Chi tiết / Payload           | Mô tả                                                                                 |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `join_room`            | `{ conversationId: string }` | Xin phép tham gia vào một "phòng" tương ứng với hộp thoại để nhận tin nhắn real-time. |
| `leave_room`           | `{ conversationId: string }` | Rời phòng khi thoát khỏi giao diện hộp thoại.                                         |
| `typing_start`         | `{ conversationId: string }` | Thông báo user hiện tại đang gõ phím trong hộp thoại.                                 |
| `typing_stop`          | `{ conversationId: string }` | Thông báo user hiện tại đã ngừng gõ phím.                                             |

| Tên Event (Server gửi) | Chi tiết / Payload                             | Mô tả                                                                                    |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `new_message`          | `{ _id, conversationId, senderId, text, ... }` | Gửi tin nhắn vừa tạo thành công từ API `POST /api/messages` xuống các client trong room. |
| `typing_start`         | `{ conversationId, userId, displayName }`      | Báo cho các user trong room biết ai đó đang gõ phím.                                     |
| `typing_stop`          | `{ conversationId, userId }`                   | Báo cho các user trong room biết ai đó đã ngừng gõ.                                      |
| `message_read`         | `{ conversationId, userId, lastSeenSeq }`      | Báo cho các user trong room biết có người vừa đọc tin nhắn (API Update Read).            |

## 3. Các bước triển khai (Checklist)

### Bước 1: Khởi tạo Hạ tầng Socket.IO

- Cài đặt thư viện: `npm install socket.io`.
- Tạo thư mục và file cấu hình: `src/socket/socket.js`. File này sẽ khởi tạo `Server` của Socket.IO, lưu trữ `io` instance để dùng lại ở các controller khác.
- **Lưu ý cấu hình CORS cho Socket.IO**: Phải khai báo riêng CORS khi khởi tạo `new Server(httpServer, { cors: { origin: ["https://<project-id>.web.app", "http://localhost:5173"] } })`.
- Tích hợp vào `src/server.js`: Truyền `httpServer` vào hàm khởi tạo socket ngay sau khi Express app bắt đầu listen.

### Bước 2: Middleware Xác thực (Authentication)

- Viết middleware cho Socket.IO để trích xuất `socket.handshake.auth.token`.
- Sử dụng thư viện `jsonwebtoken` (tương tự như cách verify ở HTTP API) để giải mã.
- **Pass**: Nếu hợp lệ, gán thông tin `socket.user = decoded` và cho phép kết nối.
- **Fail**: Nếu sai hoặc hết hạn, gọi `next(new Error("Authentication error"))` để từ chối kết nối.

### Bước 3: Quản lý Trạng thái Online / Offline (Presence)

- **Khi khởi động server**:
  - Viết script chạy ngay khi ứng dụng (backend) khởi động để **reset toàn bộ thiết bị/user về trạng thái `isOnline = false`**. (Xử lý trường hợp server crash/restart đột ngột trên Cloud khiến sự kiện disconnect không kịp chạy).
- **Khi kết nối thành công (`connection`)**:
  - Cập nhật cơ sở dữ liệu (thông qua `DeviceService` hoặc trực tiếp) thiết lập `isOnline: true` cho thiết bị (`deviceId` có thể nhúng vào token hoặc gửi thêm qua auth payload).
- **Khi ngắt kết nối (`disconnect`)**:
  - Tự động cập nhật cơ sở dữ liệu thiết lập `isOnline: false` và cập nhật `lastActiveAt`.

### Bước 4: Logic Quản lý Phòng (Rooms)

- Lắng nghe event `join_room`: Server kiểm tra xem `userId` có nằm trong danh sách `participants` của `conversationId` không (bảo mật). Nếu có, gọi `socket.join(conversationId)`.
- Lắng nghe event `leave_room`: Gọi `socket.leave(conversationId)`.

### Bước 5: Logic Thời gian thực cho "Đang gõ phím" (Typing Indicators)

- Lắng nghe event `typing_start` từ một client. Phát lại (`socket.to(conversationId).emit`) event `typing_start` tới những người khác trong cùng room, kèm theo thông tin `userId` đang gõ.
- Lắng nghe event `typing_stop` và làm tương tự.

### Bước 6: Tích hợp phát Sự kiện (Emit) vào API Controllers

- **API Gửi tin nhắn (`POST /api/messages`)**: Sau khi lưu tin nhắn mới vào DB thành công, lấy `io` instance và phát event `new_message` vào room `conversationId` tương ứng.
- **API Đánh dấu đã đọc (`PATCH /api/conversations/:conversationId/read`)**: Sau khi cập nhật DB thành công, phát event `message_read` chứa `lastSeenSeq` vào room `conversationId`.

## 4. Hướng dẫn dành cho Frontend (Tham khảo)

- **Cài đặt**: Dùng `npm install socket.io-client`.
- **Kết nối**:
  ```javascript
  import { io } from "socket.io-client";
  const socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: {
      token: "Bearer <accessToken>",
    },
  });
  ```
- **Vào Box Chat**: Gửi `socket.emit('join_room', { conversationId: '...' })`.
- **Lắng nghe tin nhắn mới**:
  ```javascript
  socket.on("new_message", (msg) => {
    // Đẩy msg vào mảng state hiện tại
  });
  ```
- **Typing**: Dùng `debounce` hoặc `throttle` trên hàm onChange của ô input để tránh bắn event `typing_start` quá nhiều lần.

## 5. Lưu ý Triển khai (Deployment lên Render & Firebase)

Khi đưa Backend lên môi trường Cloud (ví dụ: Render cho Backend, Firebase cho Frontend), hãy đặc biệt chú ý các điểm sau:

1. **Build lại Frontend**: Các biến môi trường của Frontend (như `VITE_API_URL`, `VITE_SOCKET_URL`) được đóng gói cứng (baked-in) vào thời điểm build. Nếu Backend thay đổi URL, bạn **bắt buộc phải chạy lại `npm run build`** cho Frontend. Chỉ đổi file cấu hình và khởi động lại container là không đủ.
2. **Cấu hình CORS (Render & Firebase)**: Backend phải được thiết lập để cho phép (allow origin) chính xác domain của Firebase (ví dụ: `https://<project-id>.web.app`). Phải cấu hình CORS cho cả Express HTTP và Socket.IO riêng biệt như đã nêu ở Bước 1.
3. **Giao thức Bảo mật (HTTPS/WSS)**: Khi đưa Backend lên Render, URL API sẽ mặc định có SSL (`https://backend-name.onrender.com`). Hãy cấu hình biến `VITE_SOCKET_URL=https://backend-name.onrender.com` bên Frontend. Socket.IO client sẽ tự động nâng cấp giao thức lên WebSocket Secure (`wss://`) qua cổng mặc định 443, bạn không cần phải tự cấu hình SSL hay port.
