# Module Users

Module `users` chịu trách nhiệm quản lý dữ liệu hồ sơ người dùng và các hành vi liên quan trực tiếp tới tài khoản.

## Cấu trúc hiện tại

- `models/user.model.js`
  Định nghĩa schema `users` trong MongoDB.
- `services/user.service.js`
  Xử lý nghiệp vụ liên quan tới người dùng.
- `controllers/user.controller.js`
  Nhận request HTTP, gọi validator và service.
- `routes/user.routes.js`
  Khai báo các API endpoint của module.
- `validators/user.validator.js`
  Kiểm tra dữ liệu đầu vào từ request.

## Chức năng đã triển khai

- Lấy thông tin của user đang đăng nhập
- Lấy thông tin user theo `id`
- Tìm kiếm user theo `displayName`, `username`, hoặc `phone`
- Cập nhật hồ sơ cá nhân:
  `username`, `displayName`, `avatarUrl`
- Cập nhật cài đặt người dùng:
  `theme`, `language`, `allowStrangerMessages`

## Luồng xử lý của module

Một request đi qua module `users` thường theo thứ tự:

1. `routes`
2. `auth middleware`
3. `controller`
4. `validator`
5. `service`
6. `model`
7. trả response

## Các API chính

- `GET /users/me`
  Lấy thông tin của user hiện tại
- `PATCH /users/me`
  Cập nhật hồ sơ user hiện tại
- `PATCH /users/me/settings`
  Cập nhật phần cài đặt
- `GET /users/search?q=...`
  Tìm kiếm user
- `GET /users/:userId`
  Lấy thông tin user theo `id`

## Kiểm thử

Module này có test cho từng lớp:

- `tests/modules/users/user.validator.test.js`
- `tests/modules/users/user.service.test.js`
- `tests/modules/users/user.controller.test.js`
- `tests/modules/users/user.routes.test.js`
