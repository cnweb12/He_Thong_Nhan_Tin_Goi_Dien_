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

1. [backend/README.md](/d:/BT/He_Thong_Nhan_Tin_Goi_Dien/backend/README.md)
2. [backend/docs/README.md](/d:/BT/He_Thong_Nhan_Tin_Goi_Dien/backend/docs/README.md)
3. [backend/docs/development.md](/d:/BT/He_Thong_Nhan_Tin_Goi_Dien/backend/docs/development.md)
4. [backend/src/modules/README.md](/d:/BT/He_Thong_Nhan_Tin_Goi_Dien/backend/src/modules/README.md)
5. README cua tung module ma ban dang thao tac

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
