# Frontend Chat UI Map And Improvement Plan

Ngày khảo sát: 10/06/2026

## Phạm vi

Tài liệu này map riêng giao diện chat hiện có trong frontend và lập kế hoạch cải thiện UI/UX theo từng lát cắt nhỏ. Đây là task khám phá, chưa thay đổi runtime UI.

## Entry Points

- `frontend/src/App.jsx`: bọc app bằng `SocketProvider`, `TwilioProvider`, `ConversationProvider`; route `/` render `Home`.
- `frontend/src/pages/Home.jsx`: layout chính 3 cột và orchestration chat:
  - `SidebarLeft`: thanh điều hướng trái.
  - `ChatSidebar`: danh sách hội thoại và tìm người dùng.
  - `ChatArea`: header, message list, input.
  - `ConversationInfo`: panel thông tin bên phải.
- `frontend/src/features/chats/components/*`: bộ component UI chat đang dùng thực tế.
- `frontend/src/features/messages/ThreadView.jsx`: component thread cũ/có test typing indicator, nhưng không thấy được dùng trong route chính hiện tại.

## UI Map Hiện Có

### Shell Và Navigation

- `SidebarLeft.jsx`
  - Có nút toggle đóng/mở danh sách chat.
  - Có nút tài khoản điều hướng `/profile`.
  - Có các mục `chat`, `contacts`, `cloud`, `task`; ngoài chat, `Home.jsx` hiển thị placeholder.
  - Có nút thông báo và cài đặt, hiện chưa gắn luồng chức năng.

### Inbox / Chat List

- `ChatSidebar.jsx`
  - Header hiển thị user hiện tại: avatar, display name, phone/online.
  - Search user debounce 250ms qua `searchUsersApi`, kết quả cho phép mở direct conversation.
  - Danh sách conversation render bằng `ChatItem`.
  - Chưa có empty state riêng cho inbox rỗng.
  - Chưa có skeleton khi search/loading danh sách, ngoài text đơn giản.
- `ChatItem.jsx`
  - Hiển thị avatar, title, last message, time, unread badge.
  - Active state và hover state đã có.
  - Avatar đang dùng `w-5 h-5`, hơi nhỏ cho item hội thoại.

### Chat Thread

- `ChatArea.jsx`
  - Kết hợp `ChatHeader`, `MessageList`, `MessageInput`.
  - Có loading/error props cho thread.
- `ChatHeader.jsx`
  - Hiển thị avatar, title, trạng thái "Đang hoạt động".
  - Có back button trên mobile (`sm:hidden`).
  - Có nút gọi thoại, gọi video qua `useCall()`.
  - Có nút mở `ConversationInfo`.
  - Import `Search`, `MoreVertical` nhưng chưa dùng; chưa có search trong hội thoại/menu mở rộng.
- `MessageList.jsx`
  - Loading/error/empty state đơn giản.
  - Render bubble qua `MessageBubble`.
  - Chưa có auto-scroll trong luồng chính `Home`/`MessageList`.
  - Còn `console.log` debug.
- `MessageBubble.jsx`
  - Phân biệt tin của tôi và người khác.
  - Hỗ trợ text, ảnh, file attachment.
  - Ảnh có lightbox bằng portal, có nút download/close.
  - File có icon theo extension và tải blob.
  - Có status icon `sending`, `sent`, `error`, nhưng chưa hiển thị time/read receipt rõ ràng cạnh bubble.
- `MessageInput.jsx`
  - Gửi bằng Enter, Shift+Enter xuống dòng.
  - Hỗ trợ chọn một file, preview ảnh/file, gửi text kèm file.
  - Nút emoji hiện chỉ là nút rỗng.
  - Textarea `rows=1` chưa auto-grow theo nội dung.
  - Import `ImageIcon` nhưng chưa dùng.

### Conversation Info

- `ConversationInfo.jsx`
  - Hiển thị avatar/title/subtitle.
  - Có thống kê tổng tin nhắn, tin của tôi, chưa đọc.
  - Khu vực tệp đính kèm đang là placeholder "Trống", chưa derive từ messages.

### State Và Data Flow

- `Home.jsx`
  - Bootstrap `fetchCurrentUser()` và `fetchInbox()`.
  - Join socket room cho toàn bộ conversation trong inbox.
  - Load 50 messages khi chọn conversation.
  - Mark read theo `lastSeenSeq`.
  - Nhận `new_message`, append/replace optimistic message, update conversation top/unread.
  - Gửi message optimistic, upload file nếu attachment có `file`, rồi replace bằng message thật.
  - Có banner khi realtime lỗi.
  - Còn nhiều `console.log`/`console.warn` debug trong production path.

## Vấn Đề UI/UX Ưu Tiên

1. Visual hierarchy chưa đều:
   - Avatar inbox quá nhỏ.
   - Padding search bị lồng hai lớp.
   - Nhiều radius lớn không nhất quán giữa sidebar, card, bubble.
2. Chat thread thiếu cảm giác app nhắn tin hoàn chỉnh:
   - Không auto-scroll trong component đang dùng chính.
   - Không có date divider.
   - Bubble chưa hiển thị timestamp/status theo cách dễ đọc.
   - Empty/loading states còn chữ thuần, chưa có skeleton hoặc illustration tối giản.
3. Responsive chưa hoàn chỉnh:
   - Layout vẫn ưu tiên desktop 3 cột.
   - Mobile cần state machine rõ: list -> thread -> info, tránh cột bị nén/ẩn bằng width transition khó kiểm soát.
4. Một số affordance gây kỳ vọng sai:
   - Emoji, thông báo, cài đặt chưa có hành vi.
   - Search/menu trong header được import nhưng chưa render hoặc chưa triển khai.
5. Conversation info chưa hữu ích:
   - Attachment grid placeholder, chưa lấy ảnh/file thật từ `messages`.
6. Chất lượng hoàn thiện:
   - Debug logs còn trong `Home.jsx`, `MessageList.jsx`, `useSocket.js`.
   - `ThreadView.jsx` có typing indicator và auto-scroll nhưng không nằm trong luồng route chính, tạo nguy cơ song song hai UI chat.

## Kế Hoạch Cải Thiện Chat UI

Nền tảng cho Phase 1 là kế hoạch design system nhỏ tại `docs/frontend_design_system_plan.md`. Mục tiêu là tạo các UI primitives như `Avatar`, `IconButton`, `SearchInput`, `Badge`, `EmptyState` và `Skeleton` trước khi polish từng component chat, để tránh tiếp tục viết Tailwind thủ công lặp lại.

### Phase 1: Polish Layout Và States Cơ Bản

- Tạo lớp UI primitives dùng chung theo `docs/frontend_design_system_plan.md`.
- Chuẩn hóa kích thước avatar:
  - User header/sidebar: 36-40px.
  - Chat item: 40-44px.
  - Message sender avatar: 28-32px.
- Sửa spacing search: bỏ padding lồng hoặc để `SearchBar` chỉ chịu trách nhiệm input.
- Nâng cấp empty/loading/error:
  - Inbox empty state.
  - Thread empty state.
  - Skeleton rows cho inbox và skeleton bubbles cho thread.
- Dọn debug logs trong các component chat runtime.
- Test/build: `npm run build`, `npm run test:run`.

### Phase 2: Message Experience

- Thêm auto-scroll trong `MessageList` bằng `ref`, chỉ auto-scroll khi người dùng đang gần cuối.
- Thêm date divider theo ngày và nhóm message liên tiếp cùng sender.
- Hiển thị timestamp/status gọn dưới hoặc cạnh bubble:
  - sending, sent, error hiện có icon; bổ sung label/tooltip hoặc màu trạng thái rõ hơn.
  - Chuẩn bị chỗ cho delivered/read nếu backend hỗ trợ.
- Textarea auto-grow tới `max-h-28`, giữ layout input ổn định.

### Phase 3: Responsive Chat Navigation

- Chuyển `Home` sang layout state rõ cho mobile:
  - Desktop: nav + list + thread + optional info.
  - Mobile: chỉ hiển thị một view tại một thời điểm (`list`, `thread`, `info`).
- Back button trong `ChatHeader` quay về list trên mobile; info panel trở thành full-screen drawer/sheet.
- Kiểm tra các breakpoint mobile/tablet/desktop.

### Phase 4: Header Và Info Panel

- Triển khai search trong hội thoại hoặc ẩn icon/import chưa dùng đến khi có feature.
- Thêm menu mở rộng nếu có hành động thật: mute, clear, block, view media; nếu chưa có backend, dùng disabled/tooltip "Đang phát triển".
- ConversationInfo:
  - Extract ảnh/file từ `messages.attachments`.
  - Grid ảnh gần đây, list file gần đây, empty state thật.
  - Thống kê dùng `unreadCount || unread`.

### Phase 5: Interaction Nice-To-Have

- Typing indicator: tái sử dụng ý tưởng từ `ThreadView.jsx`, nhưng tích hợp vào luồng chính `Home`/`MessageList` nếu backend socket đã hỗ trợ.
- Emoji picker: tối thiểu insert emoji nhanh hoặc mở panel nhỏ; nếu chưa làm, nút nên disabled/tooltip.
- Micro-interactions nhẹ: hover/focus rõ, active chat item mượt, new message fade-in bằng CSS transition.

## Đề Xuất Thứ Tự Thực Thi

1. Bắt đầu bằng Phase 1 vì ít rủi ro, tạo khác biệt thị giác ngay, không động sâu vào contract backend.
2. Sau đó làm Phase 2 để cải thiện trải nghiệm đọc/gửi tin nhắn.
3. Phase 3 nên làm trước khi mở rộng các màn ngoài chat, vì layout shell sẽ ảnh hưởng toàn app.
4. Phase 4-5 làm theo mức độ backend/socket đã sẵn sàng.
