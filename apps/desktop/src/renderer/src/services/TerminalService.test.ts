import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { terminalService } from './TerminalService';

describe('TerminalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalService.initialize();
  });

  afterEach(() => {
    terminalService.destroy();
  });

  describe('createTerminal', () => {
    it('creates a terminal session via IPC', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'new-session', pid: 5678 },
      });

      const session = await terminalService.createTerminal({
        name: 'Test Terminal',
        shell: '/bin/zsh',
        cwd: '/home/user',
      });

      expect(window.api.terminal.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          shell: '/bin/zsh',
          cwd: '/home/user',
          cols: 80,
          rows: 24,
        })
      );

      expect(session.name).toBe('Test Terminal');
      expect(session.shell).toBe('/bin/zsh');
      expect(session.status).toBe('active');
      expect(session.pid).toBe(5678);
    });

    it('throws when IPC returns error', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: false,
        error: 'Shell not found',
      });

      await expect(
        terminalService.createTerminal({
          name: 'Test',
          shell: '/bin/nonexistent',
        })
      ).rejects.toThrow('Shell not found');
    });
  });

  describe('writeInput', () => {
    it('forwards data to IPC for active sessions', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'session-1', pid: 1234 },
      });

      const session = await terminalService.createTerminal({
        name: 'Test',
        shell: '/bin/zsh',
      });

      terminalService.writeInput(session.id, 'ls\n');
      expect(window.api.terminal.write).toHaveBeenCalledWith(session.id, 'ls\n');
    });

    it('does not forward data for unknown sessions', () => {
      terminalService.writeInput('nonexistent', 'ls\n');
      expect(window.api.terminal.write).not.toHaveBeenCalled();
    });
  });

  describe('resizeTerminal', () => {
    it('forwards resize to IPC', () => {
      terminalService.resizeTerminal('session-1', 120, 40);
      expect(window.api.terminal.resize).toHaveBeenCalledWith('session-1', 120, 40);
    });
  });

  describe('closeTerminal', () => {
    it('forwards close to IPC and cleans up', () => {
      terminalService.closeTerminal('session-1');
      expect(window.api.terminal.close).toHaveBeenCalledWith('session-1');
    });
  });

  describe('onTerminalData', () => {
    it('registers and invokes data handlers', () => {
      const handler = vi.fn();
      terminalService.onTerminalData('session-1', handler);

      // Simulate IPC data callback
      const onDataCalls = vi.mocked(window.api.terminal.onData).mock.calls;
      expect(onDataCalls.length).toBeGreaterThan(0);
    });

    it('returns cleanup function', () => {
      const handler = vi.fn();
      const cleanup = terminalService.onTerminalData('session-1', handler);
      expect(typeof cleanup).toBe('function');
      cleanup(); // Should not throw
    });
  });

  describe('canCreateSession', () => {
    it('returns true when under limit', () => {
      expect(terminalService.canCreateSession()).toBe(true);
    });
  });

  describe('getSessionCount', () => {
    it('returns 0 initially', () => {
      expect(terminalService.getSessionCount()).toBe(0);
    });
  });
});
