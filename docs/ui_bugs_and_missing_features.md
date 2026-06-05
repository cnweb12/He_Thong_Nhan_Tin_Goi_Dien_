# Báo cáo Lỗi và Các tính năng chưa hoàn thiện (UI/UX)

Trong quá trình nâng cấp giao diện (Giai đoạn 1, 2 và 3), một số lỗi và vấn đề về UX đã xuất hiện. Dưới đây là danh sách tổng hợp để tiến hành khắc phục trong giai đoạn tiếp theo:

## 1. Lỗi Hiển thị và Layout (Bugs)

- **Mất danh sách đoạn chat trên Mobile (Missing Chat List):** 
  - *Nguyên nhân:* Logic hiện tại trong `Home.jsx` tự động chọn cuộc hội thoại đầu tiên (`selectedId`). Khi có `selectedId`, CSS class `-translate-x-full` sẽ ẩn danh sách đoạn chat trên màn hình nhỏ (Mobile).
  - *Hậu quả:* Người dùng mở app trên điện thoại sẽ bị đẩy thẳng vào màn hình chat mà không thấy danh sách các cuộc hội thoại.

- **Độ tương phản thấp và Phông chữ (Low Contrast & Typography):**
  - *Nguyên nhân:* Việc sử dụng các màu như `text-slate-400`, `text-white/70`, `text-white/60` cho nội dung phụ (thời gian, icon trạng thái) khiến giao diện khó đọc trong một số điều kiện ánh sáng. Kích thước chữ `text-[15px]` có thể không phù hợp với tất cả màn hình.
  - *Hậu quả:* Giảm khả năng đọc (accessibility) và trải nghiệm người dùng không thoải mái.

- **Đăng nhập chậm hơn bình thường (Slow Login/Loading):**
  - *Nguyên nhân:* Cơ chế chờ dữ liệu khởi tạo (Bootstrapping) trong `Home.jsx` đang block toàn bộ giao diện cho đến khi cả `fetchCurrentUser()`, `fetchInbox()`, và Socket kết nối xong (hoặc thất bại).
  - *Hậu quả:* Màn hình "Đang tải dữ liệu..." hiển thị quá lâu, tạo cảm giác app bị treo.

## 2. Các Nút/Tính năng chưa được Implement (Missing Features)

Nhiều nút trên giao diện hiện tại chỉ mang tính chất minh họa (mockup) và chưa được gắn sự kiện `onClick` hay chức năng tương ứng:

**Trong `ChatHeader.jsx` (Khung chat):**
- Nút Tìm kiếm tin nhắn (`Search`)
- Nút Gọi điện thoại (`Phone`)
- Nút Gọi Video (`Video`)
- Nút Thông tin đoạn chat (`Info`)
- Nút Menu mở rộng (`MoreVertical`)

**Trong `SidebarLeft.jsx` (Thanh điều hướng trái):**
- Nút Thông báo (`Bell`)
- Nút Cài đặt (`Settings`)
- Nút Tài khoản (`CircleUserRound` / Avatar)

**Trong `MessageInput.jsx` (Thanh nhập tin nhắn):**
- Nút Gửi Emoji (`Smile`)
- Nút Đính kèm file/hình ảnh (`Paperclip`)

**Trong `ChatSidebar.jsx` (Danh sách hội thoại):**
- Các tab lọc (Filter tabs) "Ưu tiên" và "Khác" hiện tại chỉ là nút tĩnh.

---
**Đề xuất hướng giải quyết tiếp theo:**
1. Sửa lỗi logic tự động chọn `selectedId` mặc định trên nền tảng Mobile để không làm ẩn danh sách chat.
2. Cập nhật lại hệ màu (Contrast ratio) cho các text phụ trong `MessageBubble.jsx`.
3. Tách biệt luồng loading của UI và dữ liệu, cho phép hiển thị khung sườn app (Skeleton) thay vì block toàn màn hình lúc đăng nhập.
4. Triển khai dần chức năng cho các nút bị thiếu hoặc thêm các thông báo "Tính năng đang phát triển" (Toast/Tooltip) khi người dùng nhấn vào.
