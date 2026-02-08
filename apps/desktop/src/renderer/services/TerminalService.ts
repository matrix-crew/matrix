/**
 * Terminal Service
 *
 * Business logic layer between React components and the IPC bridge.
 * Manages terminal session lifecycle, data routing, and event subscriptions.
 */

import type {
  TerminalSessionInfo,
  TerminalSessionStatus,
  SavedTerminalState,
  SavedTerminalSession,
} from '@maxtix/shared';

/** Maximum concurrent terminal sessions */
export const MAX_TERMINAL_SESSIONS = 12;

/** Callbacks for terminal events, keyed by sessionId */
type DataHandler = (data: string) => void;
type ExitHandler = (exitCode: number) => void;

/**
 * Terminal service singleton
 *
 * Manages the lifecycle of terminal sessions and routes
 * IPC events to the appropriate handlers.
 */
class TerminalServiceImpl {
  private sessions = new Map<string, TerminalSessionInfo>();
  private dataHandlers = new Map<string, Set<DataHandler>>();
  private exitHandlers = new Map<string, Set<ExitHandler>>();
  private globalCleanup: (() => void) | null = null;

  /**
   * Initialize global IPC event listeners.
   * Call once when the app mounts.
   */
  initialize(): void {
    if (this.globalCleanup) return;

    const cleanupData = window.api.terminal.onData((sessionId, data) => {
      const handlers = this.dataHandlers.get(sessionId);
      if (handlers) {
        for (const handler of handlers) {
          handler(data);
        }
      }
    });

    const cleanupExit = window.api.terminal.onExit((sessionId, exitCode) => {
      // Update session status
      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'exited';
        session.exitCode = exitCode;
      }

      // Notify handlers
      const handlers = this.exitHandlers.get(sessionId);
      if (handlers) {
        for (const handler of handlers) {
          handler(exitCode);
        }
      }
    });

    this.globalCleanup = () => {
      cleanupData();
      cleanupExit();
    };
  }

  /**
   * Tear down global listeners.
   * Call when the app unmounts.
   */
  destroy(): void {
    this.globalCleanup?.();
    this.globalCleanup = null;
    this.sessions.clear();
    this.dataHandlers.clear();
    this.exitHandlers.clear();
  }

  /**
   * Create a new terminal session
   */
  async createTerminal(config: {
    name: string;
    shell: string;
    cwd?: string;
    cols?: number;
    rows?: number;
  }): Promise<TerminalSessionInfo> {
    if (this.sessions.size >= MAX_TERMINAL_SESSIONS) {
      throw new Error(`Maximum ${MAX_TERMINAL_SESSIONS} terminals reached`);
    }

    const sessionId = crypto.randomUUID();
    const result = await window.api.terminal.create(sessionId, {
      shell: config.shell,
      cwd: config.cwd,
      cols: config.cols ?? 80,
      rows: config.rows ?? 24,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create terminal session');
    }

    const session: TerminalSessionInfo = {
      id: sessionId,
      name: config.name,
      shell: config.shell,
      cwd: config.cwd || '~',
      status: 'active' as TerminalSessionStatus,
      pid: result.data.pid,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Write input data to a terminal session
   */
  writeInput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return;
    window.api.terminal.write(sessionId, data);
  }

  /**
   * Resize a terminal session
   */
  resizeTerminal(sessionId: string, cols: number, rows: number): void {
    window.api.terminal.resize(sessionId, cols, rows);
  }

  /**
   * Close a terminal session
   */
  closeTerminal(sessionId: string): void {
    window.api.terminal.close(sessionId);
    this.sessions.delete(sessionId);
    this.dataHandlers.delete(sessionId);
    this.exitHandlers.delete(sessionId);
  }

  /**
   * Subscribe to terminal data events for a specific session
   * @returns Cleanup function to unsubscribe
   */
  onTerminalData(sessionId: string, handler: DataHandler): () => void {
    let handlers = this.dataHandlers.get(sessionId);
    if (!handlers) {
      handlers = new Set();
      this.dataHandlers.set(sessionId, handlers);
    }
    handlers.add(handler);

    return () => {
      handlers!.delete(handler);
      if (handlers!.size === 0) {
        this.dataHandlers.delete(sessionId);
      }
    };
  }

  /**
   * Subscribe to terminal exit events for a specific session
   * @returns Cleanup function to unsubscribe
   */
  onTerminalExit(sessionId: string, handler: ExitHandler): () => void {
    let handlers = this.exitHandlers.get(sessionId);
    if (!handlers) {
      handlers = new Set();
      this.exitHandlers.set(sessionId, handlers);
    }
    handlers.add(handler);

    return () => {
      handlers!.delete(handler);
      if (handlers!.size === 0) {
        this.exitHandlers.delete(sessionId);
      }
    };
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): TerminalSessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): TerminalSessionInfo[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Check if more sessions can be created
   */
  canCreateSession(): boolean {
    return this.sessions.size < MAX_TERMINAL_SESSIONS;
  }

  /**
   * Get the count of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Close all terminal sessions (used during Matrix switch)
   */
  closeAllTerminals(): void {
    for (const [sessionId] of this.sessions) {
      window.api.terminal.close(sessionId);
    }
    this.sessions.clear();
    this.dataHandlers.clear();
    this.exitHandlers.clear();
  }

  /**
   * Save current terminal state to a workspace path.
   * @param workspacePath - Absolute path to the Matrix workspace
   * @param getScrollback - Callback to get scrollback content for a session ID
   */
  async saveState(
    workspacePath: string,
    getScrollback: (sessionId: string) => string
  ): Promise<void> {
    const sessions = this.getAllSessions();
    if (sessions.length === 0) return;

    const savedSessions: SavedTerminalSession[] = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      shell: s.shell,
      cwd: s.cwd,
    }));

    const state: SavedTerminalState = {
      sessions: savedSessions,
      savedAt: new Date().toISOString(),
    };

    const scrollbacks = sessions.map((s) => ({
      sessionId: s.id,
      content: getScrollback(s.id),
    }));

    const result = await window.api.terminal.saveState(workspacePath, state, scrollbacks);
    if (!result.success) {
      console.error('[TerminalService] Failed to save state:', result.error);
    }
  }

  /**
   * Load terminal state from a workspace path.
   * @returns Saved state and scrollback data, or null if none exists
   */
  async loadState(
    workspacePath: string
  ): Promise<{ state: SavedTerminalState; scrollbacks: Record<string, string> } | null> {
    const result = await window.api.terminal.loadState(workspacePath);
    if (!result.success) {
      console.error('[TerminalService] Failed to load state:', result.error);
      return null;
    }
    return result.data ?? null;
  }
}

/** Singleton terminal service instance */
export const terminalService = new TerminalServiceImpl();
