# Cấu hình Gemini cho Frontend

Thư mục này chứa mã nguồn Frontend của hệ thống. Khi làm việc tại đây, hệ thống kế thừa quy tắc tại Workspace Root nhưng áp dụng Tech Stack và quy chuẩn đặc thù cho giao diện.

## 1. Công nghệ (Tech Stack)
- **Core:** React 19, Vite, React Router DOM (v6).
- **Styling:** Tailwind CSS (v4), Lucide React.
- **Real-time:** Socket.io-client.
- **Testing:** Vitest, React Testing Library, jsdom.

## 2. Tài liệu Chi tiết
Để tối ưu hóa ngữ cảnh và không làm quá tải `GEMINI.md`, các quy định chuyên sâu đã được tách thành các tài liệu riêng. **Bắt buộc đọc** các file sau khi có task liên quan:

- 🎨 **[Quy chuẩn Code (Coding Style)](./agent/docs/convention.md)**: Cách đặt tên, quy tắc viết React Component, Tailwind.
- 🏗️ **[Kiến trúc (Architecture)](./agent/docs/architecture.md)**: Cấu trúc thư mục, luồng dữ liệu, phân chia Component/Pages.
- 🧪 **[Quy trình Test (Testing)](./agent/docs/testing.md)**: Sử dụng Vitest, mock data, nguyên tắc test UI và custom hooks.

*Lưu ý: Mọi thay đổi liên quan đến kiến trúc hoặc tiêu chuẩn mới phải được cập nhật lại vào các file trên.*
