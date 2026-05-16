# App Config

Thu mục này chứa cấu hình runtime của backend.

## Vai trò

Thay vì để từng file tự đọc `process.env`, backend gom việc parse và normalize env tại một chỗ duy nhất.

Nhờ đó:

- cấu hình nhất quán hơn
- dễ tìm nguồn gốc giá trị runtime
- dễ thay đổi mặc định theo môi trường

## Nội dung hiện tại

- `env.js`
  Load `.env`, parse giá trị, chuẩn hóa các biến như:
  - `PORT`
  - `MONGO_*`
  - `JWT_SECRET`

## Khi nào cần sửa ở đây

- thêm biến môi trường mới
- đổi default config
- chuẩn hóa lại kiểu dữ liệu của env

## Quy ước

Nếu cấu hình được dùng ở nhiều tầng, hãy đặt tại đây thay vì parse env rải rác khắp project.
