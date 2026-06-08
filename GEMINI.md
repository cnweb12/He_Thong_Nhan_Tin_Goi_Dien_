# Cấu hình Gemini Code Assist (Workspace)

Các quy tắc chung về Vai trò, Giao tiếp, Clean Code và Xử lý lỗi đã được kế thừa từ cấu hình Global (`~/.gemini/gemini.md`). Các cấu hình dưới đây là phần bổ sung và ghi đè cho project hiện tại.

## 1. Testing & Tài liệu
- **Khảo sát trước khi test:** Trước khi viết test, bắt buộc kiểm tra và hiểu rõ ngữ cảnh, mục đích của đối tượng. Đảm bảo không có sự mơ hồ hay thiếu sót.
- **Framework:** Sử dụng framework tương ứng với từng phần của dự án (ví dụ: Jest/Mocha cho Node.js, Vitest/Cypress cho Frontend).
- **Unit Test:** Luôn đính kèm Unit Test cho các hàm logic quan trọng.
- **Tài liệu:** Chỉ viết Javadoc/Docstring cho public API và các class/interface quan trọng, tránh comment cho code hiển nhiên. Nếu cần hiểu context codebase hãy đọc các file `README.md` tại mỗi thư mục cũng như các thư mục `docs`

## 2. Hợp đồng Phạm vi Tác vụ (Scope Contract)
Phạm vi (Scope) của một task **được xác định dựa trên yêu cầu cụ thể của từng task do user giao**. Để tránh rủi ro hỏng hệ thống do tự ý mở rộng, Agent phải tuân thủ:
- **Tôn trọng ranh giới Task:** Chỉ chỉnh sửa/thêm code phục vụ trực tiếp cho mục tiêu của task được giao. Nếu task yêu cầu refactor, thì mới được refactor; nếu task là vá lỗi nhỏ, tuyệt đối không đụng vào cấu trúc xung quanh.
- **YAGNI (You Aren't Gonna Need It):** Không thiết kế dư thừa các tính năng/tham số "để dành" nằm ngoài yêu cầu hiện tại.
- **Xử lý Bug ngoài lề:** Nếu phát hiện lỗi hoặc đoạn code không tối ưu ở file khác/luồng khác (không cản trở việc hoàn thành task hiện tại), **KHÔNG** tự ý sửa. Hãy ghi log vào Backlog trong `docs/agent/observations` và báo cáo lại cho user.

## 3. Trạng thái Session
Agent sẽ luôn tham chiếu và cập nhật 2 file sau để bảo đảm tính liên tục (Context) giữa các phiên làm việc:
- **[Session Summary](./agent/docs/session_summary.md):** Bắt buộc tự động cập nhật nội dung (tóm tắt những gì đã làm và bước tiếp theo) ngay sau khi hoàn thành bất kỳ task nào được giao.
- **[Session Progress](./agent/docs/session_progress.md):** Bắt buộc tự động cập nhật (Backlog, Milestones, trạng thái hệ thống) nếu task vừa thực hiện làm thay đổi tiến độ tổng quan của dự án.
- **[Session Observations](./agent/docs/session_observations.md)**: Bắt buộc tự động cập nhật các quan sát, bug, suggestion, improvement, etc không thuộc phạm vi của task lần này.
- **[Feature Request](./agent/docs/feature_request.json)**: Bắt buộc tự động cập nhật các feature request cần được implement mà task yêu cầu.

- Task sẽ có 2 loại là task khám khá (tức khám phá codebase, lên kế hoạch) và task thực thi (chỉnh sửa chi tiết, lập kế hoạch chỉnh sửa). Hoàn thành task tức là task thuộc một trong 2 loại trên hoàn thành.