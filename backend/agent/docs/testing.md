# Backend Testing Guidelines

## 1. Công cụ & Môi trường
- **Test Runner:** Sử dụng Native Node.js Test Runner (`node --test`).
- **Assertions:** Dùng module `assert` mặc định của Node.js.
- **Database:** Sử dụng `mongodb-memory-server` để giả lập cơ sở dữ liệu trên RAM. Mỗi file test nên làm sạch (cleanup) DB sau khi chạy xong để đảm bảo tính độc lập.

## 2. Quy trình viết Test
- **Phạm vi Test:** Bao phủ Controller (HTTP responses), Service (Logic, DB Operations) và Socket Events.
- **Mocking:** Hạn chế Mock Database. Thay vào đó, hãy insert dữ liệu thật vào `mongodb-memory-server` trước mỗi block `describe` và xóa đi trong block `afterEach`.
- **Cấu trúc File Test:** Đặt theo cấu trúc thư mục của source code (Ví dụ test cho `src/modules/users` thì nằm trong `tests/modules/users`). Tên file test kết thúc bằng `.test.js`.

## 3. Coverage
- Đảm bảo viết đủ các case `Happy Path` (thành công) và `Unhappy Path` (thất bại, validate lỗi, lỗi database) cho các hàm Service và API quan trọng. Chạy lệnh `npm run test:coverage` (dùng `c8`) để kiểm tra.