# Kế hoạch Cải thiện Giao diện Người dùng (UI/UX) cho Frontend

Sau khi phân tích codebase Frontend hiện tại (React, Vite, Tailwind CSS), giao diện đã có cấu trúc cơ bản tốt (sử dụng Tailwind, Lucide Icons, chia layout rõ ràng). Tuy nhiên, để nâng cấp trải nghiệm người dùng (UX) và tính thẩm mỹ (UI) đạt chuẩn ứng dụng nhắn tin hiện đại (như Telegram, Messenger), dưới đây là kế hoạch chi tiết:

## 1. Chuẩn hóa Hệ thống Thiết kế (Design System)

Hiện tại các class Tailwind đang được viết khá dài và có một số inline-styles (ví dụ: `style={{ width: 84 }}`).

- **Áp dụng Component Library:** Tích hợp **shadcn/ui** hoặc **Radix UI** cùng với `class-variance-authority`, `clsx`, và `tailwind-merge`. Điều này giúp chuẩn hóa các UI components cơ bản (Button, Input, Dialog, Dropdown, Avatar) mà không làm mất đi khả năng tuỳ biến của Tailwind.
- **Biến CSS & Theming:** Cấu hình lại `tailwind.config.cjs` để sử dụng CSS Variables cho màu sắc chủ đạo (Primary, Secondary, Background, Muted). Điều này giúp dễ dàng đồng bộ màu sắc và tạo tiền đề cho Dark Mode.

## 2. Hỗ trợ Đa nền tảng và Reponsive Layout

Ứng dụng hiện tại có vẻ đang được tối ưu chủ yếu cho Desktop với các sidebar có chiều rộng cố định.

- **Mobile First:** Sử dụng các utility classes breakpoint của Tailwind (`sm:`, `md:`, `lg:`) để điều chỉnh layout.
- **Giao diện Mobile:** 
  - Ẩn `SidebarLeft` và `ChatSidebar` khi mở một cuộc hội thoại trên màn hình nhỏ.
  - Sử dụng Bottom Navigation Bar hoặc Hamburger Menu thay cho Sidebar trên Mobile.
  - Thêm nút "Back" trong `ChatArea` để quay lại danh sách tin nhắn khi ở giao diện điện thoại.

## 3. Cải thiện Giao diện Nhắn tin (Chat Area)

- **Message Bubbles:** Tối ưu hóa bo góc (border-radius) cho các bong bóng tin nhắn (ví dụ: bo góc nhỏ ở hướng của người gửi để tạo cảm giác mũi tên). Tách biệt rõ ràng màu sắc giữa người gửi (ví dụ: Primary blue) và người nhận (ví dụ: Muted gray).
- **Trạng thái tin nhắn:** Thêm UI cho các trạng thái: Đang gửi (Sending), Đã gửi (Sent), Đã nhận (Delivered), và Đã xem (Read).
- **Typing Indicator:** Thêm animation dấu 3 chấm (...) nhấp nháy mượt mà khi người khác đang gõ phím.
- **Empty States:** Thiết kế màn hình minh họa đẹp mắt khi chưa chọn cuộc hội thoại nào hoặc khi danh sách tin nhắn trống.

## 4. Hỗ trợ Chế độ Tối (Dark Mode)

- Sử dụng tính năng `darkMode: 'class'` của Tailwind.
- Thay thế các màu cứng (hardcoded hex/rgb) bằng các class hệ thống màu (ví dụ: thay `bg-[#0f172a]` bằng `bg-slate-900 dark:bg-black`).
- Thêm nút Toggle Dark/Light mode trong mục Cài đặt hoặc trên `SidebarLeft`.

## 5. Hiệu ứng và Micro-interactions (Animations)

- **Framer Motion hoặc CSS Transitions:** Thêm các hiệu ứng chuyển cảnh mượt mà:
  - Slide-in khi có tin nhắn mới.
  - Fade-in cho các Dialog/Modal (như modal tạo nhóm, tìm kiếm).
  - Hover effects mượt mà hơn cho các Chat Item trong danh sách hội thoại.

## 6. Lộ trình Triển khai (Phasing)

- **Giai đoạn 1: Refactor & Setup (1-2 ngày)**
  - Cài đặt các thư viện hỗ trợ (clsx, tailwind-merge, radix-ui).
  - Loại bỏ inline-styles, gom các class Tailwind chung thành các reusable components (Button, Input).
- **Giai đoạn 2: Responsive & Layout (2-3 ngày)**
  - Cấu trúc lại `Home.jsx` để responsive.
  - Xử lý navigation trên Mobile.
- **Giai đoạn 3: Nâng cấp Chat UI & Micro-interactions (2-3 ngày)**
  - Cải thiện Message Bubbles, Scroll to bottom logic.
  - Thêm hiệu ứng hover, active, loading states.
- **Giai đoạn 4: Theming & Dark Mode (1-2 ngày)**
  - Định nghĩa lại toàn bộ bảng màu trong Tailwind config.
  - Bật Dark mode và test trên toàn hệ thống.

Kế hoạch này sẽ giúp ứng dụng trông chuyên nghiệp, hiện đại, và mang lại trải nghiệm tốt nhất cho cả người dùng Web và Mobile.
