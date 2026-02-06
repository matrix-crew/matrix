import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TabNavigation, type TabId } from '@/components/layout/TabNavigation';
import { TabPanel } from '@/components/layout/TabPanel';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import type { IPCResponse } from '@maxtix/shared';

/**
 * Workflow tab content with Kanban board
 * Pipeline editor placeholder will be added in a future subtask
 */
const WorkflowTabContent: React.FC = () => (
  <div className="flex h-full flex-col">
    <KanbanBoard />
  </div>
);

/**
 * Placeholder component for Agent tab content
 * Will be replaced with Console and MCP Control components
 */
const AgentTabContent: React.FC = () => (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Agent Tab
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Console Terminal and MCP Control coming soon
      </p>
    </div>
  </div>
);

/**
 * Placeholder component for Workspace tab content
 * Will be replaced with Branches, Issues, and PRs views
 */
const WorkspaceTabContent: React.FC<{
  ipcResponse: IPCResponse | null;
  isLoading: boolean;
  onTestIPC: () => void;
}> = ({ ipcResponse, isLoading, onTestIPC }) => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Workspace Tab
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Branches, Issues, and PRs views coming soon
      </p>

      {/* IPC Test Section - temporary for development */}
      <div className="mt-8 space-y-4">
        <Button onClick={onTestIPC} disabled={isLoading}>
          {isLoading ? 'Testing IPC...' : 'Test IPC Connection'}
        </Button>

        {/* Display IPC Response */}
        {ipcResponse && (
          <div className="mx-auto max-w-md rounded-md border border-gray-200 bg-white p-4 text-left dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 font-semibold">
              {ipcResponse.success ? (
                <span className="text-green-600 dark:text-green-400">Success</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">Error</span>
              )}
            </div>
            <pre className="overflow-auto text-sm text-gray-700 dark:text-gray-300">
              {JSON.stringify(ipcResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  </div>
);

/**
 * Main App component for Maxtix desktop application
 *
 * This is the root React component that renders the desktop UI.
 * It serves as the entry point for the renderer process UI hierarchy.
 * Implements tab-based navigation with Workflow, Agent, and Workspace tabs.
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('workflow');
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header with app title and tab navigation */}
      <header className="flex-none border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Maxtix</h1>
        </div>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} className="px-4" />
      </header>

      {/* Main content area with tab panels */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <TabPanel id="workflow" activeTab={activeTab} className="p-4">
          <WorkflowTabContent />
        </TabPanel>

        <TabPanel id="agent" activeTab={activeTab} className="p-4">
          <AgentTabContent />
        </TabPanel>

        <TabPanel id="workspace" activeTab={activeTab} className="p-4">
          <WorkspaceTabContent
            ipcResponse={ipcResponse}
            isLoading={isLoading}
            onTestIPC={handleTestIPC}
          />
        </TabPanel>
      </main>
    </div>
  );
};

export default App;
