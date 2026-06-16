# Module Auth

Module `auth` chịu trách nhiệm xác thực người dùng, phát hành token, quản lý refresh token và các API liên quan tới phiên đăng nhập.

## Vai trò trong hệ thống

Đây là module vào cửa của backend:

- tạo tài khoản mới
- đăng nhập và cấp `accessToken`
- cấp lại access token bằng refresh token
- đăng xuất một thiết bị hoặc toàn bộ thiết bị
- cung cấp middleware xác thực JWT cho các module khác

Module này liên kết trực tiếp với:

- `users`
  để tạo và đọc thông tin user
- `devices`
  để theo dõi trạng thái đăng nhập theo thiết bị

## Cấu trúc module

### Models

- `models/refresh-token.model.js`
  Lưu refresh token đã hash, gắn với `userId` và `deviceId`

### Services

- `services/auth.service.js`
  Xử lý nghiệp vụ refresh token:
  - `createRefreshToken()`
  - `findRefreshToken()`
  - `findUserRefreshTokens()`
  - `verifyRefreshToken()`
  - `revokeRefreshToken()`
  - `revokeAllUserRefreshTokens()`
  - `revokeOtherDeviceTokens()`
  - `deleteExpiredTokens()`

### Middleware

- `middleware/auth.middleware.js`
  Chứa các utility JWT:
  - tạo JWT
  - verify JWT
  - tách token từ Authorization header
  - middleware `authenticateJWT()`

### Validators

- `validators/auth.validator.js`
  Kiểm tra dữ liệu đầu vào cho:
  - register
  - login
  - refresh token
  - update profile

### Controllers

- `controllers/auth.controller.js`
  Xử lý các request auth:
  - `register()`
  - `login()`
  - `refreshAccessToken()`
  - `logout()`
  - `logoutAll()`
  - `getProfile()`
  - `updateProfile()`
  - `changePassword()`

### Routes

- `routes/auth.routes.js`
  Khai báo các endpoint `/api/auth`

## Các API chính

### Public routes

**POST /api/auth/register**

```json
{
  "phone": "0901234567",
  "displayName": "John Doe",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

**POST /api/auth/login**

```json
{
  "phone": "0901234567",
  "password": "password123",
  "deviceId": "device-uuid",
  "platform": "web"
}
```

**POST /api/auth/refresh**

```json
{
  "refreshToken": "token-string",
  "deviceId": "device-uuid"
}
```

### Protected routes

Các route sau yêu cầu `Authorization: Bearer <accessToken>`:

- `GET /api/auth/me`
  Lấy thông tin user hiện tại
- `PATCH /api/auth/profile`
  Cập nhật hồ sơ cơ bản
- `POST /api/auth/change-password`
  Đổi mật khẩu
- `POST /api/auth/logout`
  Đăng xuất một thiết bị
- `POST /api/auth/logout-all`
  Đăng xuất toàn bộ thiết bị

## Quản lý token

- **Access Token**
  JWT sống ngắn, hiện tại mặc định 1 giờ
- **Refresh Token**
  Token sống dài hơn, được hash trước khi lưu DB
- **Device tracking**
  Mỗi lần login sẽ create/update `user_device`
- **Multi-device support**
  Một user có thể có nhiều phiên đăng nhập song song

## Ví dụ response (tóm tắt)

- **POST /api/auth/register** (201 Created)

```json
{
  "user": { "_id": "u123", "phone": "0901234567", "displayName": "John Doe" },
  "accessToken": "<access-token>",
  "refreshToken": "<refresh-token>",
  "expiresIn": 3600
}
```

- **POST /api/auth/login** (200 OK)

```json
{
  "accessToken": "<access-token>",
  "refreshToken": "<refresh-token>",
  "expiresIn": 3600
}
```

- **POST /api/auth/refresh** (200 OK)

```json
{
  "accessToken": "<new-access-token>",
  "expiresIn": 3600
}
```

## Biến môi trường liên quan (khai quát)

- `JWT_SECRET` — secret dùng để ký/verify access token
- `JWT_EXPIRES_IN` — TTL access token (ví dụ `1h`) nếu cấu hình trong app
- `REFRESH_TOKEN_EXPIRES_IN` — (tùy implementation) TTL cho refresh token nếu có
- `NODE_ENV` — ảnh hưởng cách app trả lỗi
- `DATABASE_URL` / `MONGO_URI` — kết nối DB (nếu module đọc trực tiếp)

Lưu ý: tên env var có thể khác trong codebase; kiểm tra `config/` hoặc `src/config` để biết chính xác.

## Mount router

Module được mount tại router tổng; tham khảo [src/routes/index.js](src/routes/index.js#L1) để biết vị trí mount và middleware chung.

## Hướng dẫn test nhanh

- Ví dụ `curl` login:

```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901234567","password":"password123","deviceId":"dev-1"}'
```

- Ví dụ `curl` refresh:

```bash
curl -X POST "http://localhost:3000/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh-token>","deviceId":"dev-1"}'
```

- Snippet supertest (khung):

```js
const request = require('supertest');
const app = require('../../../app');

it('login and refresh flow', async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ phone: '0901234567', password: 'password123', deviceId: 'dev-1' });

  const { refreshToken } = loginRes.body;

  const refreshRes = await request(app)
    .post('/api/auth/refresh')
    .send({ refreshToken, deviceId: 'dev-1' });

  expect(refreshRes.status).toBe(200);
  expect(refreshRes.body.accessToken).toBeDefined();
});
```

## Bảo mật & hardening (đề xuất)

- Áp dụng rate-limit / captcha cho `POST /api/auth/login` để giảm brute-force.
- Log và cảnh báo khi có nhiều lần refresh/revoke thất bại.
- Hạn chế thông tin lỗi trả về (tránh leak lý do không thành công quá chi tiết).

## Lưu ý quan trọng

- backend không tin dữ liệu identity từ frontend
- `userId` của request protected luôn phải lấy từ JWT đã verify
- refresh token hiện được quản lý trong DB thay vì chỉ dựa vào JWT stateless
