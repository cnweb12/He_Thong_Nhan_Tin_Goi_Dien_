# Auth Module

Owns authentication-specific persistence, business logic, and API endpoints.

## Module Structure

### Models (`models/`)
- `refresh-token.model.js` - Refresh token schema with TTL index support

### Services (`services/`)
- `auth.service.js` - Core authentication business logic:
  - `createRefreshToken()` - Create new refresh token
  - `findRefreshToken()` - Find active token by user and device
  - `findUserRefreshTokens()` - Get all active tokens for a user
  - `verifyRefreshToken()` - Verify token validity and hash
  - `revokeRefreshToken()` - Revoke single token
  - `revokeAllUserRefreshTokens()` - Logout from all devices
  - `revokeOtherDeviceTokens()` - Logout from other devices
  - `deleteExpiredTokens()` - Clean up expired tokens

### Middleware (`middleware/`)
- `auth.middleware.js` - JWT and token utilities:
  - `generateJWTToken()` - Create JWT access token
  - `verifyJWTToken()` - Validate JWT signature and expiration
  - `hashToken()` - SHA256 token hashing
  - `generateToken()` - Generate random tokens
  - `extractTokenFromHeader()` - Parse Authorization header
  - `authenticateJWT()` - Express middleware for protected routes

### Validators (`validators/`)
- `auth.validator.js` - Request validation:
  - `validateRegisterRequest()` - Register form validation
  - `validateLoginRequest()` - Login form validation
  - `validateRefreshTokenRequest()` - Token refresh validation
  - `validateUpdateProfileRequest()` - Profile update validation

### Controllers (`controllers/`)
- `auth.controller.js` - Request handlers:
  - `register()` - Create new user account
  - `login()` - Authenticate user and issue tokens
  - `refreshAccessToken()` - Issue new access token
  - `logout()` - Revoke single device session
  - `logoutAll()` - Revoke all sessions
  - `getProfile()` - Get current user info
  - `updateProfile()` - Update user profile
  - `changePassword()` - Change user password

### Routes (`routes/`)
- `auth.routes.js` - Auth API endpoints

## API Endpoints

### Public Routes

**POST /auth/register**
```json
{
  "phone": "0901234567",
  "displayName": "John Doe",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

**POST /auth/login**
```json
{
  "phone": "0901234567",
  "password": "password123",
  "deviceId": "device-uuid",
  "platform": "web"
}
```

**POST /auth/refresh**
```json
{
  "refreshToken": "token-string",
  "deviceId": "device-uuid"
}
```

### Protected Routes (require Authorization header with JWT)

**GET /auth/me**
- Get current user profile

**PATCH /auth/profile**
```json
{
  "displayName": "Jane Doe",
  "avatarUrl": "https://..."
}
```

**POST /auth/change-password**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password",
  "confirmPassword": "new-password"
}
```

**POST /auth/logout**
```json
{
  "deviceId": "device-uuid"
}
```

**POST /auth/logout-all**
- Logout from all devices (no body required)

## Token Management

- **Access Token**: JWT, 1 hour expiration, includes `userId` and `phone`
- **Refresh Token**: Raw token, 7 days expiration, hashed in database
- Device tracking: Each login creates/updates a device record
- Multi-device support: Users can have multiple active sessions

## Environment Variables

- `JWT_SECRET` - Secret key for JWT signing
- `REFRESH_TOKEN_SECRET` - Secret for refresh tokens (currently unused, using raw tokens)
- `NODE_ENV` - Environment (production hides error details)
