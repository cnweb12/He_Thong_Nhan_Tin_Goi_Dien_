# Admin API Documentation

API documentation cho Admin Module - Role-Based Access Control (RBAC).

## Authentication

Tất cả admin endpoints yêu cầu JWT token với role `admin` hoặc `super_admin`.

**Header:**
```
Authorization: Bearer <access_token>
```

## Error Codes

- `401` - Unauthorized (token missing, invalid, or expired)
- `403` - Forbidden (insufficient permissions)
- `400` - Bad Request (validation failed)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

---

## User Management

### GET /api/admin/users

Lấy danh sách users với pagination và filters.

**Authentication:** Required (admin or super_admin)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Số trang |
| limit | number | 20 | Số lượng mỗi trang (max: 100) |
| role | string | - | Filter theo role (user, admin, super_admin) |
| search | string | - | Tìm kiếm theo phone, username, displayName |

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20&role=user" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "phone": "+84900000001",
        "username": "alice",
        "displayName": "Alice",
        "avatarUrl": null,
        "role": "user",
        "settings": {
          "theme": "light",
          "language": "vi",
          "allowStrangerMessage": true,
          "readReceiptEnabled": true
        },
        "lastSeenAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "ok": false,
  "message": "Access denied. Required roles: admin, super_admin, but user has role: user"
}
```

---

### GET /api/admin/users/:userId

Lấy thông tin chi tiết của user.

**Authentication:** Required (admin or super_admin)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID |

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+84900000001",
    "username": "alice",
    "displayName": "Alice",
    "avatarUrl": null,
    "role": "user",
    "settings": {
      "theme": "light",
      "language": "vi",
      "allowStrangerMessage": true,
      "readReceiptEnabled": true
    },
    "lastSeenAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "ok": false,
  "message": "User not found"
}
```

---

### POST /api/admin/users/:userId/lock

Khóa tài khoản user.

**Authentication:** Required (admin or super_admin)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID |

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011/lock" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+84900000001",
    "role": "user",
    "isLocked": true,
    "lockedAt": "2024-01-15T10:30:00.000Z",
    ...
  },
  "message": "User locked successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "ok": false,
  "message": "Cannot lock yourself"
}
```

---

### POST /api/admin/users/:userId/unlock

Mở khóa tài khoản user.

**Authentication:** Required (admin or super_admin)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID |

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011/unlock" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+84900000001",
    "role": "user",
    "isLocked": false,
    "lockedAt": null,
    ...
  },
  "message": "User unlocked successfully"
}
```

---

### PATCH /api/admin/users/:userId/role

Thay đổi role của user (Super Admin Only).

**Authentication:** Required (super_admin only)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID |

**Request Body:**
```json
{
  "role": "admin"
}
```

**Valid Roles:** `user`, `admin`, `super_admin`

**Request Example:**
```bash
curl -X PATCH "http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011/role" \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+84900000001",
    "role": "admin",
    ...
  },
  "message": "User role changed successfully"
}
```

**Error Response (403 Forbidden):**
```json
{
  "ok": false,
  "message": "Only super admin can change user roles"
}
```

**Error Response (400 Bad Request):**
```json
{
  "ok": false,
  "message": "Cannot change your own role"
}
```

---

## Message Management

### GET /api/admin/messages

Lấy danh sách tin nhắn với filters.

**Authentication:** Required (admin or super_admin)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Số trang |
| limit | number | 50 | Số lượng mỗi trang (max: 100) |
| conversationId | string | - | Filter theo conversation |
| senderId | string | - | Filter theo người gửi |
| startDate | string | - | Filter từ ngày (ISO 8601) |
| endDate | string | - | Filter đến ngày (ISO 8601) |

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/admin/messages?page=1&limit=50&conversationId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "conversationId": "507f1f77bcf86cd799439011",
        "senderId": {
          "_id": "507f1f77bcf86cd799439011",
          "displayName": "Alice",
          "phone": "+84900000001",
          "avatarUrl": null
        },
        "seq": 1,
        "type": "text",
        "text": "Hello from dev seed",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "totalPages": 20
    }
  }
}
```

---

### DELETE /api/admin/messages/:messageId

Xóa tin nhắn (soft delete).

**Authentication:** Required (admin or super_admin)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messageId | string | Yes | Message ID |

**Request Example:**
```bash
curl -X DELETE "http://localhost:3000/api/admin/messages/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "deletedAt": "2024-01-15T10:30:00.000Z",
    ...
  },
  "message": "Message deleted successfully"
}
```

---

## System Settings

### GET /api/admin/settings

Lấy tất cả cài đặt hệ thống.

**Authentication:** Required (admin or super_admin)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/admin/settings" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "max_message_length": {
      "value": 5000,
      "type": "number",
      "description": "Maximum length of a message"
    },
    "enable_video_call": {
      "value": true,
      "type": "boolean",
      "description": "Enable video call feature"
    },
    "max_group_size": {
      "value": 100,
      "type": "number",
      "description": "Maximum number of members in a group"
    }
  }
}
```

---

### PATCH /api/admin/settings

Cập nhật cài đặt hệ thống.

**Authentication:** Required (admin or super_admin)

**Request Body:**
```json
{
  "settings": {
    "max_message_length": 5000,
    "enable_video_call": true,
    "max_group_size": 100
  }
}
```

**Request Example:**
```bash
curl -X PATCH "http://localhost:3000/api/admin/settings" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "max_message_length": 5000,
      "enable_video_call": true
    }
  }'
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "max_message_length": {
      "value": 5000,
      "type": "number",
      "description": "Maximum length of a message"
    },
    "enable_video_call": {
      "value": true,
      "type": "boolean",
      "description": "Enable video call feature"
    }
  },
  "message": "System settings updated successfully"
}
```

---

## Banned Keywords

### GET /api/admin/banned-keywords

Lấy danh sách từ khóa cấm.

**Authentication:** Required (admin or super_admin)

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/admin/banned-keywords" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "keyword": "spam",
      "addedBy": "507f1f77bcf86cd799439011",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "keyword": "scam",
      "addedBy": "507f1f77bcf86cd799439011",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### POST /api/admin/banned-keywords

Thêm từ khóa cấm mới.

**Authentication:** Required (admin or super_admin)

**Request Body:**
```json
{
  "keyword": "spam"
}
```

**Constraints:**
- Keyword: string, 1-100 characters
- Keyword sẽ được chuyển thành lowercase
- Keyword phải là duy nhất

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/admin/banned-keywords" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "spam"}'
```

**Response Example (201 Created):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "keyword": "spam",
    "addedBy": "507f1f77bcf86cd799439011",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Banned keyword added successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "ok": false,
  "message": "Keyword already exists"
}
```

---

### DELETE /api/admin/banned-keywords/:keyword

Xóa từ khóa cấm (soft delete).

**Authentication:** Required (admin or super_admin)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| keyword | string | Yes | Keyword to remove |

**Request Example:**
```bash
curl -X DELETE "http://localhost:3000/api/admin/banned-keywords/spam" \
  -H "Authorization: Bearer <access_token>"
```

**Response Example (200 OK):**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "keyword": "spam",
    "isActive": false,
    ...
  },
  "message": "Banned keyword removed successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "ok": false,
  "message": "Banned keyword not found"
}
```

---

## Rate Limiting

Admin endpoints có thể có rate limiting để prevent abuse. Nếu bị rate limited:

**Response (429 Too Many Requests):**
```json
{
  "ok": false,
  "message": "Too many requests, please try again later"
}
```

## Notes

- Tất cả timestamps đều theo format ISO 8601
- IDs là MongoDB ObjectId strings
- Soft delete được sử dụng cho messages và banned keywords (isActive hoặc deletedAt)
- Admin không thể thay đổi role hoặc khóa chính mình
- Super admin là duy nhất, không thể tạo thêm
