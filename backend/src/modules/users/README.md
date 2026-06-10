# Module Users

Module `users` chịu trách nhiệm quản lý dữ liệu hồ sơ người dùng và các hành vi liên quan trực tiếp tới tài khoản.

## Cấu trúc hiện tại

- `models/user.model.js`
  Định nghĩa schema `users` trong MongoDB.
- `models/friend.model.js`
  Lưu quan hệ bạn bè và trạng thái lời mời giữa các user.
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
  `theme`, `language`, `allowStrangerMessage`, `readReceiptEnabled`
- Gửi lời mời kết bạn
- Chấp nhận lời mời kết bạn
- Danh sách bạn bè hiện tại
- Danh sách lời mời kết bạn đang chờ
- Xóa quan hệ bạn bè

## Chức năng liên quan đến bạn bè

Module `users` hiện quản lý luôn luồng kết bạn cơ bản thông qua collection `user_friends`.

### Trạng thái quan hệ

- `pending`
  User A đã gửi lời mời cho user B.
- `accepted`
  Hai user đã trở thành bạn bè.

### Luồng nghiệp vụ

- User gửi lời mời kết bạn tới một user khác bằng `POST /api/users/:userId/friends`
- User nhận lời mời có thể chấp nhận bằng `POST /api/users/:userId/friends/accept`
- User xem danh sách bạn bè của mình bằng `GET /api/users/me/friends`
- User xem danh sách lời mời chờ xử lý bằng `GET /api/users/me/friend-requests`
- User xóa quan hệ bạn bè bằng `DELETE /api/users/:userId/friends`

### Quy tắc xử lý

- Không cho gửi lời mời cho chính mình
- Không cho gửi trùng lời mời đang ở trạng thái `pending`
- Nếu hai user đã là bạn bè thì sẽ báo lỗi `Already friends`
- Khi chấp nhận lời mời, hệ thống cập nhật cả hai chiều quan hệ nếu cần
  
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

- `GET /api/users/me`
  Lấy thông tin của user hiện tại
- `PATCH /api/users/me`
  Cập nhật hồ sơ user hiện tại
- `PATCH /api/users/me/settings`
  Cập nhật phần cài đặt
- `GET /api/users/search?q=...`
  Tìm kiếm user
- `GET /api/users/:userId`
  Lấy thông tin user theo `id`
- `GET /api/users/me/friends`
  Lấy danh sách bạn bè hiện tại
- `GET /api/users/me/friend-requests`
  Lấy danh sách lời mời kết bạn đang chờ
- `POST /api/users/:userId/friends`
  Gửi lời mời kết bạn tới user khác
- `POST /api/users/:userId/friends/accept`
  Chấp nhận lời mời kết bạn
- `DELETE /api/users/:userId/friends`
  Xóa quan hệ bạn bè giữa hai user

## Kiểm thử

Module này có test cho từng lớp:

- `tests/modules/users/user.validator.test.js`
- `tests/modules/users/user.service.test.js`
- `tests/modules/users/user.controller.test.js`
- `tests/modules/users/user.routes.test.js`
