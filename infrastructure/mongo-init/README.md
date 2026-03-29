# Chat App MongoDB Bootstrap

## 1. Chuẩn bị
```bash
cp .env.example .env
```

## 2. Chạy MongoDB bằng Docker
```bash
docker compose up -d
```

## 3. Kết nối từ backend Node.js
Connection string cho app user:
```text
mongodb://chat_app_user:chat_app_password@localhost:27017/chat_app?authSource=chat_app
```

## 4. Cấu trúc file khởi tạo
- `docker-compose.yml`: chạy MongoDB cục bộ.
- `mongo-init/01-init-chat-app.js`: tạo database, application user, collections, validators và indexes.

## 5. Lưu ý
- Script trong `docker-entrypoint-initdb.d` chỉ chạy khi volume `mongo_data` còn trống.
- Nếu muốn chạy lại từ đầu, xóa volume rồi khởi động lại:
```bash
docker compose down -v
docker compose up -d
```
