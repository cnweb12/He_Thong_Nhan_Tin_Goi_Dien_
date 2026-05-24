# Quy Trình Phát Triển

## Mục tiêu

Tài liệu này mô tả cách chạy backend và MongoDB local bằng Docker, bật hot reload, và đi theo một quy trình phát triển lặp lại được.

## 1. Điều kiện cần có

Trước khi bắt đầu, máy cần có:

- Docker Desktop đang chạy
- `docker compose` sử dụng được
- file `.env` tại thư mục gốc của repository

Nên kiểm tra nhanh:

```bash
docker version
docker compose version
```

Neu `docker version` khong ket noi duoc toi daemon, hay mo Docker Desktop va cho den khi engine san sang.

## 2. Cấu hình môi trường

Tất cả biến runtime được đọc từ file `.env` ở root project.

### Tạo file `.env`

Dùng file mẫu cho môi trường phát triển:

```bash
copy .env.development.example .env
```

Giá trị gợi ý:

```env
NODE_ENV=development
PORT=3000

MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=rootpassword

MONGO_APP_DB=chat_app_dev
MONGO_APP_USER=chat_app_user
MONGO_APP_PASSWORD=chat_app_password
```

### Lưu ý

- file `.env` phải nằm ở root repository
- backend container kết nối Mongo bằng service name `mongo`
- ở môi trường dev, Mongo map ra host qua cổng `27018`

## 3. Khởi động stack dev

Từ root project, chạy:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Quá trình này sẽ:

- khởi động MongoDB bằng image `mongo:8.0`
- build backend bằng stage `development` trong `backend/Dockerfile`
- bind mount thư mục `./backend` vào container
- mount volume `/app/node_modules`
- chạy `backend/docker/dev-entrypoint.sh`
- chạy backend bằng `npm run dev`
- bật `tsx watch src/server.js` để hot reload

## 4. Kiểm tra stack đã sẵn sàng

Chờ đến khi thấy:

- log Mongo có dòng `Waiting for connections`
- log backend có dòng `[server] Listening on port 3000.`

Sau đó kiểm tra health endpoint:

```bash
curl http://localhost:3000/health
```

Nếu dùng PowerShell:

```powershell
Invoke-WebRequest http://localhost:3000/health
```

## 5. Đặc điểm của môi trường dev

- mã nguồn backend được bind mount vào container
- backend tự reload khi file thay đổi
- `MONGO_AUTO_INDEX=true`
- dữ liệu Mongo được lưu trong volume `mongo_data`
- Mongo có healthcheck bằng `mongosh`

## 6. Quy trinh dev hang ngay

Quy trinh goi y:

1. Mo terminal tai root project.
2. Khoi dong stack dev.
3. Cho Mongo healthy va backend lang nghe cong `3000`.
4. Sua code trong `backend/`.
5. De `tsx watch` tu reload server.
6. Mo terminal khac de chay test hoac typecheck.
7. Seed/reset database neu task can.
8. Dung stack khi ket thuc phien lam viec.

## 7. Chay lenh trong backend container

Mo terminal thu hai va chay:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend <command>
```

Vi du:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run typecheck
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:users
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:sync-indexes
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:reset
```

## 8. Thao tac voi database trong luc dev

### Dong bo index

Dung khi schema thay doi index:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:sync-indexes
```

### Seed du lieu

Dung khi can du lieu mau:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed
```

### Seed super admin account

Dung khi can tao super admin account cho RBAC:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend node scripts/database/seed-super-admin.js
```

Truoc khi chay, can dat environment variables trong file `.env`:

```env
SUPER_ADMIN_PHONE=+84900000000
SUPER_ADMIN_PASSWORD=your_secure_password
SUPER_ADMIN_DISPLAY_NAME=Super Admin
```

**IMPORTANT:** Khong commit super admin credentials vao version control.

### Reset local database

Dung khi local data bi loi hoac can lam sach:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:reset
```

Lenh nay chi dung cho moi truong phat trien local.

## 9. Dung stack dev

Neu dang chay foreground:

- nhan `Ctrl + C`

Sau do dung container gon gang:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Neu muon xoa ca volume:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Can than vi lenh nay xoa du lieu Mongo local.

## 10. Su co thuong gap

### Docker daemon khong san sang

Dau hieu:

- `open //./pipe/dockerDesktopLinuxEngine`
- `failed to connect to the docker API`

Cach xu ly:

1. Mo Docker Desktop
2. Cho engine san sang
3. Chay lai `docker version`
4. Chay lai lenh compose

### Mongo bao unclean shutdown

Thuong la do lan dung truoc khong graceful. Neu log recovery thanh cong thi thuong van an toan trong local dev.

### Backend khong len

Can kiem tra:

- file `.env` co ton tai o root khong
- Mongo container co healthy khong
- cong `3000` co dang bi chiem khong
- log backend co exception luc startup khong

### Health endpoint loi

Can kiem tra:

- log backend
- log Mongo
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml ps`

## 11. Nguyen tac lam viec

- de business logic trong `services`
- giu route file gon
- giu Mongo infrastructure trong `backend/database/mongo`
- chay `typecheck` truoc khi day code
- chay test muc tieu trong luc code, va chay test rong hon truoc khi ket task
