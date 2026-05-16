# Backend

Mongo infrastructure now lives in `backend/database/mongo`.

## Backend nay giai quyet bai toan gi

Backend hien duoc to chuc theo huong chat app:

- `auth`
  dang ky, dang nhap, refresh token, logout
- `users`
  profile, settings, search user
- `conversations`
  metadata conversation, membership, inbox projection
- `messages`
  gui tin nhan, cap nhat unread count, doc lich su tin nhan
- `devices`
  luu trang thai theo thiet bi
- `calls`
  luu call log va thao tac lien quan cuoc goi

## API surface hien tai

Dang duoc mount vao router tong:

- `/health`
- `/auth`
- `/users`
- `/conversations`
- `/messages`
- `/devices`
- `/calls`

## Quan he giua cac module

- `auth` phu thuoc vao `users` va `devices`
- `messages` phu thuoc vao `conversations` va `user_conversation_inbox`
- `conversations` quan ly membership va inbox projection
- `calls` dung `conversations` de xac nhan membership truoc khi thao tac

Neu can hieu luong chat chinh, thu tu doc hop ly la:

1. `auth`
2. `users`
3. `conversations`
4. `messages`
5. `calls`

## Scripts

- `npm start`
- `npm run dev`
- `npm run db:sync-indexes`
- `npm run db:seed`
- `npm run db:reset`
- `npm run test:conversations`
- `npm run test:devices`
- `npm run test:users`
- `npm run test:messages`
- `npm run test:calls`
- `npm run typecheck`

## Docker

- Development:
  `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
- Production:
  `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`
- Backend health endpoint: `http://localhost:3000/health`

## Structure

- `database/mongo`: Mongo infrastructure and init scripts
- `src/config`: application runtime configuration used by the HTTP app
- `src/modules`: domain models and services
- `src/routes`: HTTP routes
- `src/middleware`: Express middleware layer placeholder
- `src/realtime`: realtime transport layer placeholder for chat/call signaling
- `src/common`: shared app-level constants, errors, response helpers, utilities
- `scripts/database`: local database utilities
- `tests/config/database`: test database configuration

## Architecture Notes

- Keep `database/mongo` outside `src` because it is infrastructure, not a feature module.
- Keep `src/modules` for business/domain code grouped by bounded context.
- Keep empty placeholder folders when they represent a real future layer in the target architecture.
- Do not duplicate the same responsibility in both `src/*` and root-level folders.

## Trang thai module

- `auth`
  Hoan thien co route/controller/service/validator
- `users`
  Hoan thien co route/controller/service/validator va test
- `messages`
  Hoan thien co route/controller/service/validator va test
- `conversations`
  Hoan thien co route/controller/service/validator va test
- `devices`
  Hoan thien co route/controller/service/validator va test
- `calls`
  Hoan thien co route/controller/service/validator va test

## Environment Docs

- [docs/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\docs\README.md)
- [docs/development.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\docs\development.md)
- [docs/testing.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\docs\testing.md)
- [docs/production.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\docs\production.md)
- [docs/security.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\docs\security.md)

## Module Docs

- [src/modules/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\src\modules\README.md)
- [src/modules/auth/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\src\modules\auth\README.md)
- [src/modules/users/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\src\modules\users\README.md)
- [src/modules/messages/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\src\modules\messages\README.md)
- [src/modules/conversations/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\src\modules\conversations\README.md)
- [src/modules/devices/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\src\modules\devices\README.md)
- [src/modules/calls/README.md](d:\BT\He_Thong_Nhan_Tin_Goi_Dien\backend\src\modules\calls\README.md)
