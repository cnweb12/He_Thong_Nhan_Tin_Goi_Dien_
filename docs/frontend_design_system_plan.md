# Frontend Design System Plan

Ngày lập kế hoạch: 10/06/2026

## Bối Cảnh

Frontend hiện dùng React, Tailwind CSS, Lucide React, `clsx` và `tailwind-merge`. Tailwind giúp tạo CSS output tối ưu, nhưng hiện quyết định thiết kế vẫn đang nằm rải rác trong từng component qua các chuỗi `className` thủ công.

Ví dụ cùng một khái niệm như avatar đang được viết lại ở nhiều nơi với kích thước, bo góc, fallback và trạng thái online khác nhau. Điều này gây bất định khi chỉnh UI sau này: sửa một nơi không đảm bảo các nơi khác đồng bộ.

## Mục Tiêu

Tạo một lớp UI primitives nhỏ, dùng chung trong frontend, bắt đầu từ giao diện chat. Tailwind vẫn là vật liệu styling chính, nhưng các quyết định thiết kế lặp lại sẽ được gom vào component và variant rõ ràng.

Mục tiêu phase đầu:

- Giảm class Tailwind thủ công lặp lại trong các component chat.
- Chuẩn hóa avatar, icon button, search input, badge, empty state và skeleton.
- Giữ hành vi hiện tại của app, không đổi API/socket/upload/call.
- Làm nền cho các phase UI/UX tiếp theo như responsive mobile, message grouping, media panel.

## Thư Mục Và File Cần Tạo

Tạo thư mục:

```txt
frontend/src/components/ui/
```

Các file phase đầu:

```txt
frontend/src/components/ui/cn.js
frontend/src/components/ui/Avatar.jsx
frontend/src/components/ui/IconButton.jsx
frontend/src/components/ui/SearchInput.jsx
frontend/src/components/ui/Badge.jsx
frontend/src/components/ui/EmptyState.jsx
frontend/src/components/ui/Skeleton.jsx
frontend/src/components/ui/index.js
```

## Vai Trò Từng Primitive

### `cn.js`

Helper gộp class bằng `clsx` và `tailwind-merge`.

Mục tiêu:

- Tránh nối class thủ công.
- Cho phép component nhận `className` override có kiểm soát.
- Giảm xung đột Tailwind như `h-8 h-10`, `bg-white bg-slate-50`.

### `Avatar.jsx`

Chuẩn hóa avatar toàn app.

Props dự kiến:

- `src`
- `name`
- `size`: `xs`, `sm`, `md`, `lg`, `xl`
- `shape`: `circle`, `rounded`
- `status`: `online`, `offline`, `busy`, `none`
- `alt`
- `className`

Quy ước size ban đầu:

- `xs`: 24px, dùng cho compact/meta.
- `sm`: 32px, dùng trong message bubble hoặc search result nhỏ.
- `md`: 40px, dùng trong chat item/header phụ.
- `lg`: 56px, dùng trong profile/info panel.
- `xl`: 64px, dùng trong conversation info/profile lớn.

Yêu cầu:

- Có fallback initials khi không có `src`.
- Online dot nằm trong component, không viết lại ở từng nơi.
- Không hardcode dịch vụ avatar fallback ở mọi component; nếu vẫn dùng `ui-avatars`, chỉ xử lý trong `Avatar`.

### `IconButton.jsx`

Chuẩn hóa nút icon.

Props dự kiến:

- `icon`: component Lucide.
- `label`: dùng cho `aria-label` và `title`.
- `size`: `sm`, `md`, `lg`
- `tone`: `neutral`, `primary`, `success`, `danger`, `ghost`
- `active`
- `disabled`
- `className`

Yêu cầu:

- Các button icon trong `ChatHeader`, `MessageInput`, `SidebarLeft` không tự copy class.
- Có trạng thái hover/focus/disabled nhất quán.
- Luôn có accessible label.

### `SearchInput.jsx`

Thay `SearchBar` hiện tại.

Props dự kiến:

- `value`
- `onChange`
- `placeholder`
- `disabled`
- `className`

Yêu cầu:

- Dùng icon `Search` từ Lucide thay vì emoji.
- Component tự quản phần icon/input, parent chỉ quản spacing ngoài.
- Không còn padding lồng giữa parent và `SearchBar`.

### `Badge.jsx`

Dùng cho unread count, status nhỏ, label nhỏ.

Props dự kiến:

- `children`
- `tone`: `primary`, `neutral`, `success`, `warning`, `danger`
- `size`: `sm`, `md`
- `pill`
- `className`

Yêu cầu:

- `ChatItem` dùng `Badge` cho unread count.
- Có thể tái dùng cho trạng thái hoặc label trong các panel sau.

### `EmptyState.jsx`

Chuẩn hóa trạng thái rỗng.

Props dự kiến:

- `icon`
- `title`
- `description`
- `action`
- `compact`
- `className`

Ứng dụng ban đầu:

- Chưa chọn hội thoại.
- Inbox rỗng.
- Thread chưa có tin nhắn.
- Search không có kết quả.
- Conversation info chưa có tệp.

### `Skeleton.jsx`

Loading placeholder cơ bản.

Component dự kiến:

- `Skeleton`
- `SkeletonText`
- `ChatItemSkeleton`
- `MessageBubbleSkeleton`

Yêu cầu:

- Không cần animation phức tạp.
- Đủ để thay các dòng text "Đang tải..." ở khu vực chat list/thread.

### `index.js`

Export tập trung:

```js
export { Avatar } from './Avatar';
export { IconButton } from './IconButton';
export { SearchInput } from './SearchInput';
export { Badge } from './Badge';
export { EmptyState } from './EmptyState';
export { Skeleton, ChatItemSkeleton, MessageBubbleSkeleton } from './Skeleton';
export { cn } from './cn';
```

## Phạm Vi Chỉnh Sửa Phase 1

Chỉ chỉnh frontend chat và các component shell liên quan trực tiếp.

File ưu tiên chỉnh:

```txt
frontend/src/features/chats/components/ChatSidebar.jsx
frontend/src/features/chats/components/ChatItem.jsx
frontend/src/features/chats/components/SearchBar.jsx
frontend/src/features/chats/components/ChatHeader.jsx
frontend/src/features/chats/components/MessageList.jsx
frontend/src/features/chats/components/MessageBubble.jsx
frontend/src/features/chats/components/MessageInput.jsx
frontend/src/features/chats/components/ConversationInfo.jsx
frontend/src/components/SidebarLeft.jsx
```

## Kế Hoạch Thay Thế Theo File

### `ChatSidebar.jsx`

- Dùng `Avatar` cho user hiện tại.
- Dùng `Avatar` cho search results.
- Thay `SearchBar` bằng `SearchInput`.
- Thêm `EmptyState` khi không có conversation.
- Xóa padding lồng quanh search.

### `ChatItem.jsx`

- Dùng `Avatar size="md"`.
- Dùng `Badge` cho unread count.
- Chuẩn hóa active/hover style.
- Giữ nguyên logic chọn conversation.

### `SearchBar.jsx`

- Có thể thay bằng wrapper gọi `SearchInput` để giảm rủi ro import.
- Hoặc loại bỏ sau khi tất cả nơi dùng đã chuyển sang `SearchInput`.

### `ChatHeader.jsx`

- Dùng `Avatar`.
- Dùng `IconButton` cho back, phone, video, info.
- Bỏ import chưa dùng nếu chưa triển khai search/menu.

### `MessageList.jsx`

- Dùng `EmptyState` cho thread rỗng.
- Dùng skeleton cho loading.
- Dọn `console.log`.

### `MessageBubble.jsx`

- Phase đầu không refactor sâu attachment logic.
- Có thể dùng `IconButton` cho lightbox download/close nếu không làm tăng rủi ro.
- Giữ nguyên upload/download/preview behavior.

### `MessageInput.jsx`

- Dùng `IconButton` cho emoji, attach, send.
- Nếu emoji chưa có chức năng, đặt disabled hoặc title rõ.
- Bỏ import chưa dùng.
- Chưa bắt buộc auto-grow trong phase design primitives; auto-grow thuộc phase message experience.

### `ConversationInfo.jsx`

- Dùng `Avatar`.
- Dùng `EmptyState` cho attachment placeholder.
- Chưa bắt buộc extract media thật trong phase design primitives.

### `SidebarLeft.jsx`

- Có thể dùng `IconButton` cho các nút phụ.
- Với nav button có active state đặc thù, chỉ refactor nếu không làm rối logic hiện tại.

## Giới Hạn

Không làm trong phase đầu:

- Không đổi API backend.
- Không đổi socket events.
- Không đổi luồng upload file.
- Không đổi luồng gọi audio/video.
- Không thêm shadcn/ui, Radix UI hoặc thư viện UI mới.
- Không làm dark mode.
- Không redesign toàn bộ app.
- Không refactor sâu `Home.jsx` realtime/message orchestration.
- Không đụng `ThreadView.jsx` ngoài việc ghi nhận ý tưởng có thể tái dùng sau.

## Quy Tắc Thiết Kế

- Tailwind vẫn được dùng trong component UI primitive.
- Component feature không nên tự định nghĩa lại các pattern đã có primitive.
- Variant chỉ nên tạo khi có ít nhất 2 nơi dùng hoặc có nhu cầu thiết kế rõ.
- `className` override được phép, nhưng không dùng để phá vỡ contract chính của component.
- Không tạo component quá tổng quát. Ưu tiên primitive nhỏ, rõ vai trò.

## Thứ Tự Triển Khai Đề Xuất

1. Tạo `cn.js`, `Avatar`, `IconButton`, `Badge`.
2. Thay `Avatar`, `IconButton`, `Badge` trong `ChatItem`, `ChatHeader`, `ChatSidebar`.
3. Tạo `SearchInput`, thay `SearchBar`.
4. Tạo `EmptyState`, `Skeleton`, áp dụng vào `MessageList` và inbox.
5. Dọn import/log thừa trong các file chat được chạm tới.
6. Chạy kiểm tra frontend.

## Kiểm Tra Và Definition Of Done

Lệnh kiểm tra:

```bash
npm run build
npm run test:run
```

Chạy trong thư mục:

```txt
frontend/
```

Tiêu chí hoàn thành phase đầu:

- Avatar trong `ChatSidebar`, `ChatItem`, `ChatHeader`, `ConversationInfo` dùng component chung.
- Icon button trong chat header/input dùng component chung hoặc có lý do rõ nếu giữ nguyên.
- Search input không còn padding lồng và không dùng emoji icon.
- Unread badge dùng component chung.
- Empty/loading states trong inbox/thread nhất quán hơn.
- Không thay đổi hành vi gửi tin, nhận tin, upload file, preview/download file, gọi điện.
- Frontend build/test pass.

## Quan Hệ Với Kế Hoạch Chat UI

Tài liệu này là nền cho Phase 1 trong `docs/frontend_chat_ui_map_and_plan.md`. Sau khi phase design primitives hoàn tất, các phase tiếp theo của chat UI sẽ dễ làm hơn:

- Message experience: auto-scroll, date divider, grouping, timestamp/status.
- Responsive navigation: mobile list/thread/info.
- Conversation info: media/file thật.
- Interaction: typing indicator, emoji picker, micro-interactions.

