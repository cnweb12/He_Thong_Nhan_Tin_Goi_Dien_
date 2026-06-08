# Frontend Testing Guidelines

## 1. Công cụ
- **Test Runner:** `Vitest`.
- **UI Testing:** `@testing-library/react` (RTL) và `@testing-library/user-event`.
- **DOM Environment:** `jsdom`.

## 2. Quy trình & Nguyên tắc
- Luôn khảo sát kỹ component/hook trước khi test.
- Test tập trung vào **hành vi người dùng (user behavior)** thay vì chi tiết triển khai (implementation details).
- Ưu tiên các query của RTL mang tính tiếp cận người dùng như `getByRole`, `getByText`, `getByPlaceholderText`.

## 3. Mocking
- Sử dụng `vi.mock()` để giả lập các phụ thuộc bên ngoài như `Socket.io-client`, API fetch, hoặc các hooks phức tạp không thuộc phạm vi test hiện tại.
