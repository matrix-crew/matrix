import { ipcMain } from 'electron';
import { PythonShell } from 'python-shell';
import { join } from 'path';
import type { IPCMessage, IPCResponse } from '@maxtix/shared';
import { getAppPaths } from './index';

/**
 * IPC Bridge Handler for Electron-Python Communication
 *
 * This module manages bidirectional communication between the Electron main process
 * and the Python backend using python-shell. Messages are sent in JSON format and
 * responses are parsed back from JSON.
 *
 * Security: This handler runs in the main process only, never in the renderer.
 * Messages from renderer go through the preload script context bridge.
 */

/**
 * Initialize IPC handlers for Python backend communication
 *
 * Sets up the 'ipc:send-to-python' channel that receives messages from the
 * renderer process (via preload context bridge) and forwards them to Python.
 */
export function setupIPCHandlers(): void {
  /**
   * Handle IPC messages from renderer and forward to Python backend
   *
   * This handler:
   * 1. Receives IPCMessage from renderer via preload context bridge
   * 2. Injects db_path from application configuration
   * 3. Sends message to Python backend via python-shell
   * 4. Waits for Python response
   * 5. Returns IPCResponse back to renderer
   */
  ipcMain.handle(
    'ipc:send-to-python',
    async (_event, message: IPCMessage): Promise<IPCResponse> => {
      try {
        // Validate message structure
        if (!message || typeof message.type !== 'string') {
          return {
            success: false,
            error: 'Invalid message format: missing type field',
          };
        }

        // Inject database path from application configuration
        const { dbPath } = getAppPaths();
        const messageWithConfig: IPCMessage = {
          ...message,
          db_path: dbPath,
        };

        // Send message to Python and wait for response
        const response = await sendToPython(messageWithConfig);
        return response;
      } catch (error) {
        // Handle any errors during IPC communication
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          success: false,
          error: `IPC communication failed: ${errorMessage}`,
        };
      }
    }
  );
}

/**
 * Send a message to the Python backend and wait for response
 *
 * Uses python-shell to execute the Python backend with the message as input.
 * The Python process is expected to:
 * - Read JSON from stdin
 * - Process the message
 * - Write JSON response to stdout
 * - Exit
 *
 * @param message - The IPC message to send to Python
 * @returns Promise that resolves with the Python backend's response
 */
async function sendToPython(message: IPCMessage): Promise<IPCResponse> {
  return new Promise((resolve, reject) => {
    // Configure python-shell options
    const corePath = join(__dirname, '../../../../packages/core');
    const options = {
      mode: 'json' as const, // Parse stdin/stdout as JSON
      pythonPath: 'uv', // Use uv as the executable
      pythonOptions: ['run', 'python', '-u'], // Run Python via uv with unbuffered output
      scriptPath: corePath,
      cwd: corePath, // uv needs to run from packages/core/ to find pyproject.toml and src package
    };

    // Create python shell instance
    const pyshell = new PythonShell('src/main.py', options);

    // Send message to Python stdin
    pyshell.send(message);

    // Collect response from Python stdout
    let response: IPCResponse | null = null;

    pyshell.on('message', (data: unknown) => {
      // Python should send exactly one JSON response
      if (data && typeof data === 'object') {
        response = data as IPCResponse;
      }
    });

    // Handle Python process completion
    pyshell.end((err) => {
      if (err) {
        reject(new Error(`Python process error: ${err.message}`));
      } else if (!response) {
        reject(new Error('No response received from Python backend'));
      } else {
        resolve(response);
      }
    });
  });
}
