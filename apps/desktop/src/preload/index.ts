import { contextBridge, ipcRenderer } from 'electron';
import type { IPCMessage, IPCResponse } from '@maxtix/shared';

/**
 * Preload script for Electron renderer process
 *
 * This script runs in a privileged context with access to both Node.js APIs
 * and the renderer process window. It uses contextBridge to safely expose
 * IPC communication methods to the renderer.
 *
 * Security: contextIsolation is enabled, so we use contextBridge to create
 * a secure bridge between main process and renderer process.
 */

// Expose IPC API to renderer process via context bridge
contextBridge.exposeInMainWorld('api', {
  /**
   * Send an IPC message to the Python backend via the main process
   * @param message - The IPC message to send
   * @returns Promise that resolves with the response from Python backend
   */
  sendMessage: async (message: IPCMessage): Promise<IPCResponse> => {
    return ipcRenderer.invoke('ipc:send-to-python', message);
  },

  /**
   * Subscribe to IPC events from the main process
   * @param channel - The event channel to listen to
   * @param callback - Function to call when event is received
   */
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },

  /**
   * Unsubscribe from IPC events
   * @param channel - The event channel to stop listening to
   * @param callback - The callback function to remove
   */
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
