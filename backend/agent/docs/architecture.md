# Backend Architecture

## 1. Cấu trúc thư mục (Folder Structure)
Dự án áp dụng mô hình Modular/Feature-based kết hợp với Controller-Service:
- `/src/routes`: Định nghĩa các Endpoints (REST API) và phân tuyến.
- `/src/modules`: Chứa logic chính chia theo từng domain (auth, users, conversations, messages, calls). Trong mỗi module sẽ có `controller.js` và `service.js`.
- `/src/middleware`: Các middleware dùng chung (Auth, Error handling, Rate limiting).
- `/src/common`: Cấu hình Response format, Custom Errors, Constants.
- `/src/socket`: Quản lý các Events và kết nối của Socket.io.
- `/database/mongo`: Cấu hình kết nối và Schema/Model Mongoose.
- `/tests`: Nơi chứa toàn bộ Unit và Integration Test.

## 2. Luồng xử lý (Data Flow)
**Request -> Route -> Middleware (Auth/Validate) -> Controller -> Service -> Model (MongoDB) -> Service -> Controller -> Response.**
- **Controller:** Chỉ lo tiếp nhận Request (req, res), trích xuất tham số và trả về Response. Không chứa logic nghiệp vụ.
- **Service:** Đảm nhận toàn bộ Business Logic và thao tác với Database (Model).