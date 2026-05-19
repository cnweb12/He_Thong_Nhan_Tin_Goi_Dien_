Ưu tiên 1: Tầng HTTP & Tính ổn định (Làm ngay)
[v] Centralized Error Handling (Xử lý lỗi tập trung):
Lý do: Trong user.service.js, bạn đã sử dụng createHttpError ném lỗi chuẩn, nhưng theo src/middleware/README.md, phần hứng lỗi ở tầng app dường như chưa hoàn chỉnh.
Hành động: Viết một Error Middleware đặt tại src/middleware/error.middleware.js để hứng mọi exception, tránh sập app và ẩn stack trace khỏi client ở môi trường production.
[v] Rate Limiting (Giới hạn request):
Lý do: Được đề cập trong security.md là "Rủi ro/việc nên làm tiếp".
Hành động: Triển khai ngay middleware giới hạn số lượng request cho các route nhạy cảm: POST /api/auth/login, GET /api/users/search, và POST /api/messages để chống brute-force và spam.
Ưu tiên 2: Củng cố Bảo mật (Security Hardening)
Refresh Token Rotation & Replay Detection:
Lý do: Module auth đã cấp refresh token và lưu vào DB, nhưng tài liệu ghi chú cần làm thêm "hardening chi tiết".
Hành động: Khi client dùng refresh token cũ (đã sử dụng), hệ thống phải phát hiện (replay attack) và tự động thu hồi (revoke) toàn bộ chuỗi token của thiết bị đó.
Policy rõ ràng cho dữ liệu người dùng:
Lý do: Cần tránh vô tình làm lộ thông tin nhạy cảm ở các endpoint mới sau này.
Hành động: Định nghĩa cứng quy tắc/helper trong mã nguồn về việc tách biệt rõ Public Profile (chỉ trả về id, displayName, avatar) và Private Profile (trả thêm phone, settings). Hiện tại hàm sanitizeUser đã làm một phần, nhưng cần kiểm soát chặt hơn.
Ưu tiên 3: Vận hành & Theo dõi (Observability)
Logging & Request Tracing:
Lý do: Cần thiết cho production để debug (nêu trong middleware/README.md).
Hành động: Thêm middleware ghi log (vd: morgan hoặc pino-http) để theo dõi request in/out, thời gian phản hồi.
Audit Log cho hành động nhạy cảm:
Lý do: Đề cập ở security.md.
Hành động: Ghi log database (hoặc file riêng) khi user đổi mật khẩu, đăng xuất toàn bộ thiết bị, hoặc thay đổi quyền.
Ưu tiên 4: Tự động hóa & Tooling
Bảo mật tĩnh (SAST / Dependency Audit):
Tích hợp npm audit hoặc các tool quét mã nguồn tĩnh vào CI pipeline để đảm bảo các package không chứa lỗ hổng (như tài liệu đã đề xuất).

---
## Kế hoạch triển khai Integration Test độc lập (Sử dụng In-Memory DB)

**Mục tiêu:** Cài đặt môi trường test tự động, độc lập, chạy DB trên RAM để đảm bảo tốc độ và tính nhất quán (Local, CI/CD). Loại bỏ rủi ro về Race Condition và tối ưu tốc độ chạy test.

**Các bước thực hiện (Phase 1: Test Infrastructure):**

1. **[v] Cài đặt thư viện:**
   - Chạy `npm install --save-dev mongodb-memory-server`.

2. **[v] Refactor Khởi tạo App (Rất Quan Trọng - Chống Race Condition):**
   - Đảm bảo `src/app.js` **chỉ** khởi tạo Express middleware/routes và export `app`. KHÔNG gọi kết nối Mongoose ở đây.
   - `src/server.js` sẽ import `app`, gọi kết nối Mongoose thật (từ file `.env`), và chạy `app.listen()`.
   - Lợi ích: Khi chạy test, ta chỉ import `app.js`, tự kiểm soát luồng kết nối DB ảo mà không bị file `server.js` giành quyền kết nối DB thật.

3. **[v] Cấu hình Global Test Setup & Xử lý Concurrency:**
   - Tạo module: `tests/config/database/memory-db.setup.js`.
   - Node Native Test (`node --test`) chạy các file đồng thời (parallel). Cần viết một script **Global Setup** để đảm bảo chỉ tạo ra **1 instance** của `MongoMemoryServer` duy nhất nhằm tránh tràn RAM và xung đột Port.
   - Ghi đè biến môi trường: Ngay khi lấy được URI ảo từ server ảo, lập tức gọi `process.env.MONGO_URI = memoryServerUri;` trước khi import bất kỳ Model nào.

4. **[] Quản lý Vòng đời Test (Lifecycle Hooks):**
   - `beforeAll()` (Global): Kết nối Mongoose vào URI ảo.
   - `beforeEach()` (Per Test):
     - Gọi `clearDatabase()`: Xóa sạch các collection.
     - Gọi `seedStaticData()`: (Bổ sung) Khởi tạo các dữ liệu tĩnh bắt buộc phải có (ví dụ: System Configs, Roles) để các hàm test không bị crash do thiếu data gốc.
   - `afterAll()` (Global): Ngắt kết nối Mongoose, drop database ảo và tắt `MongoMemoryServer`.

5. **[] Cập nhật NPM Scripts & CI/CD Optimization:**
   - Chuẩn hóa lệnh `npm test` để tự động load Global Setup và chạy test In-Memory.
   - Đổi tên script test Docker thành `npm run test:e2e` (End-to-End).
   - Thêm cấu hình vào CI/CD pipeline (VD: GitHub Actions) để cache lại thư mục `~/.cache/mongodb-binaries`. Việc này tránh việc mỗi lần push code CI lại phải tải lại >100MB bộ cài MongoDB.

6. **Xác thực kết quả:**
   - Tắt hoàn toàn Docker service (chứng minh tính độc lập).
   - Chạy `npm test` và verify luồng API Đăng ký -> Kiểm tra Model -> Đăng nhập hoàn tất trong vài mili-giây.
