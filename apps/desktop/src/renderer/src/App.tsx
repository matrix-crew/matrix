import React, { useState } from 'react';
import { Button } from '@maxtix/ui';
import type { IPCResponse } from '@maxtix/shared';

/**
 * Main App component for Maxtix desktop application
 *
 * This is the root React component that renders the desktop UI.
 * It serves as the entry point for the renderer process UI hierarchy.
 */
const App: React.FC = () => {
  const [ipcResponse, setIpcResponse] = useState<IPCResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Test IPC communication with Python backend
   * Sends a ping message and displays the response
   */
  const handleTestIPC = async () => {
    setIsLoading(true);
    setIpcResponse(null);

    try {
      // Send ping message to Python backend via IPC bridge
      const response = await window.api.sendMessage({ type: 'ping' });
      setIpcResponse(response);
    } catch (error) {
      // Handle any errors during IPC communication
      setIpcResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Maxtix</h1>
        <p className="mt-4 text-lg text-gray-600">
          Automated multi-source, multi-session AI agent system
        </p>

        {/* IPC Test Section */}
        <div className="mt-8 space-y-4">
          <Button onClick={handleTestIPC} disabled={isLoading}>
            {isLoading ? 'Testing IPC...' : 'Test IPC Connection'}
          </Button>

          {/* Display IPC Response */}
          {ipcResponse && (
            <div className="mx-auto max-w-md rounded-md border border-gray-200 bg-white p-4 text-left">
              <div className="mb-2 font-semibold">
                {ipcResponse.success ? (
                  <span className="text-green-600">✓ Success</span>
                ) : (
                  <span className="text-red-600">✗ Error</span>
                )}
              </div>
              <pre className="overflow-auto text-sm text-gray-700">
                {JSON.stringify(ipcResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
