# Module Messages

Module `messages` chịu trách nhiệm lưu trữ và xử lý nghiệp vụ liên quan tới tin nhắn trong từng cuộc trò chuyện.

## Cấu trúc hiện tại

- `models/message.model.js`
  Định nghĩa schema `messages`, attachment và reaction.
- `services/message.service.js`
  Xử lý nghiệp vụ gửi tin nhắn và đọc lịch sử tin nhắn.
- `validators/message.validator.js`
  Kiểm tra dữ liệu đầu vào cho API messages.
- `controllers/message.controller.js`
  Nhận request HTTP và gọi service.
- `routes/message.routes.js`
  Khai báo API endpoint của module.

## Chức năng đã triển khai

- Gửi tin nhắn mới vào một conversation
- Tăng `seq` tự động cho từng tin nhắn trong conversation
- Cập nhật `lastMessage` và `lastActivityAt` cho conversation
- Tăng `unreadCount` cho các thành viên khác
- Đồng bộ `user_conversation_inbox`
- Lấy lịch sử tin nhắn của một conversation theo phân trang cơ bản

## Các API chính

- `POST /api/messages`
  Gửi một tin nhắn mới
- `GET /api/messages/conversations/:conversationId`
  Lấy danh sách tin nhắn của conversation

## Luồng xử lý khi gửi tin nhắn

1. Route nhận request
2. Auth middleware xác thực JWT
3. Controller gọi validator
4. Service kiểm tra membership trong conversation
5. Service tạo message trong transaction
6. Service cập nhật conversation, member unread count và inbox
7. Trả message mới tạo về client

## Kiểm thử

Module này có test cho từng lớp:

- `tests/modules/messages/message.validator.test.js`
- `tests/modules/messages/message.service.test.js`
- `tests/modules/messages/message.controller.test.js`
- `tests/modules/messages/message.routes.test.js`
