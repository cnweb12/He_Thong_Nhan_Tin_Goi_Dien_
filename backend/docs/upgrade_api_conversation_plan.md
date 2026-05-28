# Kế Hoạch Nâng Cấp API Tìm Kiếm Cuộc Trò Chuyện (Conversation Search API)

## 1. Mục tiêu

Nâng cấp endpoint `GET /api/conversations/inbox` để hỗ trợ lọc danh sách cuộc trò chuyện theo tên (Tên Group, `displayName` của user) và cấu hình bảo mật `phone` (chỉ cho phép tìm số điện thoại của bạn bè khi gõ đủ 10 số). Trách nhiệm lọc dữ liệu được đặt ở Backend thông qua cấu trúc MongoDB Aggregation và Query chia bước để tối ưu hiệu năng, đảm bảo phân trang hoạt động chính xác.

## 2. Chi tiết các module cần chỉnh sửa

### 2.1. Cập nhật Validator

**File:** `src/modules/conversations/validators/conversation.validator.js`

- Bổ sung validation cho query parameter `q` (từ khóa tìm kiếm):
  - Optional (không bắt buộc).
  - Kiểu String.
  - Nên thêm `trim()` và giới hạn độ dài tối đa (ví dụ: tối đa 100 ký tự) để chống spam.

### 2.2. Cập nhật Controller

**File:** `src/modules/conversations/controllers/conversation.controller.js`

- Trích xuất tham số `q` từ `req.query`.
- Truyền thêm tham số `q` vào hàm xử lý logic `conversationService.getInbox(userId, limit, skip, q)`.

### 2.3. Cập nhật Service (Trọng tâm)

**File:** `src/modules/conversations/services/conversation.service.js`

- Nâng cấp hàm lấy dữ liệu từ `find()` thông thường lên **Aggregation Pipeline** kết hợp Pre-query (Truy vấn tiền trạm).
- **Luồng xử lý (Service Logic):**

  **Bước 1: Tiền xử lý từ khóa (Pre-query) cho Số điện thoại**
  - Nếu `q` là một chuỗi số hợp lệ (ví dụ: đủ 10 số như `09xxxxxxxx` hoặc `849xxxxxxxx`):
    - Query DB để tìm `userId` của người có số điện thoại này.
    - Kiểm tra trong collection `user_friends`: Xem user hiện tại và `userId` vừa tìm được có phải là bạn bè (`status: 'accepted'`) hay không.
    - Nếu là bạn bè: Lưu `userId` này vào một biến `matchPeerId`.
    - Nếu không phải (người lạ/không tồn tại): Bỏ qua, tiếp tục coi `q` như tìm kiếm Text thông thường.

  **Bước 2: Chạy Aggregation Pipeline**
  1. **`$match` ban đầu**: `participants` chứa `userId` đang đăng nhập.
  2. **`$lookup`**: Join với bảng `users` để lấy thông tin người đối diện (trừ bản thân).
  3. **`$match` lọc kết quả (Kết hợp Tương đối & Tuyệt đối)**:
     - Mệnh đề `$or` gồm:
       - Tìm tương đối (`$regex` chứa từ khóa, không phân biệt hoa thường) trên `conversation.name` (Cho Group Chat sau này).
       - Tìm tương đối (`$regex`) trên `users.displayName` (Tên người đối diện).
       - Tìm tuyệt đối: `users._id` khớp với `matchPeerId` (Nếu Bước 1 tìm thấy bạn bè qua SĐT).
  4. **`$sort`**: Ưu tiên `updatedAt` hoặc `lastMessageAt` giảm dần.
  5. **`$skip` & `$limit`**: Áp dụng phân trang.
  6. **`$project`**: Format output khớp với document.

### 2.4. Cập nhật Tài liệu API

**File:** `docs/api/api.md`

- Tìm đến mục **"4.2. Lấy danh sách hộp thoại Inbox (Protected)"**.
- Thêm `q` vào mô tả Query Params.
- Cập nhật mẫu request ví dụ: `GET /api/conversations/inbox?limit=20&skip=0&q=090123`

## 3. Hướng dẫn phía Frontend (Client)

- **Debounce:** Frontend cần bọc logic gọi API tìm kiếm với kỹ thuật `debounce` (khoảng 300ms - 500ms) để tránh bắn request liên tục mỗi khi người dùng ấn một phím.
- **Khởi tạo/Xóa bộ lọc:** Khi ô tìm kiếm rỗng (`q=""` hoặc `q=undefined`), API sẽ tự động trả về toàn bộ hộp thoại theo mặc định.
- **State Management (Phân trang):** Khi có sự thay đổi trên thanh tìm kiếm (nhập thêm text), frontend bắt buộc phải reset bộ đếm phân trang (đặt `skip=0`) để lấy lại kết quả tìm kiếm tính từ trang đầu tiên.

## 4. Các bước triển khai (Checklist)

- [ ] 1. Mở rộng file `conversation.validator.js` hỗ trợ `q`.
- [ ] 2. Cập nhật biến đầu vào tại `conversation.controller.js`.
- [ ] 3. Chuyển đổi mã tại `conversation.service.js` sang sử dụng hàm `aggregate`.
- [ ] 4. Escape các ký tự đặc biệt của query `q` để bảo mật.
- [ ] 5. Kiểm thử (Testing) qua Postman / Thunder Client với 2 trường hợp: Không có `q` và Có `q`.
- [ ] 6. Cập nhật file `docs/api/api.md`.
