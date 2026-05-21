# Frontend

Frontend nay duoc scaffold bang React + Vite + JSX.

## Chay local

```bash
npm install
npm run dev
```

Mac dinh dev server chay o `http://localhost:5173`.

## Cau truc goi y

- `src/features/auth`: dang nhap, dang ky, session
- `src/features/conversations`: inbox, danh sach hoi thoai
- `src/features/messages`: thread, composer, realtime updates
- `src/features/calls`: man hinh call log va call control
- `src/features/devices`: quan ly thiet bi dang nhap
- `src/features/users`: ho so va settings
- `src/services`: lop goi API
- `src/styles`: global styles va theme

## Cau hinh API

Neu backend chay khac `http://localhost:3000`, set:

```bash
VITE_API_BASE_URL=http://localhost:3000
```
