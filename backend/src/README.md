# Server & App Architecture

Tai lieu nay mo ta vai tro cua `app.js`, `server.js` va router tong trong thu muc `src/`.

## `src/app.js` - Application layer

`app.js` chi cau hinh Express app:

- Khoi tao instance Express.
- Dang ky middleware toan cuc, vi du JSON parser va CORS neu duoc cau hinh.
- Mount router tong tu `routes/index.js`.
- Gan error handler tap trung de chuan hoa response loi.

`app.js` khong mo port va khong quan ly lifecycle cua process. Nho vay test co the import app truc tiep bang `supertest` ma khong can listen port that.

## `src/server.js` - Network & process layer

`server.js` la entry point khi chay backend that:

- Khoi tao ket noi ha tang, vi du MongoDB.
- Tao HTTP server tu `app`.
- Lang nghe tren port cau hinh.
- Xu ly graceful shutdown khi nhan `SIGINT` hoac `SIGTERM`.
- Bat loi process-level nhu `unhandledRejection` hoac `uncaughtException`.

## Router tong

`routes/index.js` gom cac module route vao Express router chinh.

Nhung mount lien quan truc tiep toi auth, friend va call:

- `/api/auth` -> module `auth`
- `/api/users` -> module `users`, bao gom friend APIs
- `/api/calls` -> call log APIs
- `/api/twilio` -> Twilio Voice token va webhook

Mot so mount khac:

- `/api/conversations`
- `/api/messages`
- `/api/devices`
- `/api/admin`
- `/api/upload`

## Luong request tong quat

Request vao backend thuong di theo thu tu:

1. `server.js` nhan HTTP connection.
2. `app.js` chay global middleware.
3. `routes/index.js` chon module router.
4. Module route chay auth/rate-limit middleware neu co.
5. Controller validate request va goi service.
6. Service xu ly business logic va lam viec voi model.
7. Controller tra response JSON.
8. Neu co loi, error handler trong app chuan hoa response.

## Module lien quan phan auth/friend/call

### Auth

Module `auth` phu trach dang ky, dang nhap, refresh access token va logout. Cac protected route cua module khac dung `authenticateJWT(config.jwtSecret)` de doc `req.user`.

### Users/Friend

Module `users` quan ly profile, search user va friend flow. Friend APIs nam chung trong `/api/users` va dung collection `user_friends` de luu request/relationship.

### Calls/Twilio

Module `calls` luu call log theo conversation, participant state va trang thai cuoc goi. Route `/api/twilio/token` cap Twilio Voice token cho client, con `/api/twilio/voice` la webhook Twilio goi truc tiep de nhan TwiML.

## Ghi chu ve bao mat

- Protected route phai lay identity tu JWT da verify, khong lay userId tu body neu khong can thiet.
- Public route nhu login/register nen co validation va rate-limit phu hop.
- Webhook public nhu `/api/twilio/voice` nen duoc cau hinh trong Twilio console va can han che log thong tin nhay cam.
