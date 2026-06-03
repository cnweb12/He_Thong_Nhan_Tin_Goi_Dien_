# Kế hoạch Triển khai (Deployment) và Tự động hóa CI/CD

Tài liệu này vạch ra các bước cần thiết để triển khai hệ thống nhắn tin - gọi điện từ môi trường local (Docker) lên môi trường Cloud, bao gồm: MongoDB Atlas, Render (Backend), Firebase Hosting (Frontend) và tự động hóa quy trình với GitHub Actions.

## 1. Cơ sở dữ liệu: MongoDB Atlas

**Mục tiêu:** Chuyển đổi từ MongoDB local sang dịch vụ quản lý trên Cloud.

**Các bước thực hiện:**
1. **Tạo Cluster:** Đăng nhập vào [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), tạo một Project và triển khai một Cluster miễn phí (M0).
2. **Cấu hình Network Access:** Thêm IP `0.0.0.0/0` (Allow Access From Anywhere) để Backend trên Render có thể kết nối được.
3. **Cấu hình Database Access:** Tạo một Database User (username và password).
4. **Lấy Connection String:** Lấy URL kết nối (dạng `mongodb+srv://...`).
5. **Khởi tạo dữ liệu (Tự động hóa trên CI/CD):** 
   - Thay vì chạy bằng tay từ máy local, ta sẽ cấu hình Render tự động chạy lệnh đồng bộ Index và tạo Admin mỗi lần deploy (Xem hướng dẫn chi tiết ở phần 2: Backend).

---

## 2. Backend: Render Cloud

**Mục tiêu:** Đưa mã nguồn Backend (Node.js/Express) lên Render như một Web Service.

**Thắc mắc của bạn về biến môi trường (ENV) trên Render:**
* **Câu hỏi:** "Với cách Render xử lý env thì project này cần thay đổi gì không?"
* **Trả lời:** **KHÔNG CẦN THAY ĐỔI CODE.** 
   File `backend/src/config/env.js` của bạn hiện đang dùng `dotenv.config({ path: ... })`. Hàm này sẽ cố gắng đọc file `.env`. Trên Render (và các môi trường Cloud nói chung), file `.env` không được đẩy lên Git. Khi `dotenv` không tìm thấy file, nó sẽ **không văng lỗi (throw error)** mà chỉ bỏ qua, sau đó Node.js sẽ tự động đọc các biến môi trường trực tiếp từ hệ thống của Render (System Environment Variables).
   *Lưu ý duy nhất:* Bạn cần phải khai báo thủ công các biến môi trường này trên giao diện Dashboard của Render.

**Các bước thực hiện:**
1. **Tạo Web Service mới trên Render:** Kết nối với repository GitHub của bạn.
2. **Cấu hình Service:**
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run db:sync-indexes && node scripts/database/seed-super-admin.js && npm start`
     *(Giải thích: Start Command này đảm bảo mỗi khi backend khởi động lại, nó sẽ tự động đồng bộ Index và tạo tài khoản Super Admin nếu chưa có. Cả 2 thao tác này đều an toàn khi gọi nhiều lần "idempotent" nên không lo lỗi dữ liệu).*
3. **Cấu hình Environment Variables (Trên Render Dashboard):**
   - `MONGO_URI`: (Chuỗi kết nối Atlas)
   - `MONGO_APP_DB`: `chat_app`
   - `JWT_SECRET`: (Chuỗi bí mật)
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `https://ten-app-cua-ban.web.app` (URL của Firebase Frontend sau khi deploy)
4. **Triển khai:** Render sẽ tự động build và chạy app. Lưu lại URL được cấp (ví dụ: `https://chat-backend.onrender.com`).

---

## 3. Frontend: Firebase Hosting

**Mục tiêu:** Deploy ứng dụng Vite/React lên Firebase Hosting để phục vụ file tĩnh.

**Yêu cầu thay đổi ở Frontend:**
- Frontend hiện sử dụng biến `VITE_API_BASE_URL` (và `VITE_SOCKET_URL`) để gọi API. Khi build lên production, ta cần truyền URL của Render vào đây.

**Các bước thực hiện:**
1. **Cài đặt Firebase CLI:** `npm install -g firebase-tools`
2. **Đăng nhập và Khởi tạo:**
   - Chạy `firebase login`.
   - Chạy `firebase init hosting` trong thư mục `frontend`.
   - Chọn project Firebase (hoặc tạo mới).
   - Public directory: `dist`
   - Configure as a single-page app: `Yes`
   - Set up automatic builds and deploys with GitHub: `No` (Chúng ta sẽ tự viết file GitHub Actions).
3. **Thêm script Build với ENV:** Đảm bảo quá trình build (chạy Vite) nhận được URL của Backend.

---

## 4. Tự động hóa (CI/CD) với GitHub Actions

**Mục tiêu:** Mỗi khi có thay đổi được push lên nhánh `main`, tự động deploy lên Render và Firebase.

### 4.1. Deploy Backend (Render)
Render hỗ trợ **Auto-Deploy** mặc định khi bạn kết nối GitHub Repo. Mỗi khi có code mới push lên nhánh `main`, Render sẽ tự động pull code và build lại.
*Không cần viết file GitHub Actions riêng trừ khi bạn muốn chạy Test trước khi Deploy.*

### 4.2. Deploy Frontend (Firebase)
Ta sẽ tạo một file workflow: `.github/workflows/deploy-frontend.yml`.

**Chuẩn bị Secrets trên GitHub:**
1. Vào mục Settings > Secrets and variables > Actions của repo.
2. Thêm Secret: `FIREBASE_TOKEN` (Lấy bằng lệnh `firebase login:ci` ở local).
3. Thêm Variable: `VITE_API_BASE_URL` (Giá trị là URL của Render, VD: `https://chat-backend.onrender.com`).
4. Thêm Variable: `VITE_SOCKET_URL` (Cùng URL Render).

**Nội dung workflow đề xuất:**
```yaml
name: Deploy Frontend to Firebase

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**' # Chỉ chạy khi có thay đổi ở frontend

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build Frontend
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
          VITE_SOCKET_URL: ${{ vars.VITE_SOCKET_URL }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-firebase-project-id
          channelId: live
```
*(Ghi chú: Bạn có thể dùng `FIREBASE_TOKEN` thay cho Service Account tùy theo cách bạn chọn khi init Firebase)*.

---

## Tóm tắt những thay đổi trên Codebase hiện tại
1. **Database:** Không thay đổi code. Chỉ cấu hình Atlas và chạy script setup.
2. **Backend:** Không thay đổi code (`dotenv` vẫn an toàn khi không có file `.env`).
3. **Frontend:** Cần chạy `firebase init` để sinh ra file `firebase.json` và `.firebaserc`.
4. **CI/CD:** Cần tạo thư mục `.github/workflows/` và viết file YAML để deploy Frontend lên Firebase. Backend dùng tính năng Auto-deploy của Render.
