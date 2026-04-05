# Users Module

Owns user profile data and user-facing account behaviors.

## Current contents

- `models/user.model.js`
- `services/user.service.js`
- `controllers/user.controller.js`
- `routes/user.routes.js`
- `validators/user.validator.js`

## Implemented behaviors

- Get current authenticated user profile
- Get another user by id
- Search users by display name, username, or phone
- Update profile fields (`username`, `displayName`, `avatarUrl`)
- Update user settings (`theme`, `language`, `allowStrangerMessages`)
