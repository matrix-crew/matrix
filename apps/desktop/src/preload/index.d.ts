import type { IPCMessage, IPCResponse } from '@maxtix/shared'

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
  sendMessage: (message: IPCMessage) => Promise<IPCResponse>

  /**
   * Subscribe to IPC events from the main process
   * @param channel - The event channel to listen to
   * @param callback - Function to call when event is received
   */
  on: (channel: string, callback: (...args: unknown[]) => void) => void

  /**
   * Unsubscribe from IPC events
   * @param channel - The event channel to stop listening to
   * @param callback - The callback function to remove
   */
  off: (channel: string, callback: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
