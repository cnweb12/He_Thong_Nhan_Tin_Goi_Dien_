# Frontend Coding Conventions

## 1. Đặt tên (Naming)
- **Components:** Sử dụng `PascalCase` (VD: `ChatBubble.jsx`, `SidebarLeft.jsx`). Tên file trùng với tên Component.
- **Hooks/Functions/Variables:** Sử dụng `camelCase` (VD: `useAuth`, `fetchMessages`, `userData`).
- **Constants:** Sử dụng `UPPER_SNAKE_CASE` (VD: `API_BASE_URL`).

## 2. React Best Practices
- Ưu tiên sử dụng Functional Components và Hooks.
- Tránh lạm dụng `useEffect`, ưu tiên derived state hoặc xử lý logic trực tiếp ở event handlers.
- Phân tách logic (custom hooks) và UI (components) rõ ràng.

## 3. Styling (Tailwind CSS)
- Tuyệt đối hạn chế sử dụng inline style (`style={{...}}`), trừ trường hợp cần tính toán giá trị động.
- Sử dụng `clsx` và `tailwind-merge` (`twMerge`) để nối class động một cách an toàn, tránh xung đột CSS.

## 4. Tiêu chuẩn Hoàn thành (Definition of Done - DoD)
Một task Frontend **chỉ được xem là hoàn thành** khi thỏa mãn các tiêu chí sau:
- **UI/UX & Responsive:** Giao diện hiển thị đúng thiết kế, không vỡ layout trên Mobile/Tablet/Desktop.
- **Trạng thái UI (UI States):** Xử lý đầy đủ các trạng thái `Loading`, `Success`, `Error`, `Empty` và `Hover/Disabled`.
- **Logic & Tích hợp:** Gọi đúng API/Socket, bắt lỗi và hiển thị thông báo thân thiện cho user (Toast/Alert) thay vì chỉ log console.
- **Code Quality:** Không có lỗi linter (đặc biệt là warning `useEffect`), không có `console.log` thừa.
- **Testing:** Các component/logic quan trọng phải pass Unit/UI Test (`Vitest` + `React Testing Library`).
- **Context Sync:** Đã tự động cập nhật tiến độ vào file `session_summary.md` (và `session_progress.md` nếu có thay đổi Backlog).
