# Database Scripts

Thu mục này chứa các script thao tác database phục vụ phát triển local.

## Mục đích

Các script ở đây không phải code chạy trong request lifecycle của app.
Chúng được developer chạy thủ công khi cần:

- seed dữ liệu dev
- reset database local
- chuẩn bị dữ liệu để test hoặc demo

## Nội dung hiện tại

- `seed-dev-data.js`
  Tạo dữ liệu mẫu cho local development
- `reset-local-database.js`
  Xóa database local để làm sạch môi trường

## Cách chạy

Thông qua npm scripts:

```bash
npm run db:seed
npm run db:reset
```

Hoặc chạy trong backend container khi stack dev đang bật:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:reset
```

## Lưu ý

- chỉ dùng cho local/dev environment
- `reset-local-database.js` sẽ xóa dữ liệu local hiện tại
- script vận hành kiểu này nên để ở `scripts/`, không để dưới `src/`
