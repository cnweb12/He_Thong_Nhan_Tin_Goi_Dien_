# Cloud Storage Migration Plan (Adapter Pattern)

## Mục tiêu
Chuyển đổi cơ chế lưu trữ file từ Local Storage sang Cloud Storage để tránh mất dữ liệu trên môi trường Render (do Ephemeral File System), sử dụng kiến trúc Adapter Pattern để dễ dàng đổi provider.

## Kiến trúc thiết kế

### Adapter Pattern
```
┌─────────────────────────────────────────────────────────┐
│                    Upload Controller                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Storage Interface   │ (Abstraction Layer)
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Cloudinary      │     │ Firebase        │
│ Adapter         │     │ Adapter         │
└─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Cloudinary API  │     │ Firebase API    │
└─────────────────┘     └─────────────────┘
```

### Storage Interface
Định nghĩa chuẩn interface mà mọi storage provider phải implement:
```javascript
{
  uploadFile(fileBuffer, options): Promise<{ url, filename, size, mimetype }>,
  deleteFile(fileUrl): Promise<void>,
  getFileUrl(filename): string
}
```

## Phương án kỹ thuật hiện tại
**Frontend → Backend → Cloudinary**
- Frontend gửi file cho Backend
- Backend giữ file trên RAM sử dụng `multer.memoryStorage()`
- Backend sử dụng Storage Interface → Cloudinary Adapter để upload
- Backend trả URL về cho Frontend

## Các bước thực hiện

### 1. Cài đặt dependencies
- Cài đặt `cloudinary` package
- (Optional) `firebase-admin` cho tương lai

### 2. Thiết kế Storage Interface
- Tạo `src/common/storage/storage.interface.js`
- Định nghĩa methods bắt buộc phải implement

### 3. Implement Cloudinary Adapter
- Tạo `src/common/storage/adapters/cloudinary.adapter.js`
- Implement Storage Interface
- Xử lý upload, delete, get URL theo Cloudinary API

### 4. Cấu hình Environment Variables
- Thêm vào `.env`:
  - `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
  - `CLOUDINARY_API_KEY` - API key
  - `CLOUDINARY_API_SECRET` - API secret

### 5. Refactor Upload Middleware
- Chuyển từ `multer.diskStorage` sang `multer.memoryStorage`
- Giữ nguyên limits (10MB) và validation logic

### 6. Refactor Upload Controller
- Import Storage Interface và Cloudinary Adapter
- Thay đổi logic:
  - Gọi storage service thông qua interface
  - Trả về URL từ Cloudinary
  - Handle lỗi upload

### 7. Cập nhật Tests
- Mock Cloudinary API trong tests
- Update upload controller tests để mock storage service
- Test error handling cho Cloudinary failures

### 8. Deployment Considerations
- Xóa thư mục `uploads/` local (không còn cần thiết)
- Cập nhật Dockerfile để không cần volumes cho uploads
- Add Cloudinary credentials vào Render environment variables

## Lợi ích
- Không mất dữ liệu khi redeploy trên Render
- Dễ dàng đổi provider (Cloudinary → Firebase → AWS S3) bằng cách implement adapter mới
- Built-in CDN, image optimization của Cloudinary
- Dễ dàng test bằng mock interface
- Tách biệt logic của từng provider

## Rủi ro và Mitigation
- **Rủi ro:** Cloudinary quota limits
  - **Mitigation:** Implement rate limiting, monitor storage usage
- **Rủi ro:** Network latency khi upload lên Cloudinary
  - **Mitigation:** Implement retry logic, timeout handling
- **Rủi ro:** Cloudinary credentials exposure
  - **Mitigation:** Store in environment variables, never commit to git

## Rollback Plan
Giữ lại code cũ trong git history, có thể revert bằng cách:
- Revert middleware về `diskStorage`
- Remove Cloudinary dependencies
- Restore local uploads directory
