import React, { useState } from 'react';
import { SidebarNavigation, type NavigationSection } from '@maxtix/ui';
import {
  LayoutDashboard,
  GitBranch,
  Terminal,
  Zap,
  GitBranchPlus,
  AlertCircle,
  GitPullRequest,
} from 'lucide-react';
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
 * Navigation sections configuration with icons and shortcuts
 */
const navigationSections: NavigationSection[] = [
  {
    id: 'workflow',
    title: 'Workflow',
    items: [
      {
        id: 'kanban',
        label: 'Kanban Board',
        shortcut: '⌘K',
        icon: <LayoutDashboard className="size-5" />,
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        shortcut: '⌘P',
        icon: <GitBranch className="size-5" />,
      },
    ],
    defaultExpanded: true,
  },
  {
    id: 'agent',
    title: 'Agent',
    items: [
      {
        id: 'console',
        label: 'Console',
        shortcut: '⌘A',
        icon: <Terminal className="size-5" />,
      },
      {
        id: 'mcp',
        label: 'MCP Control',
        shortcut: '⌘M',
        icon: <Zap className="size-5" />,
      },
    ],
    defaultExpanded: true,
  },
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      {
        id: 'branches',
        label: 'Branches',
        shortcut: '⌘B',
        icon: <GitBranchPlus className="size-5" />,
      },
      {
        id: 'issues',
        label: 'Issues',
        shortcut: '⌘I',
        icon: <AlertCircle className="size-5" />,
      },
      {
        id: 'prs',
        label: 'Pull Requests',
        shortcut: '⌘R',
        icon: <GitPullRequest className="size-5" />,
      },
    ],
    defaultExpanded: true,
  },
];

/**
 * Main App component for Maxtix desktop application
 *
 * This is the root React component that renders the desktop UI.
 * It serves as the entry point for the renderer process UI hierarchy.
 * Uses SidebarNavigation component from @maxtix/ui for hierarchical navigation.
 */
const App: React.FC = () => {
  const [activeItem, setActiveItem] = useState<NavItemId>('kanban');

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
      {/* Use SidebarNavigation from UI package */}
      <SidebarNavigation
        activeItemId={activeItem}
        onItemSelect={(itemId) => setActiveItem(itemId as NavItemId)}
        sections={navigationSections}
      />

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
