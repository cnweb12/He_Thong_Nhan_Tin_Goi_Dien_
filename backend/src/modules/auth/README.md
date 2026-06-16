# Module Auth

Module `auth` phu trach dang ky, dang nhap, cap lai access token, dang xuat va middleware JWT cho cac route protected.

## Vai tro

Module nay la cua vao cua backend:

- Tao user moi bang so dien thoai va mat khau.
- Dang nhap va cap `accessToken` ngan han.
- Cap `refreshToken` de lay access token moi.
- Quan ly logout tung thiet bi hoac tat ca thiet bi.
- Cung cap helper tao, verify va doc JWT cho cac module khac.

Module lien quan truc tiep toi:

- `users`: doc/tao user va luu password hash.
- `devices`: cap nhat trang thai thiet bi khi login.
- `refresh_tokens`: luu refresh token da hash theo user va device.

## Cau truc

- `controllers/auth.controller.js`: xu ly request HTTP cho auth.
- `routes/auth.routes.js`: mount cac endpoint `/api/auth`.
- `validators/auth.validator.js`: validate body register/login/refresh/profile.
- `services/auth.service.js`: CRUD va revoke refresh token.
- `models/refresh-token.model.js`: schema refresh token.
- `middleware/auth.middleware.js`: hash token, generate token, generate/verify JWT, `authenticateJWT`.
- `middleware/authorization.middleware.js`: guard theo role.

## Routes

Public routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

Protected routes, can header `Authorization: Bearer <accessToken>`:

- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/change-password`

## API chi tiet

### `POST /api/auth/register`

Tao tai khoan moi.

Body:

```json
{
  "phone": "0901234567",
  "displayName": "Nguyen Van A",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "userId": "user_object_id",
    "phone": "0901234567",
    "displayName": "Nguyen Van A"
  }
}
```

### `POST /api/auth/login`

Dang nhap, cap token va danh dau thiet bi dang online.

Body:

```json
{
  "phone": "0901234567",
  "password": "password123",
  "deviceId": "web-device-1",
  "platform": "web"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "plain_refresh_token",
    "user": {
      "userId": "user_object_id",
      "phone": "0901234567",
      "displayName": "Nguyen Van A",
      "avatarUrl": "https://example.com/avatar.png"
    }
  }
}
```

Ghi chu:

- `platform` mac dinh la `web`.
- `POST /api/auth/login` co dung `authLimiter`.
- Access token TTL hien tai la 15 phut, rieng `NODE_ENV=test` la 1 gio.
- Refresh token duoc hash truoc khi luu DB va het han sau 7 ngay.

### `POST /api/auth/refresh`

Cap access token moi tu refresh token con hieu luc.

Body:

```json
{
  "refreshToken": "plain_refresh_token",
  "deviceId": "web-device-1"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

### `POST /api/auth/logout`

Dang xuat thiet bi hien tai bang cach revoke refresh token theo `userId` va `deviceId`.

Body:

```json
{
  "deviceId": "web-device-1"
}
```

### `POST /api/auth/logout-all`

Revoke tat ca refresh token cua user dang dang nhap.

### `GET /api/auth/me`

Lay profile user hien tai, loai bo `passwordHash`.

### `PATCH /api/auth/profile`

Cap nhat profile co ban.

Body:

```json
{
  "displayName": "Nguyen Van A",
  "avatarUrl": "https://example.com/avatar.png"
}
```

### `POST /api/auth/change-password`

Doi mat khau va revoke tat ca refresh token de bat user dang nhap lai.

Body:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password",
  "confirmPassword": "new-password"
}
```

## Validation chinh

- `phone` bat buoc khi register/login.
- `displayName` khi register phai co toi thieu 2 ky tu.
- `password` khi register phai co toi thieu 6 ky tu.
- `passwordConfirm` phai trung `password`.
- `deviceId` bat buoc khi login/refresh/logout.
- `displayName` khi update profile neu co phai co toi thieu 2 ky tu.

## Bao mat

- Backend khong tin identity tu frontend; protected route lay user tu JWT da verify.
- Password va refresh token duoc hash bang helper trong `auth.middleware.js`.
- Login sai tra ve message chung `Invalid phone or password`.
- Doi mat khau se revoke toan bo refresh token.
- Role cua JWT mac dinh la `user` neu document user khong co role.

## Loi thuong gap

- `400 Validation failed`: thieu field hoac sai format.
- `401 Invalid phone or password`: sai thong tin dang nhap.
- `401 Invalid or expired refresh token`: refresh token khong hop le, da revoke hoac het han.
- `404 User not found`: user khong ton tai.
- `409 User with this phone already exists`: dang ky trung so dien thoai.
