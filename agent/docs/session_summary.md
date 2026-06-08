# Session Summary

*File này dùng để lưu trữ tóm tắt về phiên làm việc hiện tại và các công việc tiếp theo để duy trì context giữa các session.*

## Phiên làm việc gần nhất
- **Ngày:** 07/06/2026
- **Tóm tắt công việc đã làm:**
  - **Cải thiện UI/UX Khung Chat & Upload File (Frontend):**
    - Sửa lỗi UI ô nhập tin nhắn (`MessageInput`): Cố định kích thước khung preview ảnh (160x160), tách biệt giao diện cho ảnh và tài liệu, thêm nút xóa tệp đính kèm.
    - Sửa lỗi vỡ layout Flexbox (`ChatArea`): Thêm `min-h-0` và `shrink-0` để ngăn khung chat đẩy thanh nhập tin nhắn ra khỏi màn hình khi chọn ảnh lớn.
    - Cải tiến `MessageBubble`: Hiển thị ảnh/file đính kèm mượt mà giống Facebook. Ảnh được bo góc, giới hạn chiều cao tối đa (`280px`), có lớp phủ (overlay) và nút Download trực quan khi hover.
    - Sửa lỗi mất dữ liệu `attachments` lúc chuẩn hóa tin nhắn ở `Home.jsx`.
    - Chuẩn bị sẵn UI Thu hồi tin nhắn: Hiển thị icon thùng rác khi hover vào tin nhắn của bản thân, tự động render khung "Tin nhắn đã được thu hồi" nếu có cờ `deletedAt`.
    - Hoàn thiện tính năng xem ảnh phóng to (Lightbox/Modal) dùng thẻ `<dialog>` HTML5 đè lên mọi layout, kèm thanh công cụ tải xuống/đóng dính (sticky) ở góc phải, cuộn mượt mà.
    - Khắc phục lỗi mở file/ảnh Cloudinary bị chuyển sang tab mới bằng cách chèn cờ `fl_attachment` để ép trình duyệt tải file về.
    - Tối ưu hóa Lightbox: Chuyển toàn bộ CSS quan trọng (nền, gap, vị trí nút) sang Inline Style để chống ghi đè CSS và lỗi biên dịch Tailwind.
    - Tinh chỉnh màu sắc icon Lightbox (Download/X) để tăng tính thẩm mỹ và độ tương phản.
    - Sửa lỗi download file đính kèm (ZIP, DOCX...) bị lỗi 400 do sai cờ transformation trên Cloudinary và cập nhật bộ Icon tệp tin linh hoạt.
    - Hướng dẫn cấu hình Security trên Cloudinary để mở khóa (unblock) việc phân phối tệp PDF/ZIP.

## Công việc tiếp theo (To-Do cho Session tới)
- Giải quyết các vấn đề UI/UX đã được liệt kê trong Backlog:
  - Kết nối logic API và Socket cho tính năng Thu hồi (xóa) tin nhắn vừa tạo UI.
  - Sửa lỗi mất danh sách đoạn chat trên màn hình Mobile.
  - Làm Skeleton loading khi đăng nhập.
- Implement các nút tính năng còn thiếu trên giao diện: Gọi thoại, Gọi video, Xem thông tin, Cài đặt...