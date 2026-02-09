/**
 * TerminalToolbar Component
 *
 * Displays session metadata and action buttons above a terminal instance.
 * Shows shell name, status indicator, and provides clear/close actions.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { TerminalSessionInfo } from '@shared/types/terminal';

export interface TerminalToolbarProps {
  /** Terminal session metadata */
  session: TerminalSessionInfo;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toolbar showing terminal session info and actions
 */
const TerminalToolbar: React.FC<TerminalToolbarProps> = ({ session, className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border-default bg-base-800 px-3 py-1.5',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {/* Status indicator */}
        <div
          className={cn(
            'size-2 rounded-full',
            session.status === 'active' && 'bg-green-500',
            session.status === 'exited' && 'bg-gray-500',
            session.status === 'error' && 'bg-red-500'
          )}
          aria-label={`Status: ${session.status}`}
        />
        {/* Shell name */}
        <span className="text-xs font-medium text-text-secondary">
          {session.shell || session.name}
        </span>
        {/* CWD */}
        {session.cwd && (
          <>
            <span className="text-xs text-text-muted">-</span>
            <span className="max-w-[200px] truncate text-xs text-text-muted">{session.cwd}</span>
          </>
        )}
      </div>
      {/* PID */}
      {session.pid && <span className="text-[10px] text-text-muted">PID {session.pid}</span>}
    </div>
  );
};

TerminalToolbar.displayName = 'TerminalToolbar';

export { TerminalToolbar };
