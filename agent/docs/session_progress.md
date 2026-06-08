# Session Progress

*File này ghi nhận tiến độ tổng quan của toàn bộ dự án từ góc nhìn của Agent, nhằm duy trì bối cảnh (context) dài hạn.*

## Trạng thái dự án
- **Giai đoạn hiện tại:** Đang cấu hình và tối ưu hóa quy trình làm việc của Agent/LLM và cải thiện giao diện người dùng (UI/UX). Chuẩn bị chuyển đổi hệ thống lưu trữ tệp tin.
- **Backend:** 
  - **Công nghệ:** Node.js (Express.js), MongoDB (Mongoose), Socket.io.
  - **Testing:** Native Node.js Test Runner (`node --test`), C8 (Coverage).
  - **Tiến độ:** Đã thiết lập cấu trúc cơ sở dữ liệu, API, tính năng đính kèm tệp tin (sắp chuyển sang Cloudinary) và các script hỗ trợ (seed, reset DB), test case đã được viết cho nhiều modules.
- **Frontend:** 
  - **Công nghệ:** React 19, Vite, Tailwind CSS (v4), Socket.io-client.
  - **Testing:** Vitest, React Testing Library.
  - **Tiến độ:** Đang hoàn thiện giao diện. Khung sườn và các Component cơ bản đã có nhưng còn nhiều lỗi UI/UX và nhiều chức năng/nút bấm chỉ mới là dạng giao diện tĩnh (mockup). Đã tích hợp gửi tin nhắn có hình ảnh/tệp tin.

-  **Đã hoàn thành**:
   - Thiết lập module upload file sử dụng Adapter Pattern để dễ chuyển đổi dịch vụ lưu trữ.
  - Triển khai thành công Cloudinary Adapter cho upload hình ảnh/tệp tin.
  - Cấu hình thành công biến môi trường trong Docker cho Frontend/Backend và kiểm thử luồng upload đầu cuối hoàn tất.
  - Hoàn thiện UI Upload File và UI hiển thị Tệp đính kèm/Ảnh trong `MessageBubble` (tích hợp nút Download, Fixed Size).
  - Chỉnh sửa xong cấu trúc Flexbox tránh vỡ Layout khi đính kèm file to ở Frontend.
  - Xây dựng thành công hệ thống Xem trước ảnh (Lightbox) hiển thị toàn màn hình, sử dụng Inline Styles và tinh chỉnh màu sắc icon để đạt trải nghiệm tốt nhất.
  - Khắc phục hoàn toàn cơ chế download tệp tin từ Cloudinary và cải thiện bộ nhận diện icon cho đa dạng loại tệp.
  - Cấu hình bảo mật Cloudinary để cho phép phân phối các định dạng tài liệu đặc biệt (PDF/ZIP).


## Các vấn đề tồn đọng (Backlog)
- **Lỗi UI/UX (Bugs):**
  - Bị mất danh sách đoạn chat trên màn hình Mobile (do logic tự động chọn chat đầu tiên).
  - Load trang chậm khi đăng nhập do bị block chờ dữ liệu (Cần nâng cấp thành Skeleton loading).
- **Tính năng cần phát triển (Missing Features):**
  - Hoàn thiện API và logic Socket cho tính năng Thu hồi tin nhắn (Soft Delete).
  - Chức năng trong Khung Chat: Tìm kiếm, Gọi thoại, Gọi video, Xem thông tin.
  - Chức năng ở Thanh điều hướng (Sidebar): Xem Thông báo, Cài đặt, Quản lý tài khoản.
  - Chức năng gửi tin: Gửi Emoji.
  - Chức năng lọc danh sách Chat: Tab "Ưu tiên" và "Khác".

## Thành tựu chính (Milestones)
- Đã quy chuẩn hóa luật chạy multi-task/luồng tác vụ cho Agent.
- Đã thiết lập cơ chế Tracking Session để lưu ngữ cảnh làm việc liên tục.
- Hoàn thiện hệ thống hướng dẫn Agent (GEMINI.md) phân cấp theo Frontend, Backend và Root; bao gồm quy tắc tự động cập nhật tiến độ (Auto-update Session).
- Hoàn thiện cơ chế Upload File: Chuyển đổi thành công sang Cloudinary Storage để lưu trữ hình ảnh/tệp tin, sẵn sàng cho việc deploy lên mạng (Render).
