import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDeviceId, resetDeviceId } from './device';

describe('Device ID Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getDeviceId', () => {
    it('TC1.1: Should generate a new device ID if none exists in localStorage', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const deviceId = getDeviceId();
      
      expect(deviceId).toBeTruthy();
      expect(typeof deviceId).toBe('string');
      expect(localStorage.setItem).toHaveBeenCalledWith('deviceId', expect.any(String));
    });

    it('TC1.1: Should return existing device ID from localStorage if it exists', () => {
      const existingDeviceId = 'existing-uuid-1234';
      localStorage.getItem.mockReturnValue(existingDeviceId);
      
      const deviceId = getDeviceId();
      
      expect(deviceId).toBe(existingDeviceId);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('Should return null if window is undefined (SSR)', () => {
      const originalWindow = global.window;
      delete global.window;
      
      const deviceId = getDeviceId();
      
      expect(deviceId).toBeNull();
      
      global.window = originalWindow;
    });

    it('Should generate UUID-like format', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const deviceId = getDeviceId();
      
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(deviceId).toMatch(uuidRegex);
    });
  });

  describe('resetDeviceId', () => {
    it('Should remove device ID from localStorage', () => {
      localStorage.getItem.mockReturnValue('some-device-id');
      
      resetDeviceId();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('deviceId');
    });

    it('Should not throw error if window is undefined', () => {
      const originalWindow = global.window;
      delete global.window;
      
      expect(() => resetDeviceId()).not.toThrow();
      
      global.window = originalWindow;
    });
  });
});
