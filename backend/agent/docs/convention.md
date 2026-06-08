# Backend Coding Conventions

## 1. Đặt tên (Naming)
- **Files/Folders:** Sử dụng `kebab-case` (VD: `user.controller.js`, `error.middleware.js`).
- **Classes/Models:** Sử dụng `PascalCase` (VD: `UserModel`, `ConversationService`).
- **Variables/Functions:** Sử dụng `camelCase` (VD: `getUserById`, `activeConnections`).
- **Constants:** Sử dụng `UPPER_SNAKE_CASE` (VD: `MAX_UPLOAD_SIZE`, `TOKEN_EXPIRY`).

## 2. Error Handling & Response
- Bắt buộc phải có khối `try...catch` ở tầng Controller. Bắt lỗi và chuyển nó qua `next(error)` để Global Error Middleware xử lý.
- Dùng các lớp lỗi (Custom Error Classes) được định nghĩa sẵn trong `src/common/errors/` thay vì throw `Error` chung chung (Ví dụ: `throw new NotFoundError(...)`).
- Trả về dữ liệu theo cấu trúc chuẩn định nghĩa ở `src/common/response/`.

## 3. Best Practices
- Không sử dụng `console.log` trong production code, dùng logger nếu có.
- Tuyệt đối không hardcode mật khẩu, API key, Secret key trong code. Bắt buộc lấy từ biến môi trường `process.env`.
- Database Queries: Tránh query N+1, ưu tiên sử dụng `.populate()` hoặc `.aggregate()` hợp lý.

## 4. Tiêu chuẩn Hoàn thành (Definition of Done - DoD)
Một task Backend **chỉ được xem là hoàn thành** khi bắt buộc thỏa mãn các tiêu chí sau:
- **Logic & Style:** Code chạy đúng yêu cầu, không có warning từ linter và không có code thừa (dead code).
- **Validation:** Mọi dữ liệu đầu vào (params, query, body) đều được kiểm tra chặt chẽ trước khi xử lý.
- **Testing:** Pass 100% các Test case (`npm run test`), test bao phủ cả "Happy Path" và "Unhappy Path".
- **Documentation:** Bổ sung/Cập nhật docstring cho API mới.
- **Context Sync:** Đã tự động cập nhật tiến độ vào file `session_summary.md` (và `session_progress.md` nếu có thay đổi Backlog).