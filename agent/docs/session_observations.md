# Session Observations

*File này ghi lại các quan sát, bug, suggestion hoặc improvement phát hiện trong quá trình làm việc nhưng cần được xử lý theo phạm vi/task riêng.*

## 10/06/2026

- **Backend settings contract bị lệch tên field:**
  - `backend/src/modules/users/models/user.model.js` dùng `settings.allowStrangerMessage`.
  - `backend/src/modules/users/validators/user.validator.js`, `backend/src/modules/users/services/user.service.js`, một số test và docs API đang dùng `allowStrangerMessages`.
  - `backend/docs/DATABASE_CONVENTIONS.md` xác nhận tên đúng là `allowStrangerMessage`.
  - Rà soát lịch sử cho thấy nguyên nhân là contract bị khai báo thủ công ở nhiều nơi: validator/service/tests của module users dùng plural từ commit `d453f3a`, trong khi model/DB convention/admin docs dùng singular ở các commit sau (`f3e1902`, `2ceded2`, `ebbb31a`).
  - Lỗi lọt qua vì users unit tests mock `UserModel` và assert đúng field plural trong service, còn integration tests chỉ update `theme/language`, chưa cover boolean settings qua Mongoose/DB thật.
  - Trạng thái: đã xử lý trong code/tests/docs bằng `allowStrangerMessage` và bổ sung `readReceiptEnabled`.
  - Còn lại: cân nhắc migration `$rename` nếu DB đã từng lưu field sai `settings.allowStrangerMessages`.

- **Test helper integration có dấu hiệu stale contract:**
  - `backend/tests/integration/helpers/test-data.js#createProfileUpdateData()` tạo `avatar` và `status`, trong khi `PATCH /api/users/me` nhận `username`, `displayName`, `avatarUrl`.
  - `backend/tests/integration/helpers/test-data.js#createDeviceData()` tạo `deviceType`, `deviceName`, `osVersion`, `appVersion`, trong khi `/api/devices/current` nhận `deviceId`, `platform`, `pushToken`, `isOnline`, `lastActiveAt`.
  - Hiện chưa gây lỗi trực tiếp vì test đang override hoặc tự tạo payload đúng, nhưng đây là cùng kiểu drift tài liệu/helper so với API contract và nên dọn ở task test-maintenance.

- **DB schema hardening cần mở rộng ngoài users.settings:**
  - `system_settings` là key-value linh hoạt: Mongoose dùng `Schema.Types.Mixed`, DB `$jsonSchema` chỉ kiểm `key/value/type`, validator admin hiện chỉ kiểm body có object `settings`. Nếu muốn chống drift, cần registry key/type/defaults ở application layer trước khi siết sâu hơn.
  - Collection `user_friends` có Mongoose model `backend/src/modules/users/models/friend.model.js`, nhưng chưa có `$jsonSchema` trong `backend/database/mongo/init/01-init-chat-app.js` và chưa được require trong `backend/database/mongo/register-models.js`; index sync hiện có nguy cơ bỏ sót model này.
  - Admin service đang ghi `users.isLocked` và `users.lockedAt`, docs admin cũng mô tả hai field này, nhưng `UserModel` và DB `$jsonSchema` hiện chưa khai báo. Nếu bật `additionalProperties: false` top-level `users`, luồng lock/unlock sẽ cần được chuẩn hóa trước.
  - Admin routes thật dùng `/api/admin/settings`, trong khi một số route tests vẫn tìm `/system-settings`; cần xác minh và cập nhật test/docs nếu implement schema hardening cho admin settings.

- **ProfilePage hiện là placeholder:**
  - `frontend/src/features/users/ProfilePage.jsx` chỉ hiển thị tiêu đề và mô tả ngắn.
  - Chưa được mount route trong `App.jsx`.
  - Nút "Tài khoản" trong `SidebarLeft.jsx` chưa điều hướng tới profile.
  - Trạng thái: đã xử lý bằng protected route `/profile`, nút Account route-aware và trang profile đầy đủ.

- **Device ID frontend chưa thống nhất:**
  - `frontend/src/features/auth/services/authApi.js` đang hardcode `device-uuid-1234` cho login/logout/refresh.
  - `frontend/src/features/realtime/hooks/useSocket.js` lại dùng `getDeviceId()` từ `frontend/src/utils/device.js`.
  - Đánh giá mức độ: medium, khả năng là giá trị tạm từ giai đoạn test/dev nhưng hiện đã nằm trong runtime frontend.
  - Không phải blocker cho Profile overview, chỉnh sửa hồ sơ, settings cơ bản hoặc đổi mật khẩu.
  - Trạng thái: đã chuẩn hóa `authApi` để login/logout/refresh dùng `getDeviceId()`; socket và auth dùng cùng helper.

- **Luồng đổi mật khẩu cần local logout riêng:**
  - Backend `POST /api/auth/change-password` revoke refresh tokens sau khi đổi mật khẩu.
  - Frontend hiện chỉ có `logout()` trong `AuthProvider`, hàm này gọi `/api/auth/logout` rồi mới clear session.
  - Trạng thái: đã thêm `forceLogout()` trong `AuthProvider` và dùng sau khi đổi mật khẩu thành công.

- **Profile data source cần được chốt:**
  - `AuthProvider.fetchCurrentUser()` hiện gọi `/api/auth/me`.
  - Kế hoạch Profile/settings lại cần API self-profile `/api/users/me`, `PATCH /api/users/me`, `PATCH /api/users/me/settings`.
  - Trạng thái: đã chốt Profile dùng `/api/users/me`, `PATCH /api/users/me`, `PATCH /api/users/me/settings`; sau update sync lại `AuthContext.user`.

- **SidebarLeft đang phụ thuộc Home local state:**
  - `SidebarLeft` nhận `active`, `onSelect`, `isChatListOpen`, `setIsChatListOpen`, phù hợp màn `Home`.
  - Nếu dùng lại `SidebarLeft` trên route `/profile`, cần chốt hành vi các nút `chat/contacts/cloud/task`: điều hướng về `/` hoặc hỗ trợ callback route-aware.
  - Trạng thái: đã làm nút Account route-aware và Profile có nút "Quay lại chat"; chưa refactor navigation rộng.

- **Route bạn bè trong users có nguy cơ bị che bởi `/:userId`:**
  - `backend/src/modules/users/routes/user.routes.js` khai báo `router.get("/:userId", controller.getUserById)` trước `GET /me/friends` và `GET /me/friend-requests`.
  - Express match theo thứ tự nên các route `/api/users/me/friends` và `/api/users/me/friend-requests` có thể không tới đúng handler.
  - Đề xuất task riêng: đưa các route `/me/friends` và `/me/friend-requests` lên trước `/:userId` và bổ sung routes test để khóa thứ tự.
