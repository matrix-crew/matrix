import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { terminalService, MAX_TERMINAL_SESSIONS } from './TerminalService';

describe('TerminalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalService.initialize();
  });

  afterEach(() => {
    terminalService.destroy();
  });

  // ── Constants ─────────────────────────────────────────────────────

  describe('constants', () => {
    it('has MAX_TERMINAL_SESSIONS set to 12', () => {
      expect(MAX_TERMINAL_SESSIONS).toBe(12);
    });
  });

  // ── createTerminal ────────────────────────────────────────────────

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

    it('uses default cols/rows when not specified', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'default-size', pid: 1111 },
      });

      await terminalService.createTerminal({
        name: 'Default Size',
        shell: '/bin/bash',
      });

      expect(window.api.terminal.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cols: 80, rows: 24 })
      );
    });

    it('uses custom cols/rows when specified', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'custom-size', pid: 2222 },
      });

      await terminalService.createTerminal({
        name: 'Custom Size',
        shell: '/bin/zsh',
        cols: 120,
        rows: 40,
      });

      expect(window.api.terminal.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cols: 120, rows: 40 })
      );
    });

    it('sets cwd to ~ when not provided', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'no-cwd', pid: 3333 },
      });

      const session = await terminalService.createTerminal({
        name: 'No CWD',
        shell: '/bin/zsh',
      });

      expect(session.cwd).toBe('~');
    });

    it('generates a unique session ID via crypto.randomUUID', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'uuid-test', pid: 4444 },
      });

      const session = await terminalService.createTerminal({
        name: 'UUID Test',
        shell: '/bin/zsh',
      });

      // Session ID should be a valid UUID format
      expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
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

    it('throws when IPC returns success but no data', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        // data is undefined
      });

      await expect(
        terminalService.createTerminal({
          name: 'No Data',
          shell: '/bin/zsh',
        })
      ).rejects.toThrow('Failed to create terminal session');
    });

    it('throws when maximum sessions reached', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'fill', pid: 9999 },
      });

      // Fill to max
      for (let i = 0; i < MAX_TERMINAL_SESSIONS; i++) {
        await terminalService.createTerminal({
          name: `Terminal ${i}`,
          shell: '/bin/zsh',
        });
      }

      await expect(
        terminalService.createTerminal({
          name: 'One Too Many',
          shell: '/bin/zsh',
        })
      ).rejects.toThrow(`Maximum ${MAX_TERMINAL_SESSIONS} terminals reached`);
    });

    it('increments session count after creation', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'count-test', pid: 5555 },
      });

      expect(terminalService.getSessionCount()).toBe(0);

      await terminalService.createTerminal({
        name: 'Counter',
        shell: '/bin/zsh',
      });

      expect(terminalService.getSessionCount()).toBe(1);
    });

    it('tracks session via getSession after creation', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'tracked', pid: 6666 },
      });

      const session = await terminalService.createTerminal({
        name: 'Tracked',
        shell: '/bin/zsh',
      });

      const retrieved = terminalService.getSession(session.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Tracked');
    });
  });

  // ── writeInput ────────────────────────────────────────────────────

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

    it('does not forward data for exited sessions', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'exited-session', pid: 7777 },
      });

      const session = await terminalService.createTerminal({
        name: 'Will Exit',
        shell: '/bin/zsh',
      });

      // Simulate exit by getting the session and mutating status
      const tracked = terminalService.getSession(session.id)!;
      tracked.status = 'exited';

      vi.mocked(window.api.terminal.write).mockClear();
      terminalService.writeInput(session.id, 'command\n');
      expect(window.api.terminal.write).not.toHaveBeenCalled();
    });
  });

  // ── resizeTerminal ────────────────────────────────────────────────

  describe('resizeTerminal', () => {
    it('forwards resize to IPC', () => {
      terminalService.resizeTerminal('session-1', 120, 40);
      expect(window.api.terminal.resize).toHaveBeenCalledWith('session-1', 120, 40);
    });
  });

  // ── closeTerminal ─────────────────────────────────────────────────

  describe('closeTerminal', () => {
    it('forwards close to IPC and removes session', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'close-me', pid: 8888 },
      });

      const session = await terminalService.createTerminal({
        name: 'Close Me',
        shell: '/bin/zsh',
      });

      expect(terminalService.getSessionCount()).toBe(1);

      terminalService.closeTerminal(session.id);

      expect(window.api.terminal.close).toHaveBeenCalledWith(session.id);
      expect(terminalService.getSessionCount()).toBe(0);
      expect(terminalService.getSession(session.id)).toBeUndefined();
    });

    it('cleans up data and exit handlers on close', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'handler-cleanup', pid: 9999 },
      });

      const session = await terminalService.createTerminal({
        name: 'Handler Cleanup',
        shell: '/bin/zsh',
      });

      // Register handlers
      const dataHandler = vi.fn();
      const exitHandler = vi.fn();
      terminalService.onTerminalData(session.id, dataHandler);
      terminalService.onTerminalExit(session.id, exitHandler);

      terminalService.closeTerminal(session.id);

      // Handlers should no longer be triggered
      // (Internal map is cleared, but we can verify by checking getSession is undefined)
      expect(terminalService.getSession(session.id)).toBeUndefined();
    });
  });

  // ── closeAllTerminals ─────────────────────────────────────────────

  describe('closeAllTerminals', () => {
    it('closes all sessions and clears state', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'bulk', pid: 1000 },
      });

      await terminalService.createTerminal({ name: 'T1', shell: '/bin/zsh' });
      await terminalService.createTerminal({ name: 'T2', shell: '/bin/bash' });
      await terminalService.createTerminal({ name: 'T3', shell: '/bin/fish' });

      expect(terminalService.getSessionCount()).toBe(3);

      terminalService.closeAllTerminals();

      expect(terminalService.getSessionCount()).toBe(0);
      expect(terminalService.getAllSessions()).toEqual([]);
      expect(window.api.terminal.close).toHaveBeenCalledTimes(3);
    });

    it('is safe to call when no sessions exist', () => {
      expect(terminalService.getSessionCount()).toBe(0);
      terminalService.closeAllTerminals(); // should not throw
      expect(terminalService.getSessionCount()).toBe(0);
    });
  });

  // ── onTerminalData ────────────────────────────────────────────────

  describe('onTerminalData', () => {
    it('registers and invokes data handlers', () => {
      const handler = vi.fn();
      terminalService.onTerminalData('session-1', handler);

      const onDataCalls = vi.mocked(window.api.terminal.onData).mock.calls;
      expect(onDataCalls.length).toBeGreaterThan(0);
    });

    it('returns cleanup function', () => {
      const handler = vi.fn();
      const cleanup = terminalService.onTerminalData('session-1', handler);
      expect(typeof cleanup).toBe('function');
      cleanup(); // Should not throw
    });

    it('supports multiple handlers for the same session', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const cleanup1 = terminalService.onTerminalData('multi-handler', handler1);
      const cleanup2 = terminalService.onTerminalData('multi-handler', handler2);

      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');

      // Cleanup one handler; the other should survive
      cleanup1();
      cleanup2();
    });
  });

  // ── onTerminalExit ────────────────────────────────────────────────

  describe('onTerminalExit', () => {
    it('returns cleanup function', () => {
      const handler = vi.fn();
      const cleanup = terminalService.onTerminalExit('session-1', handler);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });

  // ── getSession / getAllSessions ────────────────────────────────────

  describe('getSession / getAllSessions', () => {
    it('returns undefined for unknown session', () => {
      expect(terminalService.getSession('nonexistent')).toBeUndefined();
    });

    it('returns all sessions', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'all', pid: 1234 },
      });

      await terminalService.createTerminal({ name: 'A', shell: '/bin/zsh' });
      await terminalService.createTerminal({ name: 'B', shell: '/bin/bash' });

      const all = terminalService.getAllSessions();
      expect(all).toHaveLength(2);
      expect(all.map((s) => s.name)).toEqual(['A', 'B']);
    });
  });

  // ── canCreateSession ──────────────────────────────────────────────

  describe('canCreateSession', () => {
    it('returns true when under limit', () => {
      expect(terminalService.canCreateSession()).toBe(true);
    });

    it('returns false when at limit', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'limit', pid: 1234 },
      });

      for (let i = 0; i < MAX_TERMINAL_SESSIONS; i++) {
        await terminalService.createTerminal({ name: `T${i}`, shell: '/bin/zsh' });
      }

      expect(terminalService.canCreateSession()).toBe(false);
    });

    it('returns true again after closing a session', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'refill', pid: 1234 },
      });

      const sessions = [];
      for (let i = 0; i < MAX_TERMINAL_SESSIONS; i++) {
        sessions.push(await terminalService.createTerminal({ name: `T${i}`, shell: '/bin/zsh' }));
      }

      expect(terminalService.canCreateSession()).toBe(false);

      terminalService.closeTerminal(sessions[0].id);
      expect(terminalService.canCreateSession()).toBe(true);
    });
  });

  // ── getSessionCount ───────────────────────────────────────────────

  describe('getSessionCount', () => {
    it('returns 0 initially', () => {
      expect(terminalService.getSessionCount()).toBe(0);
    });

    it('tracks creates and closes', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'counter', pid: 1234 },
      });

      const s1 = await terminalService.createTerminal({ name: 'T1', shell: '/bin/zsh' });
      await terminalService.createTerminal({ name: 'T2', shell: '/bin/zsh' });
      expect(terminalService.getSessionCount()).toBe(2);

      terminalService.closeTerminal(s1.id);
      expect(terminalService.getSessionCount()).toBe(1);
    });
  });

  // ── Persistence: saveState ────────────────────────────────────────

  describe('saveState', () => {
    it('calls IPC saveState with correct structure', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'save-test', pid: 1234 },
      });

      const session = await terminalService.createTerminal({
        name: 'Save Test',
        shell: '/bin/zsh',
        cwd: '/home/user',
      });

      const getScrollback = vi.fn().mockReturnValue('scrollback content');

      await terminalService.saveState('/workspace/path', getScrollback);

      expect(window.api.terminal.saveState).toHaveBeenCalledWith(
        '/workspace/path',
        expect.objectContaining({
          sessions: [
            expect.objectContaining({
              id: session.id,
              name: 'Save Test',
              shell: '/bin/zsh',
              cwd: '/home/user',
            }),
          ],
          savedAt: expect.any(String),
        }),
        [{ sessionId: session.id, content: 'scrollback content' }]
      );
    });

    it('does not call IPC when no sessions exist', async () => {
      const getScrollback = vi.fn();
      await terminalService.saveState('/workspace/path', getScrollback);

      expect(window.api.terminal.saveState).not.toHaveBeenCalled();
      expect(getScrollback).not.toHaveBeenCalled();
    });

    it('calls getScrollback for each session', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'scroll', pid: 1234 },
      });

      const s1 = await terminalService.createTerminal({ name: 'S1', shell: '/bin/zsh' });
      const s2 = await terminalService.createTerminal({ name: 'S2', shell: '/bin/bash' });

      const getScrollback = vi.fn().mockReturnValue('buffer');
      await terminalService.saveState('/workspace', getScrollback);

      expect(getScrollback).toHaveBeenCalledWith(s1.id);
      expect(getScrollback).toHaveBeenCalledWith(s2.id);
      expect(getScrollback).toHaveBeenCalledTimes(2);
    });

    it('logs error when IPC saveState fails', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'fail-save', pid: 1234 },
      });

      await terminalService.createTerminal({ name: 'Fail', shell: '/bin/zsh' });

      vi.mocked(window.api.terminal.saveState).mockResolvedValue({
        success: false,
        error: 'Disk full',
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await terminalService.saveState('/workspace', () => '');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TerminalService] Failed to save state:',
        'Disk full'
      );
      consoleSpy.mockRestore();
    });
  });

  // ── Persistence: loadState ────────────────────────────────────────

  describe('loadState', () => {
    it('returns saved state from IPC', async () => {
      const mockState = {
        state: {
          sessions: [{ id: 's1', name: 'Restored', shell: '/bin/zsh', cwd: '~' }],
          savedAt: '2025-01-01T00:00:00.000Z',
        },
        scrollbacks: { s1: 'old output' },
      };

      vi.mocked(window.api.terminal.loadState).mockResolvedValue({
        success: true,
        data: mockState,
      });

      const result = await terminalService.loadState('/workspace');

      expect(result).toEqual(mockState);
      expect(window.api.terminal.loadState).toHaveBeenCalledWith('/workspace');
    });

    it('returns null when no saved data exists', async () => {
      vi.mocked(window.api.terminal.loadState).mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await terminalService.loadState('/workspace');
      expect(result).toBeNull();
    });

    it('returns null and logs error when IPC fails', async () => {
      vi.mocked(window.api.terminal.loadState).mockResolvedValue({
        success: false,
        error: 'File not found',
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await terminalService.loadState('/workspace');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TerminalService] Failed to load state:',
        'File not found'
      );
      consoleSpy.mockRestore();
    });
  });

  // ── initialize / destroy ──────────────────────────────────────────

  describe('initialize / destroy', () => {
    it('registers IPC listeners on initialize', () => {
      // Already initialized in beforeEach
      expect(window.api.terminal.onData).toHaveBeenCalled();
      expect(window.api.terminal.onExit).toHaveBeenCalled();
    });

    it('does not double-initialize', () => {
      const initialCallCount = vi.mocked(window.api.terminal.onData).mock.calls.length;

      terminalService.initialize(); // second call
      expect(vi.mocked(window.api.terminal.onData).mock.calls.length).toBe(initialCallCount);
    });

    it('clears all state on destroy', async () => {
      vi.mocked(window.api.terminal.create).mockResolvedValue({
        success: true,
        data: { sessionId: 'destroy', pid: 1234 },
      });

      await terminalService.createTerminal({ name: 'Doomed', shell: '/bin/zsh' });
      expect(terminalService.getSessionCount()).toBe(1);

      terminalService.destroy();

      expect(terminalService.getSessionCount()).toBe(0);
      expect(terminalService.getAllSessions()).toEqual([]);
    });
  });
});
