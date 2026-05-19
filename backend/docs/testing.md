# Quy Trinh Kiem Thu

## Muc tieu

Tai lieu nay mo ta cach chay test backend trong luc phat trien local va cach chon dung loai test cho tung thay doi.

## 1. Dieu kien tien quyet

Thong thuong, test duoc chay ben trong dev container sau khi stack da khoi dong:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Sau do mo terminal thu hai de chay cac lenh test.

## 2. Cac lenh san co

Trong `backend/package.json` hien co:

```bash
npm test
npm run test:conversations
npm run test:devices
npm run test:users
npm run test:messages
npm run test:calls
npm run typecheck
```

### Y nghia

- `npm test`
  Chay toan bo test backend bang Node test runner
- `npm run test:users`
  Chay toan bo test cua module `users`
- `npm run test:conversations`
  Chay toan bo test cua module `conversations`
- `npm run test:devices`
  Chay toan bo test cua module `devices`
- `npm run test:messages`
  Chay toan bo test cua module `messages`
- `npm run test:calls`
  Chay toan bo test cua module `calls`
- `npm run typecheck`
  Chay `tsc --noEmit` de kiem tra cau hinh va import/export

## 3. Quy trinh kiem thu goi y trong luc code

Khi sua mot module cu the:

1. Bat dev stack.
2. Sua code.
3. Chay test tap trung vao module do.
4. Chay typecheck.
5. Chay full test suite truoc khi ket luan task da xong.

Vi du voi module `users`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:users
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run typecheck
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test
```

Vi du voi module `messages`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:messages
```

Vi du voi module `conversations`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:conversations
```

Vi du voi module `devices`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:devices
```

## 4. Cac lenh thuong dung

### Chay toan bo backend test

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test
```

### Chay test cua module users

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:users
```

### Chay test cua module conversations

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:conversations
```

### Chay test cua module devices

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:devices
```

### Chay test cua module messages

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:messages
```

### Chay test cua module calls

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:calls
```

### Chay typecheck

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run typecheck
```

## 5. Neu thay doi can du lieu database

Neu test hoac verify thu cong can data:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed
```

Neu local data bi loi:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:reset
```

Sau do chay lai test lien quan.

## 6. Khi nao nen chay lenh nao

### Trong luc lap trinh

Nen uu tien test muc tieu:

```bash
npm run test:users
```

Dieu nay cho feedback nhanh hon.

Neu dang sua module messages:

```bash
npm run test:messages
```

Neu dang sua module conversations:

```bash
npm run test:conversations
```

Neu dang sua module devices:

```bash
npm run test:devices
```

### Truoc khi ket task

Nen chay:

```bash
npm run typecheck
npm test
```

## 7. Su co thuong gap

### Backend container chua chay

Hay bat stack dev truoc:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Typecheck loi

Can kiem tra:

- `backend/tsconfig.json`
- file moi co nam trong `include` khong
- import/export co dung theo module style hien tai khong

### Test pass nhung verify thu cong van loi

Can kiem tra them:

- endpoint `/health`
- log backend
- ket noi Mongo
- gia tri trong `.env`
