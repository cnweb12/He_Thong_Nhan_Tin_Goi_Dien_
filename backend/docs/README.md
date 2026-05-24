# Tài liệu Backend

- `development.md`: quy trình phát triển cục bộ và thiết lập môi trường phát triển
- `testing.md`: quy trình kiểm thử cục bộ và các bước xác thực
- `production.md`: thiết lập container hướng đến sản phẩm và ghi chú triển khai
- `security.md`: kết quả rà soát bảo mật/quyền riêng tư ở mức mã và API
- `api/admin-api.md`: tài liệu API cho Admin Module (RBAC)
- `migrations/rbac-migration.md`: hướng dẫn migration sang hệ thống RBAC

## Nên đọc theo thứ tự này nếu mới vào dự án

1. `../README.md`
   Tổng quan backend, trạng thái mô-đun và bề mặt API hiện tại
2. `development.md`
   Cách dùng môi trường phát triển
3. `testing.md`
   Cách chạy kiểm thử/kiểm tra kiểu
4. `production.md`
   Cách chạy stack sản phẩm
5. `security.md`
   Các kiểm soát bảo mật đã có và rủi ro còn lại
6. `api/admin-api.md`
   Tài liệu API cho Admin Module và RBAC
7. `migrations/rbac-migration.md`
   Hướng dẫn migration nếu cần thêm RBAC vào hệ thống hiện có
8. README của từng mô-đun trong `src/modules`
   Hiểu bối cảnh nghiệp vụ của từng miền

## Tài liệu bổ trợ khác

- `../scripts/README.md`
  Giải thích các tập lệnh hỗ trợ backend
- `../database/mongo/README.md`
  Giải thích tầng hạ tầng MongoDB

## RBAC System

Hệ thống phân quyền Role-Based Access Control (RBAC) với 3 cấp độ:

### Roles
- **user**: Người dùng bình thường - có thể nhắn tin, thêm bạn bè
- **admin**: Quản trị viên - quản lý user, tin nhắn, cài đặt hệ thống, kiểm soát nội dung
- **super_admin**: Siêu quản trị viên - có tất cả quyền của admin + thay đổi role user

### Admin Module
Module admin (`src/modules/admin/`) cung cấp các endpoints cho quản trị:
- Quản lý user (xem, khóa/mở khóa, thay đổi role)
- Quản lý tin nhắn (xem lịch sử, xóa)
- Cài đặt hệ thống
- Kiểm soát nội dung (từ khóa cấm)

Xem chi tiết tại:
- `src/modules/admin/README.md`
- `api/admin-api.md`
