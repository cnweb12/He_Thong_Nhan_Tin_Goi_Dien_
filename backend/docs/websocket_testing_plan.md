# Kế Hoạch Kiểm Thử WebSocket (Integration Testing Plan)

## 1. Mục tiêu

Đảm bảo hệ thống WebSocket hoạt động ổn định, chính xác trong các luồng nghiệp vụ:

- Xác thực kết nối (Authentication).
- Quản lý trạng thái Online/Offline (Presence) của thiết bị.
- Tham gia và rời khỏi các phòng (Rooms).
- Tích hợp mượt mà giữa HTTP API và Socket.IO (Phát sự kiện chuẩn xác khi gọi API).

## 2. Kỹ thuật & Setup Môi trường

- **Framework Test**: Sử dụng native test runner của Node.js (`node:test` và `node:assert`).
- **Database**: Dùng In-Memory DB (`mongodb-memory-server`) để test chạy cực nhanh, cô lập, tránh conflict dữ liệu. Tích hợp `clearDatabase()` trước mỗi test case.
- **HTTP Client**: Dùng `supertest` để giả lập gọi API RESTful (POST tin nhắn, PATCH read receipt), đi qua trọn vẹn các tầng Middleware -> Validator -> Service.
- **WebSocket Client & Server**:
  - Bọc Express app bằng `http.createServer()`, gọi `initializeSocket(server)` và **`server.listen(0)`**. Việc mở port 0 (port ngẫu nhiên) giúp hệ thống TCP bắt đầu lắng nghe thật sự mà không lo bị lỗi chiếm dụng port (`EADDRINUSE`) trên máy Dev, hỗ trợ chạy test song song.
  - Dùng `socket.io-client` làm công cụ kết nối client thực tế vào port ngẫu nhiên này.
  - Tham số kết nối chuẩn: `{ auth: { token: mockToken, deviceId: "mock-device-id" } }`.

## 3. Kịch bản Kiểm thử Chi tiết (Test Suites)

### Phase 1: Authentication & Connection (Xác thực & Trạng thái)

- **TC1.1**: Từ chối kết nối nếu client không truyền token hoặc truyền sai. (Lắng nghe `connect_error`).
- **TC1.2**: Chấp nhận kết nối với token hợp lệ -> Bắt sự kiện `connect` -> Kiểm tra Database (`UserDeviceModel`) xem `isOnline` của `deviceId` tương ứng có đổi thành `true` không.
- **TC1.3**: Client gọi ngắt kết nối (`socket.disconnect()`) -> Kiểm tra Database xem `isOnline` có chuyển thành `false` không.
- **TC1.4 (Multi-device)**: User A kết nối trên 2 thiết bị (Device 1 và Device 2). Khi Device 1 ngắt kết nối, Database cập nhật Device 1 thành `isOnline: false` nhưng Device 2 vẫn phải giữ trạng thái `isOnline: true`.

### Phase 2: Room Management (Quản lý Phòng Chat)

- **TC2.1**: Cho phép client tham gia (`join_room`) vào một `conversationId` hợp lệ mà user đó là thành viên (Nhận callback `{ ok: true }`).
- **TC2.2**: Từ chối và trả về lỗi nếu client gọi `join_room` vào một `conversationId` mà user đó KHÔNG tham gia (Chống nghe lén). Nhận callback `{ ok: false, error: ... }`.
- **TC2.3**: Cho phép client rời phòng (`leave_room`) thành công.

### Phase 3: Typing Indicators (Sự kiện Đang gõ phím)

- **Chuẩn bị**: User A và User B cùng join room X.
- **TC3.1**: User A emit `typing_start` -> Client B nhận được event `typing_start` chứa `userId` của A. Client A KHÔNG nhận được event này (tránh dội ngược).
- **TC3.2**: User A emit `typing_stop` -> Client B nhận được event tương ứng.

### Phase 4: Integration - Tích hợp HTTP và Socket

- **Chuẩn bị**: User A và User B kết nối socket và cùng join room X.
- **TC4.1 (Gửi tin nhắn & Chống Echo)**:
  - Dùng `supertest` đóng giả User A gọi `POST /api/messages` để gửi tin.
  - _Kỳ vọng_: API trả về `201 Created`. ĐỒNG THỜI lập tức, Socket Client của User B hứng được event `new_message` với payload tin nhắn khớp với API. Socket Client của User A **KHÔNG** nhận được event này để tránh lỗi lặp tin nhắn (echo) trên giao diện.
- **TC4.2 (Đã xem tin nhắn)**:
  - Dùng `supertest` đóng giả User B gọi `PATCH /api/conversations/X/read`.
  - _Kỳ vọng_: API trả về `200 OK`. ĐỒNG THỜI lập tức, Socket Client của User A hứng được event `message_read`.

## 4. Các bước thực hiện (Next Steps)

1. Cài đặt thêm thư viện đóng giả client: `npm install --save-dev socket.io-client`.
2. Khởi tạo cấu trúc file `tests/integration/websocket.test.js`.
3. Viết các hàm Setup (Before/After Hooks) để mở HTTP Server ở port 0 và setup Memory DB.
4. Code các test case tuần tự từ Phase 1 đến Phase 4.
