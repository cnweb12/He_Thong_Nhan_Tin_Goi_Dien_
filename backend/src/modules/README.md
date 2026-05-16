# Lớp Modules (Modules Layer)

Mỗi một lĩnh vực nghiệp vụ (domain) nên sở hữu các `models`, `services`, và sau này có thể là `controllers`, `dto`, `validators`, hoặc `repositories` nếu cần.

Định hướng hiện tại:

- `auth`
- `users`
- `devices`
- `conversations`
- `messages`
- `calls`

Nên giữ các luồng xử lý nghiệp vụ liên quan đến nhiều collection trong services, không nên đặt trong Mongoose hooks.

## Module status hien tai

- `auth`
  Co route, controller, validator, service
- `users`
  Co route, controller, validator, service, test
- `messages`
  Co route, controller, validator, service, test
- `conversations`
  Co route, controller, validator, service, test
- `devices`
  Co route, controller, validator, service, test
- `calls`
  Co route, controller, validator, service, test

## Quan he can nho

- `auth` -> `users`, `devices`
- `messages` -> `conversations`
- `conversations` -> `conversation_members`, `user_conversation_inbox`
- `calls` -> `conversations`

Neu muon hieu nhanh he thong chat, hay doc theo thu tu:

1. `auth`
2. `users`
3. `conversations`
4. `messages`
5. `calls`
