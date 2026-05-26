# He_Thong_Nhan_Tin_Goi_Dien

Repository nay chua backend cho mot he thong nhan tin/goi dien theo huong chat app, to chuc quanh MongoDB va cac domain chinh nhu `auth`, `users`, `conversations`, `messages`, `devices`, `calls`.

## Muc tieu cua repository

Backend hien tai huong toi cac kha nang:

- dang ky, dang nhap va quan ly session bang JWT/refresh token
- quan ly user profile va user settings
- tao conversation direct
- gui tin nhan va doc lich su tin nhan
- ghi nhan call log va trang thai cuoc goi

## Cau truc tong quan

- `backend/`
  Backend Node.js/Express/Mongoose
- `docs/`
  Tai lieu thiet ke va tai lieu phan tich ben ngoai backend
- `scripts/`
  Script ho tro workflow Docker dev o cap do root project
- `frontend/`
  Phan frontend, hien khong phai trong tam cua backend docs
- `infrastructure/`
  Thu muc dat cho ha tang hoac deployment phu tro

## Backend hien tai co gi

Ben trong `backend/`, he thong duoc chia thanh:

- `database/mongo`
  Tang ha tang MongoDB
- `src/modules`
  Tang domain/business logic
- `src/routes`
  Noi ghep cac route API vao app
- `docs`
  Tai lieu workflow dev/test/prod cua backend
- `scripts`
  Script ho tro thao tac database va test/typecheck

## Cac route dang duoc mount thuc te

Tai thoi diem hien tai, router tong dang expose:

- `/health`
- `/auth`
- `/users`
- `/conversations`
- `/messages`
- `/devices`
- `/calls`

## Nen doc tu dau neu moi vao project

### Cho deployment va chay project

1. [backend/README.md](backend/README.md)
   Tong quan backend, cac module, va trang thai hien tai
2. [backend/docs/README.md](backend/docs/README.md)
   Danh sach tai lieu backend va thu tu doc khuyen nghi
3. [backend/docs/development.md](backend/docs/development.md)
   Huong dan khoi dong stack dev voi Docker, seed database, seed super admin
4. [scripts/README.md](scripts/README.md)
   Script ho tro workflow dev o cap do root project
5. [backend/docs/production.md](backend/docs/production.md)
   Huong dan deploy production (neu can)

### Cho hieu backend architecture va RBAC

6. [backend/docs/api/admin-api.md](backend/docs/api/admin-api.md)
   Tai lieu API cho Admin Module (RBAC system)
7. [backend/docs/migrations/rbac-migration.md](backend/docs/migrations/rbac-migration.md)
   Hướng dẫn migration sang hệ thống RBAC (neu can)
8. [backend/src/modules/admin/README.md](backend/src/modules/admin/README.md)
   Chi tiet Admin Module va role hierarchy
9. [backend/src/modules/README.md](backend/src/modules/README.md)
   Tong quan cac module backend
10. README cua tung module ma ban dang thao_tac (auth, users, messages, v.v.)

### Cho frontend (neu co)

11. [frontend/README.md](frontend/README.md)
   Huong dan khoi dong va su dung frontend (neu co)

## Workflow nhanh

Bat stack dev:

```bat
scripts\dev-build-container.bat
```

Chay test users:

```bat
backend\scripts\tests\test-users.bat
```

Chay test conversations:

```bat
backend\scripts\tests\test-conversations.bat
```

Chay test devices:

```bat
backend\scripts\tests\test-devices.bat
```

Chay test messages:

```bat
backend\scripts\tests\test-messages.bat
```

Chay test calls:

```bat
backend\scripts\tests\test-calls.bat
```

Dung stack dev:

```bat
scripts\dev-stop-container.bat
```
