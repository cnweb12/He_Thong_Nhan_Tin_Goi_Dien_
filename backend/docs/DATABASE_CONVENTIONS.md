# Quy chuẩn Đặt tên và Đồng bộ Cơ sở dữ liệu (Database Conventions)

Tài liệu này quy định các nguyên tắc thiết kế, đặt tên và quản lý schema cho cơ sở dữ liệu MongoDB trong dự án **Hệ Thống Nhắn Tin Gọi Điện**. Việc tuân thủ tài liệu này giúp tránh lỗi bất đồng bộ giữa tầng ứng dụng và tầng Database (đặc biệt là lỗi `121 - Document failed validation`).

## 1. Nguyên tắc Cốt lõi (Core Principle)

Hệ thống sử dụng cấu trúc bảo mật dữ liệu 2 lớp:

1. **Application-level (Mongoose):** Định nghĩa schema tại `src/modules/*/models/*.model.js`.
2. **Database-level ($jsonSchema):** Định nghĩa cứng dưới tầng DB thông qua script tại `database/mongo/init/`.

**QUY TẮC SỐ 1:** Cả hai nơi này phải đồng nhất 100% về cấu trúc, kiểu dữ liệu, tên trường và các ràng buộc bắt buộc (required). Tuyệt đối không để xảy ra tình trạng Mongoose thiết kế một đằng, Database bắt lỗi một nẻo.

## 2. Quy chuẩn Đặt tên (Naming Conventions)

### 2.1. Collections (Bảng)

- **Định dạng:** Viết thường, danh từ số nhiều (plural), phân cách bằng `snake_case`.
- **Ví dụ đúng:** `users`, `conversations`, `conversation_members`, `user_devices`.
- **Ví dụ sai:** `User`, `conversationMember`.

### 2.2. Fields (Trường dữ liệu)

- **Định dạng chung:** Sử dụng `camelCase`.
- **Quy tắc cho Boolean:** Phải có tiền tố như `is`, `has`, `allow`, hoặc hậu tố `Enabled` để hiện rõ ý nghĩa logic.
  - _Đúng:_ `isActive`, `allowStrangerMessage`, `readReceiptEnabled`.
  - _Sai:_ `active`, `stranger_messages`.
- **Quy tắc cho thời gian (Date):** Phải kết thúc bằng hậu tố `At`.
  - _Đúng:_ `createdAt`, `updatedAt`, `lastSeenAt`, `lastActivityAt`.
  - _Sai:_ `created_date`, `timeUpdate`.
- **Quy tắc cho Khóa ngoại (References/ObjectId):** Phải kết thúc bằng hậu tố `Id`.
  - _Đúng:_ `userId`, `conversationId`.
  - _Sai:_ `user_id`, `User`.

### 2.3. Models & Indexes

- **Tên file Mongoose:** Đặt theo định dạng `<tên-đối-tượng-số-ít>.model.js` (vd: `user.model.js`).
- **Tên Class/Object Model:** Sử dụng `PascalCase` với hậu tố `Model` (vd: `UserModel`).
- **Quản lý Index:** Phải đồng bộ thiết lập index trong file Mongoose và script `database/mongo/sync-indexes.js`.

## 3. Checklist Đồng bộ Schema (Dành cho Developer)

Mỗi khi thêm mới hoặc sửa đổi cấu trúc dữ liệu, bạn **phải** mở song song file Mongoose Model và file khởi tạo của DB để đối chiếu:

| Tiêu chí kiểm tra    | Mongoose Schema (`src/modules/*/models/`)                                                          | MongoDB `$jsonSchema` (`database/mongo/init/`)                                    |
| -------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Tên trường**       | Khớp chính tả từng ký tự (VD: `allowStrangerMessage` - không dư/thiếu chữ `s`).                    | Khớp chính tả 100% trong block `properties`.                                      |
| **Trường bắt buộc**  | Nếu DB yêu cầu, Mongoose bắt buộc phải thiết lập `default` hoặc `required: true`.                  | Khai báo đầy đủ trong mảng `required: ["fieldA", ...]`.                           |
| **Kiểu dữ liệu**     | Dùng type chuẩn của Mongoose (String, Boolean, Date, ObjectId).                                    | Dùng BSON type tương ứng (string, bool, date, objectId).                          |
| **Giá trị mặc định** | Nên khai báo `default` ở Mongoose để tự động chèn giá trị, tránh bị thiếu field khi lưu.           | (Tùy chọn)                                                                        |
| **Dữ liệu rác**      | Tầng Service/Controller phải lọc bỏ các trường không hợp lệ (vd: `passwordConfirm`) trước khi lưu. | Khuyến nghị đặt `additionalProperties: false` để DB tự động từ chối tài liệu rác. |

## 4. Cẩm nang Gỡ lỗi Validation

Nếu bạn nhận được lỗi HTTP `500` kèm dòng `MongoServerError: Document failed validation` (Mã 121):

1. Lỗi này phát sinh ở tầng Database, do document chuẩn bị lưu không khớp với luật của `$jsonSchema`.
2. Hãy mở terminal log của container backend. Middleware xử lý lỗi sẽ in ra cục object `Mongo errInfo`.
3. Đọc chi tiết:
   - `missingProperties`: DB đang yêu cầu một field mà Mongoose không gửi xuống -> Sửa Mongoose Schema thêm `default`.
   - `propertiesNotSatisfied`: Sai kiểu dữ liệu hoặc tên trường không đúng chuẩn.
4. Chỉnh sửa lại `*.model.js` cho khớp và gửi lại request.
