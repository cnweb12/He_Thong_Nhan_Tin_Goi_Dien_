# Server & App Architecture

Tài liệu này giải thích sự phân tách trách nhiệm giữa `app.js` và `server.js` ở thư mục gốc của mã nguồn (`src/`). Việc tách biệt này giúp codebase sạch sẽ, dễ quản lý vòng đời ứng dụng và thuận tiện cho việc kiểm thử (testing).

## `src/app.js` - Tầng Ứng dụng (Application Layer)

File này hoàn toàn tập trung vào việc cấu hình framework Express. Nhiệm vụ chính bao gồm:

- **Khởi tạo Express:** Tạo instance của `express()`.
- **Đăng ký Middleware toàn cục:** Gắn các middleware xử lý request đầu vào (ví dụ: `express.json()` để parse body).
- **Gắn kết Routes:** Tích hợp bộ định tuyến tổng (`routes/index.js`) để phân bổ logic cho các module nghiệp vụ.
- **Xử lý lỗi tập trung:** Đóng vai trò là chốt chặn cuối cùng (Error Handling Middleware) để hứng các exception, chuẩn hóa format lỗi HTTP trả về cho client và đảm bảo an toàn thông tin (ẩn `details` stack trace khi ở môi trường production).

*Lưu ý:* `app.js` **KHÔNG** mở port mạng hay kết nối database. Nhờ đó, bạn có thể import trực tiếp `app` vào các thư viện như `supertest` để chạy Integration Test mà không gặp rủi ro xung đột port hay rò rỉ kết nối mạng.

## `src/server.js` - Tầng Mạng & Tiến trình (Network & Process Layer)

File này là *Entry Point* (điểm chạy đầu tiên) của toàn bộ ứng dụng backend. Nhiệm vụ chính bao gồm:

- **Khởi tạo Hạ tầng:** Kết nối tới cơ sở dữ liệu (MongoDB) và đăng ký các Model trước khi có bất kỳ request nào đi vào.
- **Khởi động HTTP Server:** Truyền `app` vào `http.createServer()` và bắt đầu lắng nghe (`listen`) các kết nối mạng trên cổng được chỉ định (vd: 3000).
- **Graceful Shutdown (Tắt an toàn):** Lắng nghe các tín hiệu hệ thống (`SIGINT`, `SIGTERM` - thường được gửi bởi Docker hoặc khi nhấn Ctrl+C) để:
  1. Ngừng nhận request mới.
  2. Đợi các request hiện tại hoàn thành.
  3. Ngắt kết nối database an toàn.
  4. Thoát tiến trình Node.js (process exit).
- **Quản lý Exception ở mức Process:** Bắt các lỗi promise không được xử lý (`unhandledRejection`) hoặc lỗi văng ra ngoài scope của Express để tránh crash app lặp lại mà không có log.

## Tóm tắt luồng khởi động

1. Node.js thực thi `server.js`.
2. `server.js` import `app.js` (kéo theo toàn bộ route và middleware).
3. Kết nối DB -> Mở port -> Sẵn sàng phục vụ request.
