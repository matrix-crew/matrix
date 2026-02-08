import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * Mock window.api for IPC tests.
 * Each test can override specific methods via vi.mocked().
 */
const mockApi = {
  sendMessage: vi.fn().mockResolvedValue({ success: true, data: {} }),
  on: vi.fn(),
  off: vi.fn(),
  checkCommand: vi.fn().mockResolvedValue({ exists: false }),
  readConfig: vi.fn().mockResolvedValue({ onboarding_completed: true }),
  writeConfig: vi.fn().mockResolvedValue({ success: true }),
  openExternal: vi.fn().mockResolvedValue(undefined),
};

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true,
});
