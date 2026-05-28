# Kế Hoạch Kiểm Thử WebSocket Frontend (Frontend Testing Plan)

## 1. Mục tiêu
Đảm bảo các tính năng Real-time trên giao diện người dùng hoạt động mượt mà, không giật lag, quản lý state chính xác và xử lý tốt các trường hợp ngoại lệ (như mất mạng, scroll).

## 2. Công cụ và Môi trường
- **Framework:** `Vitest` kết hợp với `React Testing Library` (RTL).
- **Mocking:** 
  - Mock thư viện `socket.io-client` để kiểm soát các hàm `emit` và giả lập các sự kiện `on`.
  - Mock API HTTP request (`fetch` hoặc `axios`/`apiClient`) để giả lập việc tải tin nhắn ban đầu.

## 3. Kịch bản Kiểm thử Tự động (Automated Tests)

### Phase 1: Unit Test cho Utilities & Custom Hooks
- **TC1.1 (Device ID):** Hàm lấy `deviceId` phải sinh ra mã UUID hợp lệ nếu chưa có, và phải lấy đúng mã cũ từ `localStorage` ở những lần gọi sau.
- **TC1.2 (useAppSocket - Khởi tạo):** Khi hook `useAppSocket` chạy với token hợp lệ, nó phải gọi `io()` với cấu hình `auth` chứa đúng `token` và `deviceId`.
- **TC1.3 (useAppSocket - Ngắt kết nối):** Khi unmount component bọc ngoài, hook phải gọi `socket.disconnect()`.

### Phase 2: Component Test cho `ThreadView.jsx` (Core Chat)
- **TC2.1 (Join/Leave Room):** 
  - *Hành động:* Render `ThreadView` với `conversationId = "123"`.
  - *Kỳ vọng:* Component gọi API lấy lịch sử tin nhắn VÀ gọi `socket.emit('join_room', { conversationId: "123" })`. Khi unmount, phải gọi `socket.emit('leave_room')`.
- **TC2.2 (Nhận tin nhắn mới):**
  - *Hành động:* Giả lập socket nhận sự kiện `new_message` với `conversationId` khớp với phòng hiện tại.
  - *Kỳ vọng:* UI hiển thị thêm tin nhắn mới ở dưới cùng danh sách và tự động cuộn (scroll) xuống.
- **TC2.3 (Chống dội ngược tin nhắn):**
  - *Hành động:* Giả lập socket nhận sự kiện `new_message` nhưng có `conversationId` KHÁC với phòng hiện tại.
  - *Kỳ vọng:* UI của khung chat hiện tại KHÔNG bị cập nhật nhầm tin nhắn.
- **TC2.4 (Typing Indicators - Hiển thị):**
  - *Hành động:* Giả lập nhận event `typing_start` chứa `userId = "A"`.
  - *Kỳ vọng:* Giao diện xuất hiện dòng chữ "Người dùng A đang gõ..." (đã map `userId` ra tên). Nhận `typing_stop` thì dòng chữ biến mất.
- **TC2.5 (Typing Indicators - Emit debounce):**
  - *Hành động:* Gõ liên tục 5 phím vào ô input trong 1 giây.
  - *Kỳ vọng:* Hàm `socket.emit('typing_start')` chỉ được gọi 1 lần (nhờ debounce/throttle) để không làm quá tải server.

### Phase 3: Component Test cho Global Listeners (Inbox & Presence)
- **TC3.1 (Global Inbox Update):**
  - *Hành động:* Đang đứng ở trang chủ, giả lập nhận event `new_message` của `conversationId = "456"`.
  - *Kỳ vọng:* Khối hội thoại "456" ở Sidebar/Inbox nhảy lên đầu danh sách, chữ in đậm (unread) và `unreadCount` tăng lên 1.
- **TC3.2 (Presence Update):**
  - *Hành động:* Giả lập nhận event `user_online` với `userId = "A"`.
  - *Kỳ vọng:* Tất cả các avatar của user A trên màn hình lập tức xuất hiện chấm xanh (🟢).

## 4. Kịch bản Kiểm thử Thủ công / Nâng cao (Manual/E2E Edge Cases)

Do giới hạn của Unit/Component test đối với các API liên quan đến DOM thực tế (Scroll, Network), cần thực hiện manual test hoặc dùng Cypress/Playwright cho các case sau:

- **TC4.1 (Scroll Position Maintenance - Phân trang):**
  - *Thao tác:* Cuộn thanh cuộn lên sát mép trên cùng (Top).
  - *Kỳ vọng:* Call API `GET` tin nhắn cũ -> Nối tin nhắn vào đầu danh sách -> **Vị trí thanh cuộn đứng yên ở tin nhắn hiện tại** (không bị giật văng lên top).
- **TC4.2 (Reconnection Sync - Rớt mạng):**
  - *Thao tác:* Đang mở khung chat. Tắt WiFi (hoặc Disable Network trong DevTools) -> Bạn bè gửi 3 tin nhắn -> Bật lại WiFi.
  - *Kỳ vọng:* Bắt được sự kiện `connect` -> Tự động fetch API lấy 3 tin nhắn bị nhỡ -> Hiển thị đẩy đủ trên UI mà không cần F5.
- **TC4.3 (Optimistic UI - Gửi tin nhắn):**
  - *Thao tác:* Nhập tin nhắn và ấn "Enter" (Throttling Network ở mức Slow 3G).
  - *Kỳ vọng:* Tin nhắn lập tức hiện lên màn hình với trạng thái "Đang gửi" (màu mờ) -> Khi API báo 201 Created -> Chuyển sang trạng thái "Đã gửi" (màu đậm).

## 5. Check-list triển khai Test
- [ ] 1. Thiết lập cấu hình Vitest và setup file (mock `socket.io-client`).
- [ ] 2. Viết test cho `utils/device.js`.
- [ ] 3. Viết test cho `hooks/useAppSocket.js`.
- [ ] 4. Viết các test case cho component `ThreadView.jsx` (Phase 2).
- [ ] 5. Chạy manual test kiểm chứng Phân trang và Sync rớt mạng.
