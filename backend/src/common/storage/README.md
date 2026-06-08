# Storage Module - Cloudinary Integration

## Tổng quan
Module này cung cấp abstraction layer cho file storage sử dụng Adapter Pattern. Hiện tại đã implement Cloudinary Adapter.

## Cấu trúc
```
common/storage/
├── storage.interface.js      # Interface chuẩn cho mọi storage provider
├── adapters/
│   └── cloudinary.adapter.js # Cloudinary adapter implementation
└── README.md                 # File này
```

## Cấu hình Cloudinary

### 1. Tạo Cloudinary Account
1. Truy cập [Cloudinary Console](https://cloudinary.com/console)
2. Đăng ký hoặc đăng nhập
3. Tạo mới project hoặc sử dụng project có sẵn

### 2. Lấy thông tin cấu hình
Trong Cloudinary Console:
- **Cloud Name**: Có trong Dashboard
- **API Key**: Có trong Dashboard  
- **API Secret**: Có trong Dashboard (cần click để reveal)

### 3. Thêm Environment Variables
Thêm vào file `.env` trong project root:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=chat_uploads  # Optional, mặc định là "chat_uploads"
```

### 4. Kiểm tra cấu hình
Khởi động lại server và kiểm tra log để đảm bảo không có lỗi cấu hình.

## Sử dụng

### Trong Controller
```javascript
const CloudinaryAdapter = require('../../../common/storage/adapters/cloudinary.adapter');
const config = require('../../../config/env');

const storage = new CloudinaryAdapter(config.cloudinary);

// Upload file
const result = await storage.uploadFile(fileBuffer, {
  filename: 'original.jpg',
  mimetype: 'image/jpeg'
});

// Kết quả:
// {
//   url: 'https://res.cloudinary.com/...',
//   filename: 'chat_uploads/123456-original.jpg',
//   size: 12345,
//   mimetype: 'image/jpeg',
//   originalname: 'original.jpg'
// }
```

## Mở rộng - Tambah Adapter mới

Để thêm storage provider mới (ví dụ: Firebase, AWS S3):

1. Tạo adapter mới implement `StorageInterface`:
```javascript
const StorageInterface = require('../storage.interface');

class FirebaseAdapter extends StorageInterface {
  async uploadFile(fileBuffer, options) {
    // Implement upload logic
  }
  
  async deleteFile(fileUrl) {
    // Implement delete logic
  }
  
  getFileUrl(filename) {
    // Implement URL generation
  }
  
  validateConfig() {
    // Validate configuration
  }
}

module.exports = FirebaseAdapter;
```

2. Cập nhật controller để sử dụng adapter mới
3. Thêm environment variables tương ứng

## Lợi ích của Architecture này
- **Dễ đổi provider**: Chỉ cần thay adapter, không ảnh hưởng business logic
- **Testable**: Dễ mock interface cho unit tests
- **Scalable**: Dễ mở rộng với nhiều provider khác nhau
- **Maintainable**: Code tách biệt, dễ maintain

## Troubleshooting

### Lỗi "Cloudinary configuration is missing"
Kiểm tra các biến môi trường trong file `.env`:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`  
- `CLOUDINARY_API_SECRET`

### Lỗi upload thất bại
Kiểm tra:
- Internet connection
- Cloudinary account limits/quota
- File size không vượt quá 10MB
- MIME type được support bởi Cloudinary

## Tài liệu tham khảo
- [Cloudinary Node.js SDK Documentation](https://cloudinary.com/documentation/node_integration)
- [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images)
