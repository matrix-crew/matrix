import React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, LayoutDashboard, GitBranch, Terminal, Zap, Settings } from 'lucide-react';

export type ContextItemId = 'sources' | 'kanban' | 'pipeline' | 'console' | 'mcp' | 'settings';

interface SidebarSection {
  title: string;
  items: {
    id: ContextItemId;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
  }[];
}

const sections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      {
        id: 'sources',
        label: 'Sources',
        icon: <FolderOpen className="size-4" />,
        shortcut: '⌘S',
      },
    ],
  },
  {
    title: 'Workflow',
    items: [
      {
        id: 'kanban',
        label: 'Kanban',
        icon: <LayoutDashboard className="size-4" />,
        shortcut: '⌘K',
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        icon: <GitBranch className="size-4" />,
        shortcut: '⌘P',
      },
    ],
  },
  {
    title: 'Agent',
    items: [
      {
        id: 'console',
        label: 'Console',
        icon: <Terminal className="size-4" />,
        shortcut: '⌘A',
      },
      {
        id: 'mcp',
        label: 'MCP',
        icon: <Zap className="size-4" />,
        shortcut: '⌘M',
      },
    ],
  },
];

export interface ContextSidebarProps {
  activeItem: ContextItemId;
  onItemSelect: (id: ContextItemId) => void;
  className?: string;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  activeItem,
  onItemSelect,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex w-48 flex-shrink-0 flex-col border-r border-border-default bg-base-800',
        className
      )}
    >
      {/* Scrollable sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-3">
            <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const isActive = item.id === activeItem;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemSelect(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-accent-lime/10 text-accent-lime'
                      : 'text-text-secondary hover:bg-base-700 hover:text-text-primary'
                  )}
                >
                  <span className={cn(isActive ? 'text-accent-lime' : 'text-text-muted')}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-[10px] text-text-muted">{item.shortcut}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Settings pinned at bottom */}
      <div className="border-t border-border-default px-2 py-2">
        <button
          type="button"
          onClick={() => onItemSelect('settings')}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
            activeItem === 'settings'
              ? 'bg-accent-lime/10 text-accent-lime'
              : 'text-text-secondary hover:bg-base-700 hover:text-text-primary'
          )}
        >
          <Settings
            className={cn(
              'size-4',
              activeItem === 'settings' ? 'text-accent-lime' : 'text-text-muted'
            )}
          />
          <span className="flex-1 text-left">Settings</span>
          <span className="text-[10px] text-text-muted">⌘,</span>
        </button>
      </div>
    </div>
  );
};

ContextSidebar.displayName = 'ContextSidebar';
