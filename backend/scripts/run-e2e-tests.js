const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const backendDir = path.join(__dirname, '..');

try {
  console.log('🔄 Đang khởi động Docker container (MongoDB)...');
  // Chạy docker compose từ thư mục root của dự án
  execSync('docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --wait mongo', { 
    stdio: 'inherit',
    cwd: rootDir 
  });

  console.log('✅ MongoDB đã sẵn sàng! Đang tiến hành chạy test...');
  // Chạy test từ thư mục backend
  execSync('npm run test', { 
    stdio: 'inherit',
    cwd: backendDir
  });

  console.log('🎉 Tất cả test đều thành công!');
} catch (error) {
  console.error('❌ Test thất bại hoặc có lỗi xảy ra trong quá trình thực thi.');
  process.exitCode = 1; // Đảm bảo trả về exit code lỗi
} finally {
  console.log('🧹 Đang dọn dẹp (tắt Docker container)...');
  try {
    execSync('docker compose -f docker-compose.yml -f docker-compose.dev.yml down mongo', { 
      stdio: 'inherit',
      cwd: rootDir 
    });
    console.log('✅ Đã tắt container thành công.');
  } catch (cleanupError) {
    console.error('⚠️ Lỗi khi dọn dẹp Docker:', cleanupError.message);
  }
}
