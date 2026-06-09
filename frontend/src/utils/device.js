const DEVICE_ID_KEY = 'deviceId';

/**
 * Generate a random device ID using crypto API
 * @returns {string} A unique device ID
 */
function generateDeviceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create a device ID from localStorage
 * @returns {string} The device ID
 */
export function getDeviceId() {
  if (typeof window === 'undefined') {
    return null;
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Reset the device ID (useful for testing or logout)
 */
export function resetDeviceId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEVICE_ID_KEY);
  }
}

export default { getDeviceId, resetDeviceId };

/**
 * Get device platform string for server-side presence tracking
 * Returns one of: 'web', 'android', 'ios'
 */
export function getPlatform() {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'web';
}
