# Quy Trinh Phat Trien

## Muc tieu

Tai lieu nay mo ta cach chay backend va MongoDB local bang Docker, bat hot reload, va di theo mot quy trinh phat trien lap lai duoc.

## 1. Dieu kien can co

Truoc khi bat dau, may can co:

- Docker Desktop dang chay
- `docker compose` su dung duoc
- file `.env` tai thu muc goc cua repository

Nen kiem tra nhanh:

```bash
docker version
docker compose version
```

Neu `docker version` khong ket noi duoc toi daemon, hay mo Docker Desktop va cho den khi engine san sang.

## 2. Cau hinh moi truong

Tat ca bien runtime duoc doc tu file `.env` o root project.

### Tao file `.env`

Dung file mau cho moi truong phat trien:

```bash
copy .env.development.example .env
```

Gia tri goi y:

```env
NODE_ENV=development
PORT=3000

MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=rootpassword

MONGO_APP_DB=chat_app_dev
MONGO_APP_USER=chat_app_user
MONGO_APP_PASSWORD=chat_app_password
```

### Luu y

- file `.env` phai nam o root repository
- backend container ket noi Mongo bang service name `mongo`
- o moi truong dev, Mongo map ra host qua cong `27018`

## 3. Khoi dong stack dev

Tu root project, chay:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Qua trinh nay se:

- khoi dong MongoDB bang image `mongo:8.0`
- build backend bang stage `development` trong `backend/Dockerfile`
- bind mount thu muc `./backend` vao container
- mount volume `/app/node_modules`
- chay `backend/docker/dev-entrypoint.sh`
- chay backend bang `npm run dev`
- bat `tsx watch src/server.js` de hot reload

## 4. Kiem tra stack da san sang

Cho den khi thay:

- log Mongo co dong `Waiting for connections`
- log backend co dong `[server] Listening on port 3000.`

Sau do kiem tra health endpoint:

```bash
curl http://localhost:3000/health
```

Neu dung PowerShell:

```powershell
Invoke-WebRequest http://localhost:3000/health
```

## 5. Dac diem cua moi truong dev

- ma nguon backend duoc bind mount vao container
- backend tu reload khi file thay doi
- `MONGO_AUTO_INDEX=true`
- du lieu Mongo duoc luu trong volume `mongo_data`
- Mongo co healthcheck bang `mongosh`

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
