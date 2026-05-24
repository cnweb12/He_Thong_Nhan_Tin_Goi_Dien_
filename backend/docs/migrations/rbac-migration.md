# RBAC Migration Guide

Hướng dẫn migrate từ hệ thống không có role sang hệ thống có role-based access control (RBAC).

## Overview

Migration này thêm hệ thống phân quyền role-based với 3 cấp độ:
- `user`: Người dùng bình thường
- `admin`: Quản trị viên
- `super_admin`: Siêu quản trị viên

## Prerequisites

- Database backup trước khi migration
- Node.js environment
- MongoDB access

## Migration Steps

### 1. Cập nhật Database Schema

#### Cập nhật User Collection

Thêm field `role` vào collection `users`:

```javascript
// MongoDB shell
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "user" } }
)
```

Hoặc sử dụng Mongoose migration script:

```javascript
// scripts/migrations/add-role-field.js
const { connectMongo, disconnectMongo } = require("../../database/mongo");
const { UserModel } = require("../../src/modules/users/models/user.model");

async function migrate() {
  await connectMongo(config.mongoUri);

  const result = await UserModel.updateMany(
    { role: { $exists: false } },
    { $set: { role: "user" } }
  );

  console.log(`Updated ${result.modifiedCount} users with role field`);
}

migrate()
  .then(() => console.log("Migration completed"))
  .catch(console.error)
  .finally(() => disconnectMongo());
```

#### Tạo Collections Mới

Tạo các collections mới cho admin module:

```javascript
// MongoDB shell
db.createCollection("system_settings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["key", "value", "type", "createdAt", "updatedAt"],
      properties: {
        _id: { bsonType: "objectId" },
        key: { bsonType: "string" },
        value: { bsonType: ["string", "number", "bool", "object", "array", "null"] },
        type: { enum: ["string", "number", "boolean", "object", "array"] },
        description: { bsonType: ["string", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.createCollection("banned_keywords", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["keyword", "addedBy", "isActive", "createdAt", "updatedAt"],
      properties: {
        _id: { bsonType: "objectId" },
        keyword: { bsonType: "string" },
        addedBy: { bsonType: "objectId" },
        isActive: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});
```

#### Tạo Indexes

```javascript
// MongoDB shell
db.system_settings.createIndex({ key: 1 }, { unique: true });

db.banned_keywords.createIndex({ keyword: 1 }, { unique: true });
db.banned_keywords.createIndex({ isActive: 1 });
db.banned_keywords.createIndex({ addedBy: 1 });
```

### 2. Seed Super Admin Account

Set environment variables:

```bash
export SUPER_ADMIN_PHONE="+84900000000"
export SUPER_ADMIN_PASSWORD="your_secure_password"
export SUPER_ADMIN_DISPLAY_NAME="Super Admin"
```

Chạy seed script:

```bash
npm run db:seed-super-admin
```

Hoặc chạy trực tiếp:

```bash
node scripts/database/seed-super-admin.js
```

### 3. Cập nhật Application Code

Đảm bảo các file sau đã được cập nhật:
- `src/modules/users/models/user.model.js` - Thêm field role
- `src/modules/auth/middleware/auth.middleware.js` - Include role trong JWT payload
- `src/modules/auth/controllers/auth.controller.js` - Include role khi tạo token
- `src/modules/auth/middleware/authorization.middleware.js` - Tạo authorization middleware
- `src/modules/admin/` - Tạo admin module mới
- `src/routes/index.js` - Mount admin router
- `database/mongo/init/01-init-chat-app.js` - Cập nhật schema validation
- `database/mongo/register-models.js` - Register admin models

### 4. Update Existing Users

Tất cả existing users sẽ được gán role mặc định là `user`. Nếu bạn muốn assign role cụ thể cho một số users:

```javascript
// MongoDB shell
// Assign admin role cho specific users
db.users.updateMany(
  { phone: { $in: ["+84900000001", "+84900000002"] } },
  { $set: { role: "admin" } }
);
```

### 5. Update Environment Variables

Thêm các environment variables sau vào `.env` file:

```bash
# Super Admin Credentials
SUPER_ADMIN_PHONE=+84900000000
SUPER_ADMIN_PASSWORD=your_secure_password
SUPER_ADMIN_DISPLAY_NAME=Super Admin
```

**IMPORTANT:** Không commit `.env` file vào version control. Sử dụng `.env.example` hoặc `.env.development.example` làm template.

### 6. Deploy Changes

1. **Backup database** trước khi deploy
2. **Run migration script** để cập nhật schema
3. **Seed super admin** account
4. **Deploy application code**
5. **Test admin endpoints** với super admin account
6. **Assign admin roles** cho users cần thiết

## Testing Checklist

Sau khi migration, test các chức năng sau:

### Authentication
- [ ] Login với user thường vẫn hoạt động
- [ ] JWT token chứa role field
- [ ] Refresh token vẫn hoạt động

### Authorization
- [ ] User thường không thể truy cập admin endpoints (403)
- [ ] Admin có thể truy cập admin endpoints
- [ ] Super admin có thể truy cập tất cả admin endpoints
- [ ] Super admin có thể thay đổi role của user
- [ ] Admin không thể thay đổi role của user (403)
- [ ] Admin không thể truy cập user endpoints như nhắn tin, thêm bạn bè

### Admin Endpoints
- [ ] GET /api/admin/users - List users
- [ ] GET /api/admin/users/:userId - Get user detail
- [ ] POST /api/admin/users/:userId/lock - Lock user
- [ ] POST /api/admin/users/:userId/unlock - Unlock user
- [ ] PATCH /api/admin/users/:userId/role - Change role (super admin only)
- [ ] GET /api/admin/messages - List messages
- [ ] DELETE /api/admin/messages/:messageId - Delete message
- [ ] GET /api/admin/settings - Get system settings
- [ ] PATCH /api/admin/settings - Update system settings
- [ ] GET /api/admin/banned-keywords - Get banned keywords
- [ ] POST /api/admin/banned-keywords - Add banned keyword
- [ ] DELETE /api/admin/banned-keywords/:keyword - Remove banned keyword

### User Endpoints
- [ ] User thường vẫn có thể nhắn tin
- [ ] User thường vẫn có thể thêm bạn bè
- [ ] Admin không thể nhắn tin (403)
- [ ] Admin không thể thêm bạn bè (403)

## Rollback Plan

Nếu có vấn đề sau migration, rollback steps:

### 1. Rollback Database Changes

```javascript
// MongoDB shell
// Remove role field (optional - không khuyến khích)
db.users.updateMany({}, { $unset: { role: "" } });

// Drop new collections
db.system_settings.drop();
db.banned_keywords.drop();
```

### 2. Rollback Application Code

Revert code changes:
- Remove field role từ user model
- Remove role từ JWT payload
- Remove admin module
- Remove admin router
- Revert database init script

### 3. Restore Database từ Backup

```bash
mongorestore --db chat_app /path/to/backup
```

## Common Issues

### Issue: Validation Error khi tạo user

**Error:** `Validation failed: role is required`

**Solution:** Đảm bảo field role có default value "user" trong Mongoose schema

### Issue: Super admin đã tồn tại

**Error:** `Super admin with phone ... already exists`

**Solution:** Seed script sẽ skip nếu super admin đã tồn tại. Nếu muốn tạo lại, xóa user cũ trước.

### Issue: Admin không thể truy cập endpoints

**Error:** `403 Forbidden`

**Solution:**
- Kiểm tra JWT token có chứa role field không
- Kiểm tra user có role admin hoặc super_admin không
- Kiểm tra authorization middleware được apply đúng không

### Issue: Cannot change role

**Error:** `Only super admin can change user roles`

**Solution:** Chỉ super_admin có thể thay đổi role. Đảm bảo bạn đang login với super_admin account.

## Post-Migration Tasks

Sau khi migration thành công:

1. **Monitor logs** để đảm bảo không có lỗi
2. **Assign admin roles** cho users cần thiết
3. **Configure system settings** theo yêu cầu
4. **Add banned keywords** cho content moderation
5. **Document admin procedures** cho team
6. **Train admin users** về cách sử dụng admin endpoints
7. **Set up monitoring** cho admin actions (audit logs)

## Support

Nếu gặp vấn đề trong migration:
1. Kiểm tra logs trong application
2. Kiểm tra MongoDB logs
3. Review migration script
4. Contact development team

## Notes

- Migration này là **irreversible** nếu không có backup
- Luôn test migration trong **staging environment** trước production
- Super admin credentials phải được **securely stored**
- Monitor application performance sau migration
