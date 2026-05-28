# Kế hoạch Tích hợp WebSocket cho Giao diện Chat (Frontend)

Dựa trên cấu trúc hiện tại của dự án Frontend, hạ tầng WebSocket (`SocketProvider`, `useAppSocket`) đã được thiết lập sẵn ở cấp độ gốc (`App.jsx`). Bước tiếp theo là đưa kết nối realtime này vào khung chat cụ thể (component `ThreadView.jsx`).

Dưới đây là kế hoạch chi tiết các bước cần thực hiện:

## 1. Cấu hình Môi trường & Device ID (Quan trọng)

- Đảm bảo trong file `.env.development` ở frontend đã có biến `VITE_SOCKET_URL` trỏ về backend.

  ```env
  VITE_SOCKET_URL=http://localhost:3000
  ```

- Thiết lập Device ID: Backend yêu cầu deviceId để quản lý trạng thái Online/Offline cho từng thiết bị riêng biệt (hỗ trợ 1 user đăng nhập nhiều máy).
  - Khởi tạo một deviceId duy nhất (có thể sử dụng thư viện uuid hoặc hàm sinh random chuỗi) khi ứng dụng chạy lần đầu.
  - Lưu deviceId này vào localStorage để sử dụng lại cho các lần sau.
  - Khi khởi tạo socket.io-client trong hook useAppSocket, bắt buộc truyền deviceId vào payload xác thực cùng với token:

```javascript
auth: { token: "Bearer ...", deviceId: localStorage.getItem('deviceId') }
```

## 2. Quản lý State và Fetch Dữ liệu ban đầu (HTTP)

Component `ThreadView.jsx` hiện đang sử dụng giao diện tĩnh. Cần thay đổi:

- **State**: Thêm `useState` để lưu trữ danh sách `messages` và trạng thái `isTyping`.
- **Fetch API**: Khi component mount (người dùng mở 1 hộp thoại), sử dụng `useEffect` gọi API `GET /api/messages/conversations/:conversationId` để lấy danh sách lịch sử tin nhắn ban đầu.

## 3. Quản lý Phòng Chat (Rooms) bằng WebSocket

Sử dụng hook `useAppSocket()` để lấy instance `socket`:

- Khi `ThreadView` mở ra (mount) với 1 `conversationId` cụ thể:
  - Gửi sự kiện: `socket.emit('join_room', { conversationId: chat._id })`.
- Khi `ThreadView` đóng lại (unmount) hoặc người dùng chuyển sang chat với người khác:
  - Gửi sự kiện: `socket.emit('leave_room', { conversationId: chat._id })`.

## 4. Lắng nghe Sự kiện Tin nhắn mới

Tạo một `useEffect` để lắng nghe sự kiện từ server:

- Lắng nghe `socket.on('new_message', (newMessage) => { ... })`.
- Khi nhận được tin nhắn, kiểm tra nếu `newMessage.conversationId === chat._id` thì cập nhật state `messages`:
  ```javascript
  setMessages((prev) => [...prev, newMessage]);
  ```
- _Lưu ý_: Cần cuộn (scroll) khung chat xuống dưới cùng mỗi khi có tin nhắn mới.

## 5. Xử lý logic Gửi tin nhắn (Gửi đi)

- Khi người dùng bấm "Gửi":
  1. Giao diện (UI) hiển thị tin nhắn ngay lập tức (Optimistic UI) hoặc đợi kết quả API.
  2. Gọi API `POST /api/messages` để lưu tin nhắn vào Database.
  3. Server sẽ tự động phát sự kiện `new_message` cho **người bên kia**. (Bản thân người gửi có thể dựa vào dữ liệu trả về từ API POST để cập nhật UI, tránh bị trùng lặp nếu lắng nghe chính tin nhắn mình gửi từ socket).

## 6. Tính năng "Đang gõ phím" (Typing Indicators)

- **Gửi sự kiện (Emit)**: Bắt sự kiện `onChange` ở ô input. Dùng kỹ thuật `debounce` (hoặc timeout) để:
  - Gọi `socket.emit('typing_start', { conversationId: chat._id })` khi bắt đầu gõ.
  - Gọi `socket.emit('typing_stop', { conversationId: chat._id })` khi dừng gõ phím sau khoảng 1-2 giây.
- **Nhận sự kiện (Listen)**:
  - Lắng nghe `socket.on('typing_start', (data) => { ... })`. Dữ liệu trả về chỉ có `userId`. Frontend cần duyệt qua danh sách `participants` của hội thoại để đối chiếu và tìm ra `displayName`, `avatar` của người đang gõ.
  - Lưu thông tin người đang gõ vào state `isTyping`.
  - Lắng nghe `socket.on('typing_stop')` để xóa thông báo đang gõ.
  - Hiển thị UI "... đang gõ" ở trên thanh nhập văn bản hoặc dưới cùng danh sách tin nhắn.

## 7. Cập nhật Trạng thái Đã đọc (Read Receipt) - Nâng cao

- Khi người dùng cuộn đến tin nhắn mới nhất, gọi API `PATCH /api/conversations/:id/read`.
- Lắng nghe `socket.on('message_read')` để cập nhật icon "Đã xem" bên cạnh các tin nhắn cũ trong mảng `messages`.

## 8. Tích hợp Real-time cho Danh sách Hội thoại (InboxPage)

Bên cạnh khung chat (`ThreadView`), danh sách các cuộc hội thoại (`InboxPage` hoặc Sidebar) cũng cần được cập nhật realtime khi có tin nhắn mới tới mà không cần tải lại trang.

- **Lắng nghe toàn cục (Global Listener):** Bắt sự kiện `new_message` ở cấp độ cao hơn (ví dụ ở `ConversationProvider` hoặc `Home.jsx`) để luôn nhận được tin nhắn dù người dùng đang mở hộp thoại nào.
- **Cập nhật danh sách:** Khi nhận `new_message`, tìm `conversationId` tương ứng trong mảng danh sách hội thoại. Đưa hội thoại đó lên đầu danh sách (sắp xếp lại), cập nhật đoạn text `lastMessage`, và tăng biến đếm `unreadCount` nếu hộp thoại đó đang không được mở.

## 9. Quản lý Trạng thái Online/Offline (Presence)

- **Yêu cầu nâng cấp Backend:** Hiện tại Backend chỉ cập nhật `isOnline` vào Database mà chưa phát (emit) sự kiện. Cần yêu cầu team Backend (hoặc tự bổ sung) logic phát event `user_online` và `user_offline` tới tất cả bạn bè khi một thiết bị kết nối/ngắt kết nối.
- **Cập nhật UI:** Frontend lắng nghe các sự kiện này để cập nhật chấm xanh (🟢) báo online trên avatar của người dùng trong danh sách bạn bè hoặc ở Header của `ThreadView`.

## 10. Xử lý Đứt kết nối & Đồng bộ dữ liệu (Reconnection Sync)

- Khi đường truyền mạng chập chờn hoặc người dùng sleep tab trình duyệt, kết nối socket sẽ bị ngắt và tự động kết nối lại. Trong khoảng thời gian "mù" này, các tin nhắn mới gửi đến sẽ bị rớt.
- **Giải pháp:** Lắng nghe sự kiện `socket.on('connect')`. Nếu phát hiện đây là sự kiện "kết nối lại" (reconnect) và hộp thoại đang mở, Frontend phải chủ động gọi lại API `GET /api/messages/conversations/:conversationId` (kèm tham số thời gian hoặc `lastMessageId` để lấy các tin nhắn bị nhỡ) và nối thêm vào mảng `messages`.

## 11. Cơ chế Tải thêm tin nhắn cũ (Load More / Pagination)

- Khung chat tiêu chuẩn không gọi toàn bộ hàng ngàn tin nhắn một lúc.
- **Giải pháp:** Sử dụng `Intersection Observer` (hoặc bắt sự kiện `onScroll`) gắn vào một thẻ ẩn (dummy div) đặt ở **trên cùng** (top) của vùng cuộn danh sách tin nhắn.
- Khi người dùng cuộn ngược lên trên và chạm vào thẻ này, gọi API `GET /api/messages...` kèm theo tham số phân trang (`skip`, `limit` hoặc `cursor`).
- Gắn các tin nhắn cũ vừa lấy được vào **đầu** mảng `messages` hiện tại. Cần áp dụng kỹ thuật giữ nguyên vị trí cuộn (Scroll Position Maintenance) để UI không bị giật lên trên.

## 12. Kế hoạch Kiểm thử Tự động (Automated Testing)

Để đảm bảo logic kết nối và xử lý dữ liệu realtime hoạt động ổn định, dự án sẽ áp dụng kiểm thử tự động ở 3 mức độ (ưu tiên những phần logic quan trọng):

### Bước 1: Unit Test cho Utilities & Services

- **Công cụ:** `Vitest` (tích hợp sẵn và tương thích tốt với Vite).
- **Mục tiêu:** Kiểm tra các hàm độc lập không gắn với giao diện (DOM).
- **Phạm vi test:**
  - Mock API request trong `src/services/apiClient.js` để đảm bảo hàm xử lý đúng cấu trúc trả về từ Backend.
  - Test các hàm format thời gian hoặc xử lý chuỗi liên quan đến tin nhắn.

### Bước 2: Unit Test cho Custom Hooks (Logic Kết nối & Xác thực)

- **Công cụ:** `Vitest` kết hợp với `@testing-library/react-hooks` (hoặc test trực tiếp qua component bọc).
- **Mục tiêu:** Đảm bảo logic quản lý state của Socket là chính xác.
- **Phạm vi test:**
  - Test `useSocket`: Kiểm tra xem khi có token hợp lệ, state `isConnected` có chuyển thành `true` không. Khi mất mạng hoặc gọi hàm báo lỗi, có ngắt kết nối không.
  - Test `useAuth`: Kiểm tra logic lưu và xóa token có ảnh hưởng đúng đến quá trình kết nối Socket hay không.

### Bước 3: Component Testing cho `ThreadView.jsx` (Tuỳ chọn & Khuyên dùng)

- **Công cụ:** `React Testing Library` + `Vitest`.
- **Mục tiêu:** Đảm bảo giao diện hiển thị đúng khi có thay đổi dữ liệu hoặc nhận sự kiện từ Socket.
- **Phạm vi test:**
  - Render `ThreadView` với dữ liệu tĩnh (mock mảng messages ban đầu) và kiểm tra DOM có hiển thị đúng tin nhắn không.
  - Giả lập (Mock) gọi hàm `socket.emit('join_room')` khi component mount.
  - Giả lập việc nhận một sự kiện `new_message` từ Socket để kiểm tra DOM có tự động thêm tin nhắn mới vào danh sách không.
  - Kiểm tra xem ô input có gọi đúng hàm gửi đi (`POST` API) khi người dùng thao tác.

## 13. Các bước triển khai (Checklist)

Để biến bản kế hoạch trên thành mã nguồn thực tế, chúng ta sẽ thực hiện tuần tự theo các task sau:

- [ ] **Bước 1: Tiện ích & Cấu hình Socket (`useAppSocket`)**
  - Tạo file tiện ích (VD: `src/utils/device.js`) để sinh mã `uuid` và lưu `deviceId` vào `localStorage`.
  - Cập nhật custom hook `useAppSocket` để nhúng `deviceId` và `token` vào payload `auth` khi khởi tạo kết nối.

- [ ] **Bước 2: Global Listener & Presence (Trạng thái Online/Offline)**
  - Lắng nghe các sự kiện toàn cục: `user_online`, `user_offline` ngay từ cấp cao nhất của App.
  - Lưu danh sách `onlineUsers` vào Global State (Context/Redux/Zustand) để các chấm xanh (🟢) trên avatar tự động cập nhật ở mọi nơi.

- [ ] **Bước 3: Tích hợp Core Chat (`ThreadView.jsx`)**
  - Gắn `socket.emit('join_room')` khi mở đoạn chat và `leave_room` khi đóng.
  - Lắng nghe sự kiện `new_message` và nối tin nhắn mới vào state hiển thị.

- [ ] **Bước 4: Nâng cấp Trải nghiệm Người dùng (UX)**
  - Bổ sung logic bắt sự kiện đang gõ phím (`typing_start`, `typing_stop`) kết hợp kỹ thuật Debounce.
  - Cài đặt tính năng Load More (Tải thêm tin nhắn cũ) khi cuộn chuột lên trên cùng.
  - Tích hợp logic tự động tải bù tin nhắn bị nhỡ khi mạng rớt và có lại (bắt sự kiện `connect` từ socket).
