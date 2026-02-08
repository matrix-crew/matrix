import type { IPCMessage, IPCResponse } from '@maxtix/shared';

/**
 * Type definitions for the Electron preload API exposed to renderer
 *
 * These types ensure type safety when using window.api in the renderer process.
 */

export interface ElectronAPI {
  /**
   * Send an IPC message to the Python backend via the main process
   * @param message - The IPC message to send
   * @returns Promise that resolves with the response from Python backend
   */
  sendMessage: (message: IPCMessage) => Promise<IPCResponse>;

  /**
   * Subscribe to IPC events from the main process
   * @param channel - The event channel to listen to
   * @param callback - Function to call when event is received
   */
  on: (channel: string, callback: (...args: unknown[]) => void) => void;

  /**
   * Unsubscribe from IPC events
   * @param channel - The event channel to stop listening to
   * @param callback - The callback function to remove
   */
  off: (channel: string, callback: (...args: unknown[]) => void) => void;

  // ── System Check APIs (Onboarding) ──────────────────────────────────

  /**
   * Check if a CLI command exists on the system
   * @param command - Command name to check (e.g., 'claude', 'git')
   * @returns Detection result with path and version info
   */
  checkCommand: (command: string) => Promise<{ exists: boolean; path?: string; version?: string }>;

  /**
   * Detect installed terminal emulators on the system
   * @returns Array of detected terminals with name, id, path, and isDefault flag
   */
  detectTerminals: () => Promise<
    Array<{ id: string; name: string; path: string; isDefault: boolean }>
  >;

  /**
   * Detect installed IDEs / code editors on the system
   * @returns Array of detected IDEs with id, name, and path
   */
  detectIDEs: () => Promise<Array<{ id: string; name: string; path: string }>>;

  /**
   * Read application config from ~/.matrix/config.json
   */
  readConfig: () => Promise<Record<string, unknown>>;

  /**
   * Write application config to ~/.matrix/config.json (merges with existing)
   */
  writeConfig: (config: Record<string, unknown>) => Promise<{ success: boolean }>;

  /**
   * Open a URL in the default browser
   */
  openExternal: (url: string) => Promise<void>;

  // ── Terminal PTY APIs ─────────────────────────────────────────

  terminal: {
    /** Create a new terminal PTY session */
    create: (
      sessionId: string,
      options: { shell: string; cwd?: string; cols: number; rows: number }
    ) => Promise<{ success: boolean; data?: { sessionId: string; pid: number }; error?: string }>;

    /** Write data to a terminal session's stdin */
    write: (sessionId: string, data: string) => void;

    /** Resize a terminal session */
    resize: (sessionId: string, cols: number, rows: number) => void;

    /** Close a terminal session */
    close: (sessionId: string) => void;

    /** Subscribe to terminal data output events */
    onData: (callback: (sessionId: string, data: string) => void) => () => void;

    /** Subscribe to terminal exit events */
    onExit: (callback: (sessionId: string, exitCode: number) => void) => () => void;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
