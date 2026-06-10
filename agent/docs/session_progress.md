# Session Progress

## Cập nhật 10/06/2026 - Frontend Chat UI Phase 3
- **Hoàn thành responsive chat navigation phase 3:** `Home.jsx` đã tách mobile view state `list`/`thread`/`info`, desktop vẫn giữ layout multi-column. Mobile back quay về list, info mở panel full-screen và đóng về thread.
- **Trạng thái kiểm tra:** `npm run build` pass; `npm run test:run` pass 24/24. Cả hai lệnh cần chạy ngoài sandbox vì sandbox chặn spawn `esbuild` với `EPERM`.
- **Backlog sau phase này:** tiếp tục `frontend-chat-ui-polish-roadmap` Phase 4: header actions và info panel, ưu tiên ConversationInfo hiển thị media/file thật từ messages.

## Cập nhật 10/06/2026 - Frontend Chat UI Phase 2
- **Hoàn thành message experience phase 2:** `MessageList` đã có auto-scroll có kiểm soát, date divider, grouping message cùng sender; `MessageBubble` hiển thị timestamp/status rõ hơn và giảm lặp avatar trong cụm; `MessageInput` có textarea auto-grow.
- **Trạng thái kiểm tra:** `npm run build` pass; `npm run test:run` pass 24/24. Cả hai lệnh cần chạy ngoài sandbox vì sandbox chặn spawn `esbuild` với `EPERM`.
- **Backlog sau phase này:** tiếp tục `frontend-chat-ui-polish-roadmap` Phase 3: responsive chat navigation cho mobile với view state `list`/`thread`/`info`.

## Cập nhật 10/06/2026
- **Hoàn thành UI primitives frontend phase 1:** Đã tạo `frontend/src/components/ui` với `cn`, `Avatar`, `IconButton`, `SearchInput`, `Badge`, `EmptyState`, `Skeleton`; áp dụng vào các chat components để chuẩn hóa avatar, search, unread badge, icon buttons, empty/loading states và dọn debug logs trong chat/realtime runtime.
- **Trạng thái kiểm tra:** `npm run build` pass; `npm run test:run` pass 24/24. Cả hai lệnh cần chạy ngoài sandbox vì sandbox chặn spawn `esbuild` với `EPERM`.
- **Backlog sau phase này:** `frontend-design-system-primitives-phase-1` đã hoàn tất; bước tiếp theo phù hợp là `frontend-chat-ui-polish-roadmap` Phase 2: auto-scroll, date divider, grouping message, timestamp/status và textarea auto-grow.

*File này ghi nhận tiến độ tổng quan của toàn bộ dự án từ góc nhìn của Agent, nhằm duy trì bối cảnh (context) dài hạn.*

## Trạng thái dự án
- **Giai đoạn hiện tại:** Tối ưu hóa và sửa các lỗi cốt lõi. Chuẩn bị cho việc cải thiện UI/UX.
- **Backend:** 
  - **Công nghệ:** Node.js (Express.js), MongoDB (Mongoose), Socket.io.
  - **Testing:** Native Node.js Test Runner (`node --test`), C8 (Coverage).
  - **Tiến độ:** Đã thiết lập cấu trúc cơ sở dữ liệu, API, tính năng đính kèm tệp tin (sắp chuyển sang Cloudinary) và các script hỗ trợ (seed, reset DB), test case đã được viết cho nhiều modules.
- **Frontend:** 
  - **Công nghệ:** React 19, Vite, Tailwind CSS (v4), Socket.io-client.
  - **Testing:** Vitest, React Testing Library.
  - **Tiến độ:** Đang hoàn thiện giao diện. Khung sườn chat đã có các luồng chính: inbox, tìm user để mở hội thoại, realtime message, gửi text/ảnh/tệp, preview/download attachment, gọi audio/video và panel thông tin. Còn cần polish UI/UX, responsive mobile, empty/loading states, search trong hội thoại, emoji và attachment/media panel thật.

-  **Đã hoàn thành**:
   - Thiết lập module upload file sử dụng Adapter Pattern để dễ chuyển đổi dịch vụ lưu trữ.
  - Triển khai thành công Cloudinary Adapter cho upload hình ảnh/tệp tin.
  - Cấu hình thành công biến môi trường trong Docker cho Frontend/Backend và kiểm thử luồng upload đầu cuối hoàn tất.
  - Hoàn thiện UI Upload File và UI hiển thị Tệp đính kèm/Ảnh trong `MessageBubble` (tích hợp nút Download, Fixed Size).
  - Chỉnh sửa xong cấu trúc Flexbox tránh vỡ Layout khi đính kèm file to ở Frontend.
  - Xây dựng thành công hệ thống Xem trước ảnh (Lightbox) hiển thị toàn màn hình, sử dụng Inline Styles và tinh chỉnh màu sắc icon để đạt trải nghiệm tốt nhất.
  - Khắc phục hoàn toàn cơ chế download tệp tin từ Cloudinary và cải thiện bộ nhận diện icon cho đa dạng loại tệp.
  - Cấu hình bảo mật Cloudinary để cho phép phân phối các định dạng tài liệu đặc biệt (PDF/ZIP).
  - **Khắc phục lỗi real-time:** Sửa lỗi nghiêm trọng khi cuộc trò chuyện mới không được tự động cập nhật trong danh sách chat của người nhận. Đã tái cấu trúc luồng sự kiện `new_message` ở cả backend và frontend để đảm bảo cập nhật tức thì.
  - **Hoàn thiện Account/Profile phase đầu:** Chuẩn hóa backend settings contract sang `allowStrangerMessage`, bổ sung `readReceiptEnabled`, thêm route `/profile`, nối nút "Tài khoản", hoàn thiện trang hồ sơ/chỉnh sửa settings/đổi mật khẩu và chuẩn hóa frontend `deviceId` dùng `getDeviceId()`.
  - **Gia cố `users.settings` phase đầu:** Tạo contract chung cho settings keys, chặn legacy `allowStrangerMessages`, thêm integration test persist boolean settings, cập nhật Mongo init nested strict schema, thêm migration/collMod script cho dữ liệu legacy, sửa route order bạn bè trong users và dọn profile integration helper stale contract.
  - **Khám phá UI chat frontend:** Đã map UI/chức năng hiện có và lập kế hoạch cải thiện theo phase trong `docs/frontend_chat_ui_map_and_plan.md`.
  - **Lập kế hoạch design system frontend:** Đã ghi kế hoạch tạo UI primitives dùng chung trong `docs/frontend_design_system_plan.md`, làm nền cho phase polish chat UI.


## Các vấn đề tồn đọng (Backlog)
- **Ưu tiên gần nhất (Account/Profile):**
  - Phase đầu đã hoàn tất. Nếu phát triển tiếp Profile, ưu tiên tab Thiết bị/quản lý phiên đăng nhập dựa trên `/api/devices/me`.
  - Trước khi mở rộng Settings UI, phần `users.settings` của task `backend-settings-contract-hardening` đã hoàn tất trong scope users. `system_settings` và devices helper đã tách thành task riêng theo module tương ứng.
  - Nếu database đã từng ghi field sai `settings.allowStrangerMessages`, cần chạy migration `backend/database/mongo/migrations/2026-06-10-harden-user-settings-schema.js` trước hoặc cùng lúc bật validator strict cho DB thật.
- **DB schema hardening:**
  - Mở rộng sau settings bằng task `backend-db-schema-contract-hardening-roadmap`: lập schema matrix cho toàn bộ collections, đối chiếu Mongoose model với MongoDB `$jsonSchema`, validators/services, docs và integration tests.
  - `system_settings` thuộc module admin, đã được tách khỏi phạm vi `users.settings`; nếu làm tiếp cần mở task riêng cho admin settings registry/type contract.
  - Ưu tiên theo thứ tự nhỏ an toàn: `users.settings`/`system_settings` -> `refresh_tokens`/`user_devices` -> conversations/messages -> admin/support collections.
  - Không bật `additionalProperties: false` hàng loạt trước khi audit dữ liệu hiện có và migration field legacy.
- **Lỗi UI/UX (Bugs):**
  - Tailwind class cho các pattern UI lặp lại như avatar, icon button, search input, unread badge đang rải rác ở từng component; cần tạo UI primitives dùng chung để giảm bất định thiết kế.
  - Load trang chậm khi đăng nhập do bị block chờ dữ liệu (Cần nâng cấp thành Skeleton loading).
  - Chat UI chưa tối ưu mobile: cần state rõ cho list/thread/info thay vì nén/ẩn các cột bằng width transition.
  - Thread chính chưa có auto-scroll, date divider, grouping message; các empty/loading states còn đơn giản.
  - Còn debug logs trong luồng chat/realtime frontend (`Home.jsx`, `MessageList.jsx`, `useSocket.js`).
- **Tính năng cần phát triển (Missing Features):**
  - Hoàn thiện API và logic Socket cho tính năng Thu hồi tin nhắn (Soft Delete).
  - Chức năng trong Khung Chat: tìm kiếm trong hội thoại, menu mở rộng, typing indicator trong luồng chính.
  - Chức năng ở Thanh điều hướng (Sidebar): xem thông báo, cài đặt.
  - Chức năng gửi tin: gửi Emoji hoặc tối thiểu emoji picker/panel nhỏ.
  - Conversation info: hiển thị media/file thật từ messages thay vì placeholder "Trống".
  - Chức năng lọc danh sách Chat: tab/bộ lọc như "Ưu tiên" và "Khác" nếu sản phẩm cần.

## Thành tựu chính (Milestones)
- Đã quy chuẩn hóa luật chạy multi-task/luồng tác vụ cho Agent.
- Đã thiết lập cơ chế Tracking Session để lưu ngữ cảnh làm việc liên tục.
- Hoàn thiện hệ thống hướng dẫn Agent (GEMINI.md) phân cấp theo Frontend, Backend và Root; bao gồm quy tắc tự động cập nhật tiến độ (Auto-update Session).
- Hoàn thiện cơ chế Upload File: Chuyển đổi thành công sang Cloudinary Storage để lưu trữ hình ảnh/tệp tin, sẵn sàng cho việc deploy lên mạng (Render).
- **Hoàn thiện luồng giao tiếp real-time cho việc tạo cuộc trò chuyện mới.**
