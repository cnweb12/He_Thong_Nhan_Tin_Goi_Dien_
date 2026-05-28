# WebSocket Frontend Implementation

## Overview

This document describes the WebSocket implementation for the frontend chat application. The implementation enables real-time messaging, typing indicators, and online/offline status tracking.

## Architecture

### Components

1. **Device ID Utility** (`src/utils/device.js`)
   - Generates and manages a unique device ID for each client
   - Stores the device ID in localStorage for persistence
   - Uses `crypto.randomUUID()` with a fallback for environments that don't support it

2. **useSocket Hook** (`src/features/realtime/hooks/useSocket.js`)
   - Manages WebSocket connection using `socket.io-client`
   - Includes device ID in the auth payload for multi-device support
   - Handles connection, disconnection, and error states
   - Automatically cleans up on unmount

3. **SocketProvider** (`src/features/realtime/context/SocketProvider.jsx`)
   - Provides socket instance and connection state to the application
   - Wraps the application with WebSocket context
   - Uses `useAuth` to get the access token for authentication

4. **ThreadView Component** (`src/features/messages/ThreadView.jsx`)
   - Main chat interface component
   - Joins/leaves chat rooms based on conversation ID
   - Listens for new messages via WebSocket
   - Displays typing indicators with debounce
   - Implements optimistic UI for message sending
   - Auto-scrolls to show new messages

## Implementation Details

### Device ID Management

```javascript
// src/utils/device.js
export function getDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}
```

The device ID is crucial for:
- Tracking online/offline status across multiple devices
- Preventing duplicate connections from the same device
- Enabling proper session management

### WebSocket Connection

```javascript
// src/features/realtime/hooks/useSocket.js
const socketImpl = io(SOCKET_URL, {
  auth: { token, deviceId },
  transports: ['websocket'],
  reconnection: false,
  timeout: 3000,
});
```

Key features:
- Authentication via token and device ID
- WebSocket-only transport for reliability
- No automatic reconnection (handled at application level)
- 3-second connection timeout

### Room Management

```javascript
// Join room when component mounts
useEffect(() => {
  if (socket && isConnected && chat?._id) {
    socket.emit('join_room', { conversationId: chat._id });
  }
  return () => {
    if (socket && chat?._id) {
      socket.emit('leave_room', { conversationId: chat._id });
    }
  };
}, [socket, isConnected, chat?._id]);
```

### Message Handling

```javascript
// Listen for new messages
useEffect(() => {
  if (!socket) return;

  const handleNewMessage = (data) => {
    if (data.conversationId === chat._id) {
      setMessages((prev) => [...prev, data]);
    }
  };

  socket.on('new_message', handleNewMessage);
  return () => socket.off('new_message', handleNewMessage);
}, [socket, chat._id]);
```

### Typing Indicators

```javascript
// Debounced typing indicator
const handleTyping = () => {
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  socket.emit('typing_start', { conversationId: chat._id });

  typingTimeoutRef.current = setTimeout(() => {
    socket.emit('typing_end', { conversationId: chat._id });
  }, 1000);
};

// Listen for typing events
useEffect(() => {
  if (!socket) return;

  const handleTypingStart = (data) => {
    if (data.conversationId === chat._id && data.userId !== currentUserId) {
      setTypingUser(data.userId);
      setTimeout(() => setTypingUser(null), 2000);
    }
  };

  socket.on('typing_start', handleTypingStart);
  return () => socket.off('typing_start', handleTypingStart);
}, [socket, chat._id, currentUserId]);
```

## Testing

### Test Configuration

- **Framework**: Vitest
- **Environment**: jsdom
- **Testing Library**: React Testing Library
- **Setup**: `src/test/setup.js`

### Test Files

1. **Device Utility Tests** (`src/utils/device.test.js`)
   - Tests device ID generation
   - Tests localStorage persistence
   - Tests UUID format validation
   - Tests SSR compatibility

2. **useSocket Hook Tests** (`src/features/realtime/hooks/useSocket.test.js`)
   - Tests socket initialization with token and device ID
   - Tests connection state management
   - Tests disconnection on unmount
   - Tests edge cases (null/undefined token)

3. **ThreadView Component Tests** (`src/features/messages/ThreadView.test.jsx`)
   - Tests chat header rendering
   - Tests join/leave room events
   - Tests message fetching and display
   - Tests typing indicators
   - Tests send button state
   - Tests edge cases (missing chat, missing avatar)

### Running Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

## Environment Variables

Required environment variables for development:

```env
VITE_SOCKET_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:5000
```

These should be set in:
- `.env.development` for local development
- Environment configuration for production builds

## API Client

The API client (`src/services/apiClient.js`) handles HTTP requests for:
- Fetching initial messages
- Sending messages via HTTP (for backup)
- Other API interactions

The client is defensive against missing environment variables:
```javascript
const API_BASE_URL = ((import.meta.env?.VITE_API_BASE_URL ?? '') || '').replace(/\/$/, '');
```

## Best Practices

1. **Always clean up WebSocket listeners** on component unmount to prevent memory leaks
2. **Use debouncing** for typing indicators to avoid excessive events
3. **Validate conversation IDs** before emitting events to prevent cross-contamination
4. **Handle connection states** gracefully in the UI
5. **Mock dependencies** properly in tests to avoid environment variable issues

## Troubleshooting

### Connection Issues

- Check that `VITE_SOCKET_URL` is set correctly
- Verify the backend WebSocket server is running
- Check browser console for connection errors
- Ensure the access token is valid

### Test Failures

- Ensure all environment variables are set in `vite.config.js`
- Check that mocks are properly configured
- Verify that `import.meta.env` is handled defensively in apiClient
- Run tests with `--debug` flag for detailed output

### Typing Indicators Not Working

- Verify the `typing_start` and `typing_end` events are being emitted
- Check that the debounce timeout is appropriate
- Ensure the conversation ID matches between sender and receiver
- Check that the user ID comparison is correct

## Future Enhancements

Potential improvements for the WebSocket implementation:

1. **Reconnection Logic**: Implement exponential backoff for reconnection
2. **Message Queue**: Queue messages when offline and send when reconnected
3. **Read Receipts**: Track and display message read status
4. **Presence Indicators**: Show online/offline status for users
5. **Load More Messages**: Implement pagination for message history
6. **File Upload**: Support sending files via WebSocket
7. **Encryption**: Add end-to-end encryption for sensitive messages

## Related Documentation

- [WebSocket Plan](./websocket_plan.md) - Original implementation plan
- [WebSocket Testing Plan](./websocket_testing_plan.md) - Testing strategy
