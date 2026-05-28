import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock;

// Mock crypto.randomUUID for environments that don't support it
if (!global.crypto || !global.crypto.randomUUID) {
  global.crypto = {
    randomUUID: vi.fn(() => 'mock-uuid-1234'),
  };
}

// Mock environment variables
import.meta.env.VITE_SOCKET_URL = 'http://localhost:3000';
import.meta.env.VITE_API_BASE_URL = 'http://localhost:5000';
