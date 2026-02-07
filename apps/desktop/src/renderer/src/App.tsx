import React, { useState } from 'react';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { PipelineEditor } from '@/components/workflow/PipelineEditor';
import { ConsoleManager } from '@/components/agent/ConsoleManager';
import { MCPControl } from '@/components/agent/MCPControl';
import { BranchesView } from '@/components/workspace/BranchesView';
import { IssuesView } from '@/components/workspace/IssuesView';
import { PRsView } from '@/components/workspace/PRsView';

/**
 * Navigation item type for sidebar
 */
type NavItemId =
  | 'kanban'
  | 'pipeline'
  | 'console'
  | 'mcp'
  | 'branches'
  | 'issues'
  | 'prs';

/**
 * Section type for sidebar
 */
type SectionId = 'workflow' | 'agent' | 'workspace';

/**
 * Main App component for Maxtix desktop application
 *
 * This is the root React component that renders the desktop UI.
 * It serves as the entry point for the renderer process UI hierarchy.
 * Implements sidebar navigation with collapsible sections for Workflow, Agent, and Workspace.
 */
const App: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['workflow', 'agent', 'workspace'])
  );
  const [activeItem, setActiveItem] = useState<NavItemId>('kanban');

  /**
   * Toggle a section's expanded/collapsed state
   */
  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  /**
   * Render content based on active navigation item
   */
  const renderContent = () => {
    switch (activeItem) {
      case 'kanban':
        return <KanbanBoard />;
      case 'pipeline':
        return <PipelineEditor />;
      case 'console':
        return <ConsoleManager />;
      case 'mcp':
        return <MCPControl />;
      case 'branches':
        return <BranchesView />;
      case 'issues':
        return <IssuesView />;
      case 'prs':
        return <PRsView />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950">
      {/* Sidebar navigation */}
      <aside className="flex w-64 flex-none flex-col border-r border-gray-200 bg-gray-900 dark:border-gray-800 dark:bg-gray-950">
        {/* App title header */}
        <div className="flex h-14 flex-none items-center border-b border-gray-700 px-4 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-100">Maxtix</h1>
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Workflow Section */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('workflow')}
              className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100"
              aria-expanded={expandedSections.has('workflow')}
            >
              <span>Workflow</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  expandedSections.has('workflow') ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            {expandedSections.has('workflow') && (
              <div className="mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveItem('kanban')}
                  className={`block w-full px-8 py-2 text-left text-sm transition-colors ${
                    activeItem === 'kanban'
                      ? 'bg-gray-800 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  Kanban Board
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItem('pipeline')}
                  className={`block w-full px-8 py-2 text-left text-sm transition-colors ${
                    activeItem === 'pipeline'
                      ? 'bg-gray-800 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  Pipeline Editor
                </button>
              </div>
            )}
          </div>

          {/* Agent Section */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('agent')}
              className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100"
              aria-expanded={expandedSections.has('agent')}
            >
              <span>Agent</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  expandedSections.has('agent') ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            {expandedSections.has('agent') && (
              <div className="mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveItem('console')}
                  className={`block w-full px-8 py-2 text-left text-sm transition-colors ${
                    activeItem === 'console'
                      ? 'bg-gray-800 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  Console
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItem('mcp')}
                  className={`block w-full px-8 py-2 text-left text-sm transition-colors ${
                    activeItem === 'mcp'
                      ? 'bg-gray-800 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  MCP Control
                </button>
              </div>
            )}
          </div>

          {/* Workspace Section */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('workspace')}
              className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100"
              aria-expanded={expandedSections.has('workspace')}
            >
              <span>Workspace</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  expandedSections.has('workspace') ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            {expandedSections.has('workspace') && (
              <div className="mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveItem('branches')}
                  className={`block w-full px-8 py-2 text-left text-sm transition-colors ${
                    activeItem === 'branches'
                      ? 'bg-gray-800 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  Branches
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItem('issues')}
                  className={`block w-full px-8 py-2 text-left text-sm transition-colors ${
                    activeItem === 'issues'
                      ? 'bg-gray-800 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  Issues
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItem('prs')}
                  className={`block w-full px-8 py-2 text-left text-sm transition-colors ${
                    activeItem === 'prs'
                      ? 'bg-gray-800 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  Pull Requests
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
