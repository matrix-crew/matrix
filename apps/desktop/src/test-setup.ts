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
  detectTerminals: vi.fn().mockResolvedValue([]),
  detectShells: vi.fn().mockResolvedValue([]),
  detectIDEs: vi.fn().mockResolvedValue([]),
  readConfig: vi.fn().mockResolvedValue({ onboarding_completed: true }),
  writeConfig: vi.fn().mockResolvedValue({ success: true }),
  openExternal: vi.fn().mockResolvedValue(undefined),
  terminal: {
    create: vi.fn().mockResolvedValue({ success: true, data: { sessionId: 'test-id', pid: 1234 } }),
    write: vi.fn(),
    resize: vi.fn(),
    close: vi.fn(),
    onData: vi.fn().mockReturnValue(() => {}),
    onExit: vi.fn().mockReturnValue(() => {}),
  },
};

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true,
});
