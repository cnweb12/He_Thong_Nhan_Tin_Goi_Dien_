# Cấu hình Gemini cho Backend

Thư mục này chứa mã nguồn Backend của hệ thống (REST API & WebSockets). Khi làm việc tại đây, hệ thống kế thừa quy tắc tại Workspace Root nhưng áp dụng Tech Stack và quy chuẩn đặc thù cho máy chủ.

## 1. Công nghệ (Tech Stack)
- **Core:** Node.js, Express.js.
- **Database:** MongoDB (Sử dụng Mongoose ORM).
- **Real-time:** Socket.io.
- **Testing:** Native Node.js Test Runner (`node --test`), C8 cho Coverage, `mongodb-memory-server` cho Integration test.

## 2. Tài liệu Chi tiết
Tương tự Frontend, các quy định chuyên sâu của Backend được phân tách thành các tài liệu riêng trong thư mục `agent/docs/`. **Bắt buộc đọc** các file này khi có task liên quan:

- 🎨 **[Quy chuẩn Code (Coding Style)](./agent/docs/convention.md)**: Đặt tên biến, format Response/Error API.
- 🏗️ **[Kiến trúc (Architecture)](./agent/docs/architecture.md)**: Cấu trúc thư mục (Routes, Controllers, Services), Mongoose Models.
- 🧪 **[Quy trình Test (Testing)](./agent/docs/testing.md)**: Thiết lập DB memory ảo, Unit/Integration Test cho API và Socket.

*Lưu ý: Mọi thay đổi liên quan đến cấu trúc hoặc luồng xử lý mới ở Backend phải được cập nhật lại vào các file trên.*