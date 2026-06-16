# Module Users

Module `users` quan ly ho so nguoi dung, tim kiem user, cai dat ca nhan va luong ket ban co ban.

## Pham vi

Module nay phu trach:

- Lay thong tin user hien tai.
- Lay public profile cua user khac.
- Tim kiem user theo `displayName`, `username` hoac `phone`.
- Cap nhat profile va settings cua user hien tai.
- Gui, chap nhan, liet ke va xoa quan he ban be.

Module nay khong phu trach dang nhap/dang ky. Cac flow auth nam trong module `auth`.

## Cau truc

- `models/user.model.js`: schema `users`.
- `models/friend.model.js`: schema `user_friends`.
- `services/user.service.js`: business logic cho user profile, search va friend.
- `controllers/user.controller.js`: HTTP handlers.
- `routes/user.routes.js`: route `/api/users`.
- `validators/user.validator.js`: validate params/query/body.

## Routes chinh

Tat ca route trong `/api/users` deu can JWT.

- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/settings`
- `GET /api/users/search?q=...`
- `GET /api/users/:userId`
- `GET /api/users/me/friends`
- `GET /api/users/me/friend-requests`
- `POST /api/users/:userId/friends`
- `POST /api/users/:userId/friends/accept`
- `DELETE /api/users/:userId/friends`

Response thanh cong thuong co dang:

```json
{
  "ok": true,
  "data": {}
}
```

Mot so action khong can data, vi du gui friend request, se tra:

```json
{
  "ok": true
}
```

## User profile APIs

### `GET /api/users/me`

Lay profile user hien tai. Response co the bao gom phone vi day la chinh chu tai khoan.

### `GET /api/users/:userId`

Lay public profile cua user khac. Controller loai bo cac field nhay cam nhu `phone` va `settings` truoc khi response.

### `GET /api/users/search?q=...`

Tim kiem user, co `searchLimiter`.

Query:

- `q`: tu khoa tim kiem.
- `limit`: optional, mac dinh `20`.

Service se:

- Trim query rong va tra `[]`.
- Escape regex truoc khi tim theo `displayName`.
- Normalize `username` va `phone`.
- Loai user hien tai ra khoi ket qua.

### `PATCH /api/users/me`

Cap nhat profile co ban.

Body:

```json
{
  "username": "nguyenvana",
  "displayName": "Nguyen Van A",
  "avatarUrl": "https://example.com/avatar.png"
}
```

### `PATCH /api/users/me/settings`

Cap nhat settings.

Body:

```json
{
  "theme": "light",
  "language": "vi",
  "allowStrangerMessage": true,
  "readReceiptEnabled": true
}
```

## Friend model

Collection `user_friends` luu quan he theo huong `userId -> friendId`.

```js
{
  userId: ObjectId,
  friendId: ObjectId,
  status: "pending" | "accepted",
  createdAt: Date
}
```

Index:

- `{ userId: 1, friendId: 1 }` unique

Trang thai:

- `pending`: `userId` da gui loi moi toi `friendId`.
- `accepted`: hai user da la ban be.

Khi chap nhan friend request, service dam bao co quan he accepted hai chieu:

- requester -> current user
- current user -> requester

## Friend APIs

### `POST /api/users/:userId/friends`

Gui loi moi ket ban tu user hien tai den `:userId`.

Rule:

- Khong duoc gui cho chinh minh.
- `:userId` phai ton tai.
- Neu da co pending request cung chieu thi tra `409 Friend request already sent`.
- Neu da accepted thi tra `409 Already friends`.

### `POST /api/users/:userId/friends/accept`

User hien tai chap nhan loi moi tu `:userId`.

Service tim record:

```js
{ userId: requesterId, friendId: currentUserId, status: "pending" }
```

Neu khong co request pending thi tra `404 Friend request not found`.

### `GET /api/users/me/friends`

Lay danh sach ban be accepted cua user hien tai.

Response item:

```json
{
  "userId": "friend_user_id",
  "displayName": "Friend Name",
  "phone": "0901234567"
}
```

### `GET /api/users/me/friend-requests`

Lay danh sach request pending gui den user hien tai.

Response item:

```json
{
  "userId": "requester_user_id",
  "displayName": "Requester Name",
  "phone": "0901234567"
}
```

### `DELETE /api/users/:userId/friends`

Xoa quan he ban be/request giua user hien tai va `:userId` theo ca hai chieu.

Neu khong co record nao bi xoa thi tra `404 Friend relationship not found`.

## Authorization

- Tat ca `/api/users/*` deu di qua `authenticateJWT`.
- Friend routes co them `requireUserRole()`, mac dinh chi cho role user thuong.
- Controller luon lay current user tu `req.user.userId`, khong lay tu body.

## Loi thuong gap

- `400 Validation failed`: request sai format.
- `400 Cannot send friend request to yourself`: tu ket ban voi chinh minh.
- `404 User not found`: user dich khong ton tai.
- `404 Friend request not found`: khong co request pending de accept.
- `404 Friend relationship not found`: khong co quan he de xoa.
- `409 Friend request already sent`: da gui loi moi truoc do.
- `409 Already friends`: hai user da la ban.

## Test

Module co test cho cac lop:

- `tests/modules/users/user.validator.test.js`
- `tests/modules/users/user.service.test.js`
- `tests/modules/users/user.controller.test.js`
- `tests/modules/users/user.routes.test.js`
