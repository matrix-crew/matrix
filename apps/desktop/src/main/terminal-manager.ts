/**
 * Terminal Manager - Main Process PTY Lifecycle Management
 *
 * Manages node-pty instances for real terminal sessions.
 * Each terminal session spawns a PTY process that communicates
 * with the renderer's xterm.js via IPC events.
 *
 * IPC Channels:
 * - terminal:create  (invoke)  → Create new PTY session
 * - terminal:write   (send)    → Write data to PTY stdin
 * - terminal:resize  (send)    → Resize PTY dimensions
 * - terminal:close   (send)    → Kill PTY process
 * - terminal:data    (event)   → Stream PTY stdout to renderer
 * - terminal:exit    (event)   → Notify session exit
 */

import { app, ipcMain, BrowserWindow } from 'electron';
import * as pty from 'node-pty';
import { platform, homedir } from 'os';
import type { TerminalCreateOptions, TerminalCreateResult } from '@maxtix/shared';

interface ActiveSession {
  process: pty.IPty;
  pid: number;
}

/** Map of sessionId → active PTY session */
const activeSessions = new Map<string, ActiveSession>();

/** Maximum concurrent terminal sessions */
const MAX_SESSIONS = 10;

/**
 * Get the default shell for the current platform
 */
function getDefaultShell(): string {
  if (platform() === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/zsh';
}

/**
 * Get default shell arguments for the given shell
 */
function getShellArgs(shell: string): string[] {
  const basename = shell.split('/').pop() || '';

  if (platform() === 'win32') {
    return [];
  }

  // Launch as login shell for proper environment
  if (['zsh', 'bash', 'fish'].includes(basename)) {
    return ['--login'];
  }

  return [];
}

/**
 * Get the BrowserWindow to send events to
 */
function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

/**
 * Create a new PTY session
 */
function createSession(sessionId: string, options: TerminalCreateOptions): TerminalCreateResult {
  if (activeSessions.size >= MAX_SESSIONS) {
    throw new Error(`Maximum ${MAX_SESSIONS} terminal sessions reached`);
  }

  if (activeSessions.has(sessionId)) {
    throw new Error(`Session ${sessionId} already exists`);
  }

  const shell = options.shell || getDefaultShell();
  const args = getShellArgs(shell);
  const cwd = options.cwd || homedir();

  const ptyProcess = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: options.cols || 80,
    rows: options.rows || 24,
    cwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    } as Record<string, string>,
  });

  const session: ActiveSession = {
    process: ptyProcess,
    pid: ptyProcess.pid,
  };

  activeSessions.set(sessionId, session);

  // Stream PTY output to renderer
  ptyProcess.onData((data: string) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal:data', sessionId, data);
    }
  });

  // Handle PTY exit
  ptyProcess.onExit(({ exitCode }) => {
    activeSessions.delete(sessionId);
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal:exit', sessionId, exitCode);
    }
  });

  return {
    sessionId,
    pid: ptyProcess.pid,
  };
}

/**
 * Write data to a PTY session's stdin
 */
function writeToSession(sessionId: string, data: string): void {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  session.process.write(data);
}

/**
 * Resize a PTY session
 */
function resizeSession(sessionId: string, cols: number, rows: number): void {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  try {
    session.process.resize(cols, rows);
  } catch {
    // PTY may have already exited
  }
}

/**
 * Close a PTY session
 */
function closeSession(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  try {
    session.process.kill();
  } catch {
    // Process may have already exited
  }
  activeSessions.delete(sessionId);
}

/**
 * Close all active sessions (cleanup on app quit)
 */
function closeAllSessions(): void {
  for (const [sessionId] of activeSessions) {
    closeSession(sessionId);
  }
}

/**
 * Register IPC handlers for terminal management
 *
 * Call this from the main process entry point after app.whenReady().
 */
export function setupTerminalHandlers(): void {
  // Create a new terminal session
  ipcMain.handle(
    'terminal:create',
    async (_event, sessionId: string, options: TerminalCreateOptions) => {
      try {
        const result = createSession(sessionId, options);
        return { success: true, data: result };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create terminal';
        return { success: false, error: message };
      }
    }
  );

  // Write data to terminal stdin (fire-and-forget)
  ipcMain.on('terminal:write', (_event, sessionId: string, data: string) => {
    writeToSession(sessionId, data);
  });

  // Resize terminal dimensions (fire-and-forget)
  ipcMain.on('terminal:resize', (_event, sessionId: string, cols: number, rows: number) => {
    resizeSession(sessionId, cols, rows);
  });

  // Close a terminal session (fire-and-forget)
  ipcMain.on('terminal:close', (_event, sessionId: string) => {
    closeSession(sessionId);
  });

  // Cleanup all sessions on app quit
  app.on('before-quit', () => {
    closeAllSessions();
  });
}
