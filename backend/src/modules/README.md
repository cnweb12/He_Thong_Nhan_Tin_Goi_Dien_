# Modules Layer

Each domain area should own its own `models`, `services`, and later `controllers`, `dto`, `validators`, or `repositories` if needed.

Current direction:

- `auth`
- `users`
- `devices`
- `conversations`
- `messages`
- `calls`

Keep cross-collection business flows in services, not in Mongoose hooks.

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
