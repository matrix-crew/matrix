import React, { useState } from 'react';
import { TabNavigation, type TabId } from '@/components/layout/TabNavigation';
import { TabPanel } from '@/components/layout/TabPanel';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { PipelineEditor } from '@/components/workflow/PipelineEditor';
import { ConsoleManager } from '@/components/agent/ConsoleManager';
import { MCPControl } from '@/components/agent/MCPControl';
import { BranchesView } from '@/components/workspace/BranchesView';
import { IssuesView } from '@/components/workspace/IssuesView';
import { PRsView } from '@/components/workspace/PRsView';
import { SettingsPage } from '@/components/settings/SettingsPage';

/**
 * Workflow sub-tab type
 */
type WorkflowSubTab = 'kanban' | 'pipeline';

/**
 * Workflow tab content with Kanban board and Pipeline editor
 * Users can switch between Kanban and Pipeline views using sub-tabs
 */
const WorkflowTabContent: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<WorkflowSubTab>('kanban');

  return (
    <div className="flex h-full flex-col">
      {/* Sub-tab navigation */}
      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveSubTab('kanban')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'kanban'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          aria-selected={activeSubTab === 'kanban'}
          role="tab"
        >
          Kanban Board
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('pipeline')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'pipeline'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          aria-selected={activeSubTab === 'pipeline'}
          role="tab"
        >
          Pipeline Editor
        </button>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'kanban' && <KanbanBoard />}
        {activeSubTab === 'pipeline' && <PipelineEditor />}
      </div>
    </div>
  );
};

/**
 * Agent sub-tab type
 */
type AgentSubTab = 'console' | 'mcp';

/**
 * Agent tab content with Console terminal manager and MCP Control
 * Users can switch between Console and MCP views using sub-tabs
 */
const AgentTabContent: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AgentSubTab>('console');

  return (
    <div className="flex h-full flex-col">
      {/* Sub-tab navigation */}
      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveSubTab('console')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'console'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          aria-selected={activeSubTab === 'console'}
          role="tab"
        >
          Console
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('mcp')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'mcp'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          aria-selected={activeSubTab === 'mcp'}
          role="tab"
        >
          MCP Control
        </button>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'console' && <ConsoleManager />}
        {activeSubTab === 'mcp' && <MCPControl />}
      </div>
    </div>
  );
};

/**
 * Workspace sub-tab type
 */
type WorkspaceSubTab = 'branches' | 'issues' | 'prs';

/**
 * Workspace tab content with Branches, Issues, and PRs views
 * Users can switch between views using sub-tabs
 */
const WorkspaceTabContent: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<WorkspaceSubTab>('branches');

  return (
    <div className="flex h-full flex-col">
      {/* Sub-tab navigation */}
      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveSubTab('branches')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'branches'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          aria-selected={activeSubTab === 'branches'}
          role="tab"
        >
          Branches
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('issues')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'issues'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          aria-selected={activeSubTab === 'issues'}
          role="tab"
        >
          Issues
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('prs')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'prs'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          aria-selected={activeSubTab === 'prs'}
          role="tab"
        >
          Pull Requests
        </button>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'branches' && <BranchesView />}
        {activeSubTab === 'issues' && <IssuesView />}
        {activeSubTab === 'prs' && <PRsView />}
      </div>
    </div>
  );
};

/**
 * Settings tab content with SettingsPage
 * Displays the full settings page with sidebar navigation
 */
const SettingsTabContent: React.FC = () => {
  return <SettingsPage />;
};

/**
 * Main App component for Maxtix desktop application
 *
 * This is the root React component that renders the desktop UI.
 * It serves as the entry point for the renderer process UI hierarchy.
 * Implements tab-based navigation with Workflow, Agent, Workspace, and Settings tabs.
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('workflow');

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
          <WorkspaceTabContent />
        </TabPanel>

        <TabPanel id="settings" activeTab={activeTab}>
          <SettingsTabContent />
        </TabPanel>
      </main>
    </div>
  );
};

export default App;
