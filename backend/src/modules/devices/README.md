# Module Devices

Module `devices` luu trang thai theo thiet bi cua user.

## Vai tro trong he thong

Module nay ho tro:

- track thiet bi dang login cua user
- theo doi `deviceId`, `platform`, `isOnline`, `lastActiveAt`
- dat nen cho multi-device support
- cho phep client cap nhat presence theo thiet bi

## Cau truc hien tai

- `models/user-device.model.js`
  Schema luu thong tin thiet bi
- `services/device.service.js`
  Xu ly upsert/list/update presence
- `controllers/device.controller.js`
  HTTP layer cho device APIs
- `routes/device.routes.js`
  Mount API duoi prefix `/devices`
- `validators/device.validator.js`
  Kiem tra input cho device APIs

## API hien co

- `PUT /devices/current`
  Tao hoac cap nhat ban ghi thiet bi hien tai cua user
- `GET /devices/me`
  Liet ke cac thiet bi cua chinh user dang dang nhap
- `PATCH /devices/current/presence`
  Cap nhat `isOnline` va `lastActiveAt` cua mot thiet bi

## Du lieu chinh

- `userId`
- `deviceId`
- `platform`
- `pushToken`
- `isOnline`
- `lastActiveAt`

## Luu y bao mat

- API chi cho phep thao tac tren device cua chinh user dang dang nhap
- `pushToken` duoc luu trong database nhung khong tra ra response
- module khong expose device cua user khac
