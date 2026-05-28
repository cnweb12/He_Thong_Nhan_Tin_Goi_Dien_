# Tài liệu Hướng dẫn sử dụng API (API Reference)

Tài liệu này liệt kê chi tiết các endpoint API, phương thức xác thực, header và cấu trúc payload (body/query) phục vụ cho Frontend/Client.

## 1. Cơ chế Xác thực (Authentication)

- **Public API**: Không yêu cầu Header xác thực.
- **Protected API**: Yêu cầu truyền Access Token ở Header.
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Response**: `{ "ok": true, "message": "Cập nhật trạng thái thành công" }`

### 1.1. Ví dụ sử dụng Authorization Header

#### Format chuẩn

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTBlNjE1ZTE5MjAwODZjMTY0ODIyOGYiLCJwaG9uZSI6Ijg0OTAxMjM0NTY3IiwiaWF0IjoxNzE2MzAyMDAwLCJleHAiOjE3MTYzMDg2MDB9.abc123xyz...
```

#### Ví dụ với curl

```bash
# Đăng ký (Public API - không cần token)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"84901234567","password":"UserPassword123!","displayName":"Test User","passwordConfirm":"UserPassword123!"}'

# Đăng nhập (Public API - không cần token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"84901234567","password":"UserPassword123!","deviceId":"device-001"}'

# Lấy profile (Protected API - cần token)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTBlNjE1ZTE5MjAwODZjMTY0ODIyOGYiLCJwaG9uZSI6Ijg0OTAxMjM0NTY3IiwiaWF0IjoxNzE2MzAyMDAwLCJleHAiOjE3MTYzMDg2MDB9.abc123xyz..."
```

#### Ví dụ với JavaScript (fetch)

```javascript
// Đăng ký
fetch("http://localhost:3001/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phone: "84901234567",
    password: "UserPassword123!",
    displayName: "Test User",
    passwordConfirm: "UserPassword123!",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));

// Đăng nhập và lưu token
fetch("http://localhost:3001/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phone: "84901234567",
    password: "UserPassword123!",
    deviceId: "device-001",
  }),
})
  .then((response) => response.json())
  .then((data) => {
    const accessToken = data.data.accessToken;
    localStorage.setItem("accessToken", accessToken);

    // Sử dụng token cho các request tiếp theo
    return fetch("http://localhost:3001/api/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  })
  .then((response) => response.json())
  .then((data) => console.log(data));
```

#### Ví dụ với JavaScript (axios)

```javascript
// Đăng ký
axios
  .post("http://localhost:3001/api/auth/register", {
    phone: "84901234567",
    password: "UserPassword123!",
    displayName: "Test User",
    passwordConfirm: "UserPassword123!",
  })
  .then((response) => console.log(response.data));

// Đăng nhập và lưu token
axios
  .post("http://localhost:3001/api/auth/login", {
    phone: "84901234567",
    password: "UserPassword123!",
    deviceId: "device-001",
  })
  .then((response) => {
    const accessToken = response.data.data.accessToken;
    localStorage.setItem("accessToken", accessToken);

    // Sử dụng token cho các request tiếp theo
    return axios.get("http://localhost:3001/api/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  })
  .then((response) => console.log(response.data));
```

#### Ví dụ với Thunder Client

```
Request: GET http://localhost:3001/api/auth/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTBlNjE1ZTE5MjAwODZjMTY0ODIyOGYiLCJwaG9uZSI6Ijg0OTAxMjM0NTY3IiwiaWF0IjoxNzE2MzAyMDAwLCJleHAiOjE3MTYzMDg2MDB9.abc123xyz...
```

### 1.2. Lưu ý quan trọng

- Access token được nhận từ response của endpoint `/api/auth/login`
- Token có thời hạn hết hạn (thường 15-30 phút), cần refresh token khi hết hạn
- Refresh token được dùng để lấy access token mới mà không cần đăng nhập lại
- Luôn truyền token trong header `Authorization` với format `Bearer <token>` cho protected APIs

## 2. Module Auth (`/api/auth`)

### 2.1. Đăng ký tài khoản (Public)

- **Endpoint**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "phone": "0901234567",
    "displayName": "Ten Hien Thi",
    "password": "matkhau123",
    "passwordConfirm": "matkhau123"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "ok": true,
    "data": {
      "userId": "60f7e9b3e9b3f0001f3e8b8e",
      "phone": "0901234567",
      "displayName": "Ten Hien Thi"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ (ví dụ: thiếu trường, mật khẩu không khớp).
  - `409 Conflict`: Số điện thoại đã tồn tại.

### 2.2. Đăng nhập (Public)

- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "phone": "0901234567",
    "password": "matkhau123",
    "deviceId": "device-uuid-1234",
    "platform": "web" // hoac 'ios', 'android'
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "aRandomRefreshTokenString",
      "user": {
        "userId": "60f7e9b3e9b3f0001f3e8b8e",
        "phone": "0901234567",
        "displayName": "Ten Hien Thi",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.
  - `401 Unauthorized`: Số điện thoại hoặc mật khẩu không đúng.

### 2.3. Làm mới Access Token (Public)

- **Endpoint**: `POST /api/auth/refresh`
- **Body**:
  ```json
  {
    "refreshToken": "refresh-token-string",
    "deviceId": "device-uuid-1234"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.
  - `401 Unauthorized`: Refresh token không hợp lệ hoặc đã hết hạn.
  - `404 Not Found`: Không tìm thấy người dùng.

### 2.4. Đăng xuất thiết bị hiện tại (Protected)

- **Endpoint**: `POST /api/auth/logout`
- **Body**:
  ```json
  {
    "deviceId": "device-uuid-1234"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "message": "Logged out successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Thiếu `deviceId`.

### 2.5. Đăng xuất tất cả thiết bị (Protected)

- **Endpoint**: `POST /api/auth/logout-all`
- **Body**: Không yêu cầu.
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "message": "Logged out from all devices"
  }
  ```

### 2.6. Lấy thông tin cá nhân (Protected)

- **Endpoint**: `GET /api/auth/me`
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "userId": "60f7e9b3e9b3f0001f3e8b8e",
      "phone": "0901234567",
      "username": "0901234567",
      "displayName": "Ten Hien Thi",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2026-05-10T10:00:00Z",
      "updatedAt": "2026-05-10T10:00:00Z"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Không tìm thấy người dùng.

### 2.7. Cập nhật hồ sơ (Protected)

- **Endpoint**: `PATCH /api/auth/profile`
- **Body**:
  ```json
  {
    "displayName": "Ten Moi",
    "avatarUrl": "https://link-to-avatar.com/image.jpg"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "userId": "60f7e9b3e9b3f0001f3e8b8e",
      "phone": "0901234567",
      "username": "0901234567",
      "displayName": "Ten Moi",
      "avatarUrl": "https://link-to-avatar.com/image.jpg",
      "createdAt": "2026-05-10T10:00:00Z",
      "updatedAt": "2026-05-10T10:30:00Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.
  - `404 Not Found`: Không tìm thấy người dùng.

### 2.8. Đổi mật khẩu (Protected)

- **Endpoint**: `POST /api/auth/change-password`
- **Body**:
  ```json
  {
    "currentPassword": "matkhaucu123",
    "newPassword": "matkhaumoi123",
    "confirmPassword": "matkhaumoi123"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "message": "Password changed successfully. Please login again."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.
  - `401 Unauthorized`: Mật khẩu hiện tại không đúng.
  - `404 Not Found`: Không tìm thấy người dùng.

---

## 3. Module Users (`/api/users`)

### 3.1. Lấy người dùng hiện tại (Protected)

- **Endpoint**: `GET /api/users/me`
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "userId": "60f7e9b3e9b3f0001f3e8b8e",
      "phone": "0901234567",
      "username": "0901234567",
      "displayName": "Ten Hien Thi",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2026-05-10T10:00:00Z",
      "updatedAt": "2026-05-10T10:00:00Z",
      "settings": {
        "theme": "light",
        "language": "en",
        "allowStrangerMessages": true
      }
    }
  }
  ```

### 3.2. Cập nhật thông tin cơ bản (Protected)

- **Endpoint**: `PATCH /api/users/me`
- **Body** (Các trường tuỳ chọn):
  ```json
  {
    "username": "tentaikhoan_moi",
    "displayName": "Ten Hien Thi",
    "avatarUrl": "https://..."
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "userId": "60f7e9b3e9b3f0001f3e8b8e",
      "username": "tentaikhoan_moi",
      "displayName": "Ten Hien Thi",
      "avatarUrl": "https://..."
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 3.3. Cập nhật cài đặt ứng dụng (Protected)

- **Endpoint**: `PATCH /api/users/me/settings`
- **Body** (Các trường tuỳ chọn):
  ```json
  {
    "theme": "dark",
    "language": "vi",
    "allowStrangerMessages": false
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "settings": {
        "theme": "dark",
        "language": "vi",
        "allowStrangerMessages": false
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 3.4. Tìm kiếm người dùng (Protected)

- **Endpoint**: `GET /api/users/search`
- **Query Params**:
  - `q`: Từ khóa tìm kiếm (theo tên hoặc username), tối thiểu 2 ký tự.
  - `limit`: Số lượng kết quả tối đa (mặc định: 20, tối đa: 50).
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "userId": "60f7e9b3e9b3f0001f3e8b8f",
        "username": "user2",
        "displayName": "User Two",
        "avatarUrl": "https://example.com/avatar2.jpg"
      }
    ]
  }
  ```
- **Response**: Trả về Public Profile (không chứa `phone`, `settings`).
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 3.5. Lấy thông tin người dùng theo ID (Protected)

- **Endpoint**: `GET /api/users/:userId`
- **Params**:
  - `userId`: ObjectID của user.
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "userId": "60f7e9b3e9b3f0001f3e8b8f",
      "username": "user2",
      "displayName": "User Two",
      "avatarUrl": "https://example.com/avatar2.jpg"
    }
  }
  ```
- **Response**: Trả về Public Profile (không chứa `phone`, `settings`).
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

---

## 4. Module Conversations (`/api/conversations`)

### 4.1. Tạo/Lấy cuộc trò chuyện 1-1 (Protected)

- **Endpoint**: `POST /api/conversations/direct`
- **Body**:
  ```json
  {
    "peerUserId": "6a004909a2b9..."
  }
  ```
- **Logic**: Trả về thông tin hộp thoại. `directKey` được ẩn.
- **Success Response (201)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "6c112233...",
      "type": "direct",
      "participants": ["userId1", "userId2"],
      "createdAt": "2026-05-10T10:00:00Z",
      "updatedAt": "2026-05-10T10:00:00Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 4.2. Lấy danh sách hộp thoại Inbox (Protected)

- **Endpoint**: `GET /api/conversations/inbox`
- **Query Params**:
  - `limit`: Số lượng kết quả tối đa (mặc định: 20, tối đa: 100).
  - `skip`: Số lượng kết quả bỏ qua để phân trang (mặc định: 0).
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "conversationId": "6c112233...",
        "lastMessage": {
          "content": "Noi dung tin nhan cuoi...",
          "createdAt": "2026-05-10T11:00:00Z"
        },
        "unreadCount": 2,
        "peer": {
          "userId": "peerUserId",
          "displayName": "Peer User",
          "avatarUrl": "https://example.com/avatar.jpg"
        }
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 4.3. Đánh dấu đã đọc (Protected)

- **Endpoint**: `PATCH /api/conversations/:conversationId/read`
- **Params**:
  - `conversationId`: ID của cuộc trò chuyện.
- **Body**:
  ```json
  {
    "lastSeenSeq": 123
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "modifiedCount": 1
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

## 5. Module Messages (`/api/messages`)

### 5.1. Gửi tin nhắn mới (Protected)

- **Endpoint**: `POST /api/messages`
- **Body**:
  ```json
  {
    "conversationId": "6a004909a2b9...",
    "type": "text",
    "text": "Noi dung tin nhan",
    "clientMessageId": "uuid-tu-client"
  }
  ```
- **Logic**: Kiểm tra quyền xem user có trong conversation không. `clientMessageId` dùng để client quản lý gửi trùng lặp.
- **Success Response (201)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "message_id_1",
      "conversationId": "6a004909a2b9...",
      "senderId": "user_id_1",
      "type": "text",
      "text": "Noi dung tin nhan",
      "seq": 124,
      "clientMessageId": "uuid-tu-client",
      "createdAt": "2026-05-10T12:00:00Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 5.2. Lấy danh sách tin nhắn (Protected)

- **Endpoint**: `GET /api/messages/conversations/:conversationId`
- **Params**:
  - `conversationId`: ID của cuộc trò chuyện.
- **Query Params**:
  - `limit`: Số lượng tin nhắn tối đa (mặc định: 20, tối đa: 100).
  - `beforeSeq`: Lấy các tin nhắn có `seq` nhỏ hơn giá trị này.
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "_id": "message_id_1",
        "conversationId": "6a004909a2b9...",
        "senderId": "user_id_1",
        "type": "text",
        "text": "Tin nhan 1",
        "seq": 123,
        "createdAt": "2026-05-10T11:59:00Z"
      },
      {
        "_id": "message_id_2",
        "conversationId": "6a004909a2b9...",
        "senderId": "user_id_2",
        "type": "text",
        "text": "Tin nhan 2",
        "seq": 124,
        "createdAt": "2026-05-10T12:00:00Z"
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

---

## 6. Module Devices (`/api/devices`)

### 6.1. Đăng ký/Cập nhật thiết bị hiện tại (Protected)

- **Endpoint**: `PUT /api/devices/current`
- **Body**:
  ```json
  {
    "deviceId": "device-uuid",
    "pushToken": "fcm-push-token-string",
    "platform": "ios"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "device_db_id",
      "userId": "user_id_1",
      "deviceId": "device-uuid",
      "platform": "ios",
      "pushToken": "fcm-push-token-string",
      "isOnline": true,
      "lastActiveAt": "2026-05-10T10:00:00Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 6.2. Lấy danh sách các thiết bị của tôi (Protected)

- **Endpoint**: `GET /api/devices/me`
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "deviceId": "device-uuid",
        "platform": "ios",
        "isOnline": true,
        "lastActiveAt": "2026-05-10T10:00:00Z"
      },
      {
        "deviceId": "web-uuid",
        "platform": "web",
        "isOnline": false,
        "lastActiveAt": "2026-05-09T08:00:00Z"
      }
    ]
  }
  ```

### 6.3. Cập nhật trạng thái online/offline của thiết bị (Protected)

- **Endpoint**: `PATCH /api/devices/current/presence`
- **Body**:
  ```json
  {
    "deviceId": "device-uuid",
    "isOnline": true,
    "lastActiveAt": "2026-05-10T10:00:00Z"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "deviceId": "device-uuid",
      "isOnline": true,
      "lastActiveAt": "2026-05-10T10:00:00Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

---

## 7. Module Calls (`/api/calls`)

### 7.1. Ghi lại một cuộc gọi (Protected)

- **Endpoint**: `POST /api/calls`
- **Body**:
  ```json
  {
    "conversationId": "6a004909a2b9...",
    "type": "audio",
    "status": "completed",
    "startedAt": "2026-05-10T10:00:00Z",
    "endedAt": "2026-05-10T10:05:00Z",
    "durationSec": 300
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "call_id_123",
      "conversationId": "6a004909a2b9...",
      "initiatedBy": "user_id_1",
      "type": "audio",
      "status": "completed",
      "startedAt": "2026-05-10T10:00:00Z",
      "endedAt": "2026-05-10T10:05:00Z",
      "durationSec": 300,
      "participants": [
        {
          "userId": "user_id_1",
          "joinedAt": "2026-05-10T10:00:00Z",
          "leftAt": "2026-05-10T10:05:00Z"
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 7.2. Lấy lịch sử cuộc gọi trong hộp thoại (Protected)

- **Endpoint**: `GET /api/calls/conversations/:conversationId`
- **Params**:
  - `conversationId`: ID của cuộc trò chuyện.
- **Query Params**:
  - `limit`: Số lượng cuộc gọi tối đa để trả về (mặc định: 20, tối đa: 100).
  - `beforeStartedAt`: Lấy các cuộc gọi đã bắt đầu trước ngày này (ISO 8601).
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "_id": "call_id_123",
        "conversationId": "6a004909a2b9...",
        "initiatedBy": "user_id_1",
        "type": "audio",
        "status": "completed",
        "startedAt": "2026-05-10T10:00:00Z",
        "endedAt": "2026-05-10T10:05:00Z",
        "durationSec": 300
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 7.3. Cập nhật trạng thái cuộc gọi (Protected)

- **Endpoint**: `PATCH /api/calls/:callId/status`
- **Params**:
  - `callId`: ID của cuộc gọi.
- **Body**:
  ```json
  {
    "status": "completed",
    "endedAt": "2026-05-10T10:05:00Z",
    "durationSec": 300
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "call_id_123",
      "status": "completed",
      "endedAt": "2026-05-10T10:05:00Z",
      "durationSec": 300
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

### 7.4. Cập nhật người tham gia cuộc gọi (Protected)

- **Endpoint**: `PATCH /api/calls/:callId/participants`
- **Params**:
  - `callId`: ID của cuộc gọi.
- **Body**:
  ```json
  {
    "participantUserId": "user_id_2",
    "joinedAt": "2026-05-10T10:01:00Z"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "ok": true,
    "data": {
      "_id": "call_id_123",
      "participants": [
        {
          "userId": "user_id_1",
          "joinedAt": "2026-05-10T10:00:00Z"
        },
        {
          "userId": "user_id_2",
          "joinedAt": "2026-05-10T10:01:00Z"
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Dữ liệu không hợp lệ.

---

## 8. WebSocket (Socket.IO) Real-time API

Hệ thống cung cấp kết nối Real-time thông qua thư viện `socket.io-client` để nhận tin nhắn, thông báo đang gõ, và cập nhật trạng thái đã đọc mà không cần polling (tải lại liên tục) bằng HTTP API.

### 8.1. Cấu hình Kết nối

- **URL kết nối**: Cùng URL với HTTP API (ví dụ: `http://localhost:3001` hoặc `https://your-api.com`).
- **Xác thực**: Yêu cầu truyền `accessToken` vào thuộc tính `auth.token`.

**Ví dụ (Client Javascript):**
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: {
    token: "Bearer <accessToken_cua_ban>"
  }
});

socket.on("connect", () => {
  console.log("Da ket noi toi Socket Server!");
});

socket.on("connect_error", (err) => {
  console.error("Loi ket noi (VD: sai token):", err.message);
});
```

### 8.2. Danh sách Sự kiện Client Emit (Gửi lên Server)

Client sử dụng phương thức `socket.emit("ten_su_kien", payload)` để gửi thông tin lên server.

| Tên Sự kiện | Payload | Mô tả |
| :--- | :--- | :--- |
| `join_room` | `{ conversationId: "id_cuoc_tro_chuyen" }` | Tham gia vào một phòng chat để bắt đầu nhận tin nhắn real-time từ phòng đó. Cần gọi khi người dùng mở giao diện chat của 1 hội thoại. |
| `leave_room` | `{ conversationId: "id_cuoc_tro_chuyen" }` | Rời phòng chat khi người dùng thoát khỏi màn hình nhắn tin đó. |
| `typing_start` | `{ conversationId: "id_cuoc_tro_chuyen" }` | Thông báo cho người khác trong phòng là bạn đang gõ phím. |
| `typing_stop` | `{ conversationId: "id_cuoc_tro_chuyen" }` | Thông báo bạn đã dừng gõ phím. |

### 8.3. Danh sách Sự kiện Client Listen (Lắng nghe từ Server)

Client sử dụng phương thức `socket.on("ten_su_kien", callback)` để nhận dữ liệu từ server.

| Tên Sự kiện | Payload nhận được | Mô tả |
| :--- | :--- | :--- |
| `new_message` | `Message Object` (Giống kết quả trả về của GET /messages) | Server gửi sự kiện này cho mọi người trong `conversationId` **khi có một ai đó vừa gọi API HTTP `POST /api/messages` thành công**. |
| `message_read` | `{ conversationId, userId, lastSeenSeq }` | Ai đó vừa gọi API HTTP `PATCH /read` để đánh dấu đã đọc. Server thông báo để các client khác cập nhật UI ("Đã xem"). |
| `typing_start` | `{ conversationId, userId, displayName }` | Một người trong phòng vừa emit `typing_start`. Dùng để hiển thị "... đang gõ". |
| `typing_stop` | `{ conversationId, userId }` | Một người trong phòng vừa emit `typing_stop`. Dùng để ẩn "... đang gõ". |

### 8.4. Quy trình Tích hợp Điển hình (Gửi tin nhắn)

Để đảm bảo dữ liệu luôn được lưu vào CSDL một cách an toàn, tính năng gửi tin nhắn/đọc tin nhắn sử dụng mô hình kết hợp HTTP + Socket:

1. Client A tham gia phòng: `socket.emit('join_room', { conversationId: 'abc' })`.
2. Client A gửi tin nhắn qua REST API: `POST /api/messages` kèm dữ liệu tin nhắn.
3. Server lưu tin nhắn vào MongoDB.
4. Server dùng Socket.IO báo tin cho Client B (người cũng đang join room `abc`): `io.to('abc').emit('new_message', savedMessage)`.
5. Client B lắng nghe `socket.on('new_message')` và append tin nhắn mới vào màn hình ngay lập tức.
