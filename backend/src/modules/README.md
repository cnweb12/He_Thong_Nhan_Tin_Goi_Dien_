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
