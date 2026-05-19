# Mongo Infrastructure

Thu mục này chứa tầng hạ tầng MongoDB của backend.

## Vai trò

Đây không phải feature module, mà là nơi gom toàn bộ phần dùng chung cho việc:

- kết nối MongoDB
- đăng ký model một lần khi app boot
- healthcheck database
- đồng bộ index
- chuẩn hóa dữ liệu trước khi vào DB
- ánh xạ lỗi Mongo sang lỗi ứng dụng

## Nội dung chính

- `init/`
  Script bootstrap chạy khi Mongo container khởi động lần đầu
- `connection.js`
  Kết nối, ngắt kết nối, retry, singleton access tới Mongoose
- `health.js`
  Helper healthcheck dùng cho endpoint `/health`
- `register-models.js`
  Require các model đúng một lần khi app start
- `sync-indexes.js`
  Entry point để đồng bộ index thủ công
- `mongo-error.mapper.js`
  Ánh xạ lỗi MongoDB/Mongoose sang lỗi dễ xử lý hơn ở tầng app
- `normalize.js`
  Các helper normalize dữ liệu hướng Mongo
- `types.js`
  Kiểu dùng chung cho Mongo
- `constants.js`
  Hằng số liên quan tới Mongo

## Khi nào cần đọc thư mục này

Người mới thường chỉ cần đọc khi:

- app không kết nối được Mongo
- cần hiểu vì sao `phone`, `username`, `directKey` được normalize
- cần sync index
- cần hiểu lỗi Mongo được đổi sang lỗi HTTP như thế nào

## Quy ước

Giữ toàn bộ database infrastructure ở đây. Không tách lẻ trách nhiệm này thêm một lần nữa dưới `src/`.
