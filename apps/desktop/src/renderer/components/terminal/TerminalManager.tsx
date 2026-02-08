/**
 * TerminalManager Component
 *
 * Container component managing multiple terminal sessions in a dynamic grid.
 * One terminal fills the entire space. Additional terminals split into
 * a gap-free layout where each row can hold a different number of items.
 *
 * Row distribution (top-heavy, no empty cells):
 *   1  → [1]          5  → [3,2]        9  → [3,3,3]
 *   2  → [2]          6  → [3,3]        10 → [4,3,3]
 *   3  → [2,1]        7  → [3,2,2]      11 → [4,4,3]
 *   4  → [2,2]        8  → [3,3,2]      12 → [4,4,4]
 */

import * as React from 'react';
import { cn } from '@maxtix/ui';
import { Plus, X, Maximize2, Minimize2 } from 'lucide-react';
import type { TerminalSessionInfo } from '@maxtix/shared';
import { terminalService, MAX_TERMINAL_SESSIONS } from '@/services/TerminalService';
import { TerminalInstance } from './TerminalInstance';
import { ToolSelectionModal } from './ToolSelectionModal';

export interface TerminalManagerProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compute how many terminals go in each row.
 * Top rows get more items so there are never empty cells.
 *
 *  count=3  → [2, 1]     count=7  → [3, 2, 2]
 *  count=5  → [3, 2]     count=10 → [4, 3, 3]
 *  count=11 → [4, 4, 3]
 */
function getRowDistribution(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count === 2) return [2];

  let numRows: number;
  if (count <= 4) numRows = 2;
  else if (count <= 6) numRows = 2;
  else if (count <= 9) numRows = 3;
  else numRows = 3;

  const base = Math.floor(count / numRows);
  const remainder = count % numRows;

  const rows: number[] = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(i < remainder ? base + 1 : base);
  }
  return rows;
}

/**
 * Multi-session terminal manager with dynamic grid layout
 */
const TerminalManager: React.FC<TerminalManagerProps> = ({ className }) => {
  const [sessions, setSessions] = React.useState<TerminalSessionInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [focusedSessionId, setFocusedSessionId] = React.useState<string | null>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    terminalService.initialize();
    return () => {
      mountedRef.current = false;
      for (const session of terminalService.getAllSessions()) {
        terminalService.closeTerminal(session.id);
      }
      terminalService.destroy();
    };
  }, []);

  const handleCreateTerminal = React.useCallback(
    async (selection: { shell: string; name: string; cwd?: string }) => {
      try {
        const sessionNumber = sessions.length + 1;
        const session = await terminalService.createTerminal({
          name: `${selection.name} ${sessionNumber}`,
          shell: selection.shell,
          cwd: selection.cwd,
        });

        if (!mountedRef.current) {
          terminalService.closeTerminal(session.id);
          return;
        }

        setSessions((prev) => [...prev, session]);
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to create terminal:', error);
        if (mountedRef.current) {
          setIsModalOpen(false);
        }
      }
    },
    [sessions.length]
  );

  const handleCloseSession = React.useCallback(
    (sessionId: string) => {
      terminalService.closeTerminal(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (focusedSessionId === sessionId) {
        setFocusedSessionId(null);
      }
    },
    [focusedSessionId]
  );

  const handleTerminalExit = React.useCallback((sessionId: string, exitCode: number) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'exited' as const, exitCode } : s))
    );
  }, []);

  const toggleFocus = React.useCallback((sessionId: string) => {
    setFocusedSessionId((prev) => (prev === sessionId ? null : sessionId));
  }, []);

  const canCreate = sessions.length < MAX_TERMINAL_SESSIONS;

  const visibleSessions = focusedSessionId
    ? sessions.filter((s) => s.id === focusedSessionId)
    : sessions;

  // Split sessions into rows
  const rowDist = getRowDistribution(visibleSessions.length);
  const sessionRows: TerminalSessionInfo[][] = [];
  let idx = 0;
  for (const itemCount of rowDist) {
    sessionRows.push(visibleSessions.slice(idx, idx + itemCount));
    idx += itemCount;
  }

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden', className)}
      role="region"
      aria-label="Terminal Manager"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border-default bg-base-800 px-3 py-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Terminals
          </span>
          {sessions.length > 0 && (
            <span className="rounded-full bg-base-600 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-text-secondary">
              {sessions.length}/{MAX_TERMINAL_SESSIONS}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {focusedSessionId && (
            <button
              type="button"
              onClick={() => setFocusedSessionId(null)}
              className="rounded p-1 text-text-muted transition-colors hover:bg-base-700 hover:text-text-primary"
              aria-label="Exit fullscreen"
              title="Show all terminals"
            >
              <Minimize2 className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={!canCreate}
            className={cn(
              'rounded p-1 transition-colors',
              canCreate
                ? 'text-text-muted hover:bg-base-700 hover:text-accent-lime'
                : 'cursor-not-allowed text-text-muted opacity-40'
            )}
            aria-label="Create new terminal"
            title={
              canCreate ? 'New terminal' : `Maximum ${MAX_TERMINAL_SESSIONS} terminals reached`
            }
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal grid */}
      <div className="flex-1 overflow-hidden">
        {sessions.length > 0 ? (
          <div
            className="flex h-full flex-col"
            style={{ gap: '1px', backgroundColor: 'var(--color-border-default)' }}
          >
            {sessionRows.map((rowSessions, rowIndex) => (
              <div key={rowIndex} className="flex min-h-0 flex-1" style={{ gap: '1px' }}>
                {rowSessions.map((session) => (
                  <div
                    key={session.id}
                    className="group/cell flex min-w-0 flex-1 flex-col overflow-hidden bg-base-900"
                  >
                    {/* Cell header */}
                    <div className="flex items-center justify-between bg-base-800/80 px-2 py-0.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div
                          className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            session.status === 'active' && 'bg-green-500',
                            session.status === 'exited' && 'bg-gray-500',
                            session.status === 'error' && 'bg-red-500'
                          )}
                        />
                        <span className="truncate text-[11px] font-medium text-text-secondary">
                          {session.name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/cell:opacity-100">
                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleFocus(session.id)}
                            className="rounded p-0.5 text-text-muted transition-colors hover:bg-base-600 hover:text-text-primary"
                            aria-label={
                              focusedSessionId === session.id
                                ? 'Exit fullscreen'
                                : 'Fullscreen this terminal'
                            }
                            title={
                              focusedSessionId === session.id ? 'Exit fullscreen' : 'Fullscreen'
                            }
                          >
                            {focusedSessionId === session.id ? (
                              <Minimize2 className="size-3" />
                            ) : (
                              <Maximize2 className="size-3" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCloseSession(session.id)}
                          className="rounded p-0.5 text-text-muted transition-colors hover:bg-red-500/20 hover:text-red-400"
                          aria-label={`Close ${session.name}`}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </div>

                    {/* Terminal content */}
                    <div className="flex-1 overflow-hidden">
                      <TerminalInstance
                        sessionId={session.id}
                        isActive={true}
                        onExit={(exitCode) => handleTerminalExit(session.id, exitCode)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="rounded-full bg-base-700 p-3">
              <Plus className="size-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No terminal sessions</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-md bg-accent-lime px-4 py-1.5 text-xs font-medium text-base-900 transition-colors hover:bg-accent-lime/90"
            >
              Create Terminal
            </button>
          </div>
        )}
      </div>

      <ToolSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreateTerminal}
      />
    </div>
  );
};

TerminalManager.displayName = 'TerminalManager';

export { TerminalManager };
