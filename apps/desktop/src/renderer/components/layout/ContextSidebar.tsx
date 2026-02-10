import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, LayoutDashboard, GitBranch, Terminal, Zap } from 'lucide-react';
import { useShortcuts } from '@/contexts/ShortcutProvider';
import type { ShortcutActionId } from '@shared/types/shortcuts';

export type ContextItemId = 'sources' | 'kanban' | 'pipeline' | 'console' | 'mcp';

interface SidebarItem {
  id: ContextItemId;
  label: string;
  icon: React.ReactNode;
  actionId: ShortcutActionId;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      {
        id: 'sources',
        label: 'Sources',
        icon: <FolderOpen className="size-4" />,
        actionId: 'context-sources',
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
        actionId: 'context-kanban',
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        icon: <GitBranch className="size-4" />,
        actionId: 'context-pipeline',
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
        actionId: 'context-console',
      },
      {
        id: 'mcp',
        label: 'MCP',
        icon: <Zap className="size-4" />,
        actionId: 'context-mcp',
      },
    ],
  },
];

const MIN_WIDTH = 160;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 220;

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
  const { getDisplayString } = useShortcuts();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !sidebarRef.current) return;
      const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX - sidebarLeft));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      style={{ width }}
      className={cn(
        'relative flex flex-shrink-0 flex-col border-r border-border-default bg-base-800',
        className
      )}
    >
      {/* Scrollable sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <h3 className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const isActive = item.id === activeItem;
              const shortcut = getDisplayString(item.actionId);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemSelect(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-accent-lime/10 text-accent-lime'
                      : 'text-text-secondary hover:bg-base-700 hover:text-text-primary'
                  )}
                >
                  <span className={cn(isActive ? 'text-accent-lime' : 'text-text-muted')}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {shortcut && <span className="text-[11px] text-text-muted">{shortcut}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-accent-primary/30 active:bg-accent-primary/50"
      />
    </div>
  );
};

ContextSidebar.displayName = 'ContextSidebar';
