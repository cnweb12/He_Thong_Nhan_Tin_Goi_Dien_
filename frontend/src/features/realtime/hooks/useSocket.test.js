import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocket } from './useSocket';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
  })),
}));

// Mock device utility
vi.mock('../../../utils/device', () => ({
  getDeviceId: vi.fn(() => 'mock-device-id'),
}));

describe('useSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset environment variable
    import.meta.env.VITE_SOCKET_URL = 'http://localhost:3000';
  });

  describe('TC1.2: Initialization with valid token', () => {
    it('Should return socket instance when token is provided', () => {
      const { result } = renderHook(() => useSocket('valid-token'));

      expect(result.current.socket).toBeDefined();
      expect(result.current.socket).toBeTruthy();
    });
  });

  describe('TC1.3: Disconnection on unmount', () => {
    it('Should handle unmount without errors', () => {
      const { unmount } = renderHook(() => useSocket('valid-token'));

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('Should not connect if token is null', () => {
      const { result } = renderHook(() => useSocket(null));

      expect(result.current.socket).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it('Should not connect if token is undefined', () => {
      const { result } = renderHook(() => useSocket(undefined));

      expect(result.current.socket).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });
});
