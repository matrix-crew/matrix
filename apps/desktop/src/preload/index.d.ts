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

  /** Check if a CLI command exists on the system */
  checkCommand: (command: string) => Promise<{ exists: boolean; path?: string; version?: string }>;

  /** Read application config from ~/.matrix/config.json */
  readConfig: () => Promise<Record<string, unknown>>;

  /** Write application config to ~/.matrix/config.json */
  writeConfig: (config: Record<string, unknown>) => Promise<{ success: boolean }>;

  /** Open a URL in the default browser */
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
