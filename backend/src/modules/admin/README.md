# Admin Module

Module quản lý admin với role-based access control (RBAC) cho hệ thống nhắn tin gọi điện.

## Mục đích

Module này cung cấp các API endpoints cho admin và super_admin để:
- Quản lý người dùng (xem danh sách, khóa/mở khóa tài khoản, thay đổi role)
- Quản lý tin nhắn (xem lịch sử, xóa tin nhắn)
- Cài đặt hệ thống (lấy/cập nhật cài đặt)
- Kiểm soát nội dung (quản lý từ khóa cấm)

## Kiến trúc 3-Layer

Module tuân theo kiến trúc 3-layer của dự án:

```
admin/
├── controllers/     # Xử lý HTTP requests và responses
├── services/        # Business logic
├── validators/      # Validation cho requests
├── models/          # Mongoose models (SystemSettings, BannedKeyword)
└── routes/          # Định tuyến API endpoints
```

## Role Hierarchy

Hệ thống có 3 cấp độ role:

1. **user**: Người dùng bình thường
   - Có thể nhắn tin, thêm bạn bè, sử dụng các tính năng user
   - Không có quyền quản lý

2. **admin**: Quản trị viên
   - Có thể xem danh sách user, khóa/mở khóa tài khoản
   - Có thể xem và xóa tin nhắn
   - Có thể quản lý cài đặt hệ thống
   - Có thể quản lý từ khóa cấm
   - **Không thể** thay đổi role của user
   - **Không thể** nhắn tin hoặc thêm bạn bè như user bình thường

3. **super_admin**: Siêu quản trị viên
   - Có tất cả quyền của admin
   - Có thể thay đổi role của user (tạo admin mới)
   - Là tài khoản duy nhất được tạo cùng database

## API Endpoints

Tất cả endpoints đều yêu cầu authentication và role `admin` hoặc `super_admin`.

### User Management

#### GET /api/admin/users
Lấy danh sách users với pagination và filters.

**Query Parameters:**
- `page` (number, default: 1) - Số trang
- `limit` (number, default: 20, max: 100) - Số lượng mỗi trang
- `role` (string) - Filter theo role (user, admin, super_admin)
- `search` (string) - Tìm kiếm theo phone, username, displayName

**Response:**
```json
{
  "ok": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### GET /api/admin/users/:userId
Lấy thông tin chi tiết của user.

**Response:**
```json
{
  "ok": true,
  "data": {
    "_id": "...",
    "phone": "+84900000001",
    "username": "alice",
    "displayName": "Alice",
    "role": "user",
    ...
  }
}
```

#### POST /api/admin/users/:userId/lock
Khóa tài khoản user.

**Response:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "User locked successfully"
}
```

#### POST /api/admin/users/:userId/unlock
Mở khóa tài khoản user.

**Response:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "User unlocked successfully"
}
```

#### PATCH /api/admin/users/:userId/role (Super Admin Only)
Thay đổi role của user.

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "User role changed successfully"
}
```

### Message Management

#### GET /api/admin/messages
Lấy danh sách tin nhắn với filters.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)
- `conversationId` (string) - Filter theo conversation
- `senderId` (string) - Filter theo người gửi
- `startDate` (string) - Filter từ ngày
- `endDate` (string) - Filter đến ngày

**Response:**
```json
{
  "ok": true,
  "data": {
    "messages": [...],
    "pagination": { ... }
  }
}
```

#### DELETE /api/admin/messages/:messageId
Xóa tin nhắn (soft delete).

**Response:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "Message deleted successfully"
}
```

### System Settings

#### GET /api/admin/settings
Lấy tất cả cài đặt hệ thống.

**Response:**
```json
{
  "ok": true,
  "data": {
    "max_message_length": {
      "value": 5000,
      "type": "number",
      "description": "Maximum length of a message"
    },
    ...
  }
}
```

#### PATCH /api/admin/settings
Cập nhật cài đặt hệ thống.

**Request Body:**
```json
{
  "settings": {
    "max_message_length": 5000,
    "enable_video_call": true
  }
}
```

**Response:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "System settings updated successfully"
}
```

### Banned Keywords

#### GET /api/admin/banned-keywords
Lấy danh sách từ khóa cấm.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "...",
      "keyword": "spam",
      "addedBy": "...",
      "isActive": true,
      "createdAt": "..."
    }
  ]
}
```

#### POST /api/admin/banned-keywords
Thêm từ khóa cấm mới.

**Request Body:**
```json
{
  "keyword": "spam"
}
```

**Response:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "Banned keyword added successfully"
}
```

#### DELETE /api/admin/banned-keywords/:keyword
Xóa từ khóa cấm (soft delete).

**Response:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "Banned keyword removed successfully"
}
```

## Security Notes

- Tất cả admin endpoints đều yêu cầu JWT token với role `admin` hoặc `super_admin`
- Super admin endpoints (như thay đổi role) chỉ có thể được truy cập bởi super_admin
- Admin không thể thay đổi role của chính mình
- Admin không thể khóa tài khoản của chính mình
- Super admin không thể thay đổi role của chính mình
- Không thể tạo nhiều super_admin (chỉ có 1 super_admin duy nhất)

## Best Practices

1. **Luôn sử dụng HTTPS** trong production để bảo mật JWT tokens
2. **Không commit super admin credentials** vào version control
3. **Sử dụng strong passwords** cho super admin account
4. **Log tất cả admin actions** cho audit trail (có thể implement sau)
5. **Thực hiện rate limiting** cho admin endpoints để prevent abuse
6. **Validate tất cả inputs** trước khi xử lý

## Ví dụ sử dụng với curl

### Login với Super Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+84900000000",
    "password": "super_admin_password",
    "deviceId": "device-1"
  }'
```

### Lấy danh sách users
```bash
curl -X GET http://localhost:3000/api/admin/users?page=1&limit=20 \
  -H "Authorization: Bearer <access_token>"
```

### Khóa user
```bash
curl -X POST http://localhost:3000/api/admin/users/<user_id>/lock \
  -H "Authorization: Bearer <access_token>"
```

### Thay đổi role user (Super Admin Only)
```bash
curl -X PATCH http://localhost:3000/api/admin/users/<user_id>/role \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

## Dependencies

- Express.js
- Mongoose
- Auth middleware (JWT authentication)
- Authorization middleware (role-based access control)

## Testing

Để test admin endpoints:
1. Seed super admin account: `npm run db:seed-super-admin`
2. Login với super admin để lấy access token
3. Sử dụng token để gọi admin endpoints
4. Test role-based middleware với user thường (nên bị 403)
