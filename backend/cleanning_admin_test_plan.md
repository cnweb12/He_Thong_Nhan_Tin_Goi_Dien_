# Kế hoạch dọn dẹp và sửa lỗi Test cho Admin Module

## Phân tích hiện trạng
Trong quá trình chạy test cho Admin Module (`tests/modules/admin/`), đã phát sinh khoảng 86 test case bị fail với các lỗi như TypeError, Timeout, và Mocking không hợp lệ. Các lỗi này tập trung ở 4 file chính:
1. `admin.controller.test.js`
2. `admin.routes.test.js`
3. `admin.service.test.js`
4. `admin.validator.test.js`

## Mục tiêu
Fix toàn bộ lỗi test trong thư mục `admin` để đạt 100% Passed.

## Các hạng mục công việc (Checklist)

### 1. Nhóm 1: Sai tên hàm Validator khi Mock (`admin.controller.test.js` & `admin.validator.test.js`)
- **Vấn đề:** 
  - `admin.controller.test.js`: Mock các hàm không tồn tại (ví dụ: `validateGetAllUsers` thay vì `validatePaginationParams`).
  - `admin.validator.test.js`: Quên import `afterEach` từ `node:test`.
- **Hành động:**
  - [ ] Đồng bộ hóa tên hàm validator. Dễ nhất là sửa file `admin.controller.test.js` và `admin.validator.test.js` để import và mock đúng tên hàm có trong `admin.validator.js` (`validatePaginationParams`, `validateUserLockRequest`, `validateRoleChangeRequest`, `validateMessageSearchFilters`, `validateSystemSettingsUpdate`, `validateBannedKeywordRequest`).
  - [ ] Thêm import `afterEach` vào `admin.validator.test.js`.

### 2. Nhóm 2: Lỗi kỹ thuật khi Mock Middleware (`admin.routes.test.js`)
- **Vấn đề:** 
  - File test đang cố gắng mock một hàm bóc tách (`requireRole`) bằng cú pháp `mock.method(requireRole, ...)` gây ra lỗi `TypeError`.
- **Hành động:**
  - [ ] Bỏ cách mock middleware bóc tách. Thay vào đó, mock module middleware trước khi nó được nạp, hoặc cập nhật logic mock để áp dụng `mock.method` trực tiếp lên module cha (`require("../../auth/middleware/authorization.middleware")`). Do Node.js native test runner có cơ chế mock module riêng biệt, sẽ cần xem xét cú pháp chuẩn cho module gốc. Trong trường hợp cần thiết, có thể dùng supertest để test route một cách trọn vẹn hơn.

### 3. Nhóm 3: Lỗi thiếu chuỗi hàm (Chaining) của Mongoose (`admin.service.test.js`)
- **Vấn đề:** 
  - Các mock object cho hàm `UserModel.find()`, `MessageModel.find()` chỉ trả về mảng thông thường, không hỗ trợ chuỗi hàm (`.select()`, `.sort()`).
- **Hành động:**
  - [ ] Viết lại Mongoose Mock. Cập nhật các mock `find()`, `findById()` để trả về một object (hoặc query builder mock) có chứa các hàm `.select()`, `.sort()`, `.limit()`, và `.exec()`/hoặc thenable để chuỗi thực thi hoạt động bình thường. Nếu dự án có `mongodb-memory-server` được cấu hình, có thể cân nhắc gỡ bỏ các thủ thuật mock và sử dụng In-Memory DB thực thụ cho service.

### 4. Nhóm 4: Lỗi định dạng ObjectId và Timeout Mongoose (`admin.service.test.js`)
- **Vấn đề:** 
  - Truyền string ID như `"msg1"` không hợp lệ cho ObjectId.
  - Gọi thực thi logic chưa được kết nối DB (timeout do buffering) hoặc chưa mock hàm `SystemSettingsModel.bulkWrite` / `BannedKeywordModel.findOneAndUpdate`.
- **Hành động:**
  - [ ] Cập nhật toàn bộ các ID ảo trong file test thành chuẩn ObjectId 24 ký tự hex (ví dụ: `507f1f77bcf86cd799439011`).
  - [ ] Đảm bảo các hàm Mongoose còn thiếu được mock đầy đủ (hoặc sử dụng In-Memory DB) để ngăn ngừa tình trạng timeout.

## Ghi chú thêm
- Quá trình thực hiện sẽ được tiến hành từng bước và xác thực lại bằng lệnh `node --test tests/modules/admin/*.test.js` để đảm bảo không bỏ sót case nào.
