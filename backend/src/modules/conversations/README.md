# Module Conversations

Module `conversations` quan ly metadata cua cuoc tro chuyen, membership cua user trong conversation, va projection inbox theo tung user.

## Vai tro trong he thong

Day la module nen cho tinh nang nhan tin:

- `messages` khong the gui tin nhan neu khong co membership trong conversation
- `user_conversation_inbox` duoc cap nhat moi khi co tin nhan moi
- `conversation_members` duoc dung de tinh unread count va trang thai da doc

## Cau truc hien tai

- `models/conversation.model.js`
  Metadata cua conversation
- `models/conversation-member.model.js`
  Quan he membership giua user va conversation
- `models/user-conversation-inbox.model.js`
  Projection inbox de render danh sach hoi thoai nhanh hon
- `services/conversation.service.js`
  Xu ly cac luong conversation-level
- `controllers/conversation.controller.js`
  Nhan request HTTP va goi service
- `routes/conversation.routes.js`
  Mount API duoi prefix `/conversations`
- `validators/conversation.validator.js`
  Kiem tra body/query/params cho conversation APIs

## API hien co

- `POST /conversations/direct`
  Tao hoac lay direct conversation giua user hien tai va `peerUserId`
- `GET /conversations/inbox`
  Lay inbox cua user dang dang nhap
- `PATCH /conversations/:conversationId/read`
  Danh dau da doc den `lastSeenSeq`

## Chuc nang da co

- Tao direct conversation giua 2 user:
  `createDirectConversation(...)`
- Danh dau da doc:
  `markAsRead(...)`
- Lay danh sach inbox theo user:
  `getInbox(...)`

## Luu y quan trong

- `directKey` la field noi bo, service khong tra ra API
- direct conversation khong cho phep tao voi chinh minh
- `markAsRead` va `messages` deu kiem tra membership active truoc khi thao tac

## Luong chinh lien quan toi messages

Khi gui mot tin nhan:

1. `messages` kiem tra user co membership active trong `conversation_members`
2. tang `lastMessageSeq` trong `conversations`
3. cap nhat `user_conversation_inbox`
4. tang `unreadCount` cho member khac

Khong hieu module nay thi se rat kho hieu `messages`.
