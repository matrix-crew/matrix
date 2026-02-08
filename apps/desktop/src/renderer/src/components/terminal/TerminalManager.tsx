/**
 * TerminalManager Component
 *
 * Container component managing multiple terminal sessions.
 * Provides tabbed interface for switching between terminals,
 * shell selection for creating new sessions, and session lifecycle management.
 *
 * Replaces the previous mock ConsoleManager with real PTY-backed terminals.
 */

import * as React from 'react';
import { cn } from '@maxtix/ui';
import { Plus, X } from 'lucide-react';
import type { TerminalSessionInfo } from '@maxtix/shared';
import { terminalService, MAX_TERMINAL_SESSIONS } from '@/services/TerminalService';
import { TerminalInstance } from './TerminalInstance';
import { TerminalToolbar } from './TerminalToolbar';
import { ToolSelectionModal } from './ToolSelectionModal';

export interface TerminalManagerProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Multi-session terminal manager with tabbed UI
 */
const TerminalManager: React.FC<TerminalManagerProps> = ({ className }) => {
  const [sessions, setSessions] = React.useState<TerminalSessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const mountedRef = React.useRef(true);

  /**
   * Initialize terminal service on mount, cleanup all sessions on unmount
   */
  React.useEffect(() => {
    mountedRef.current = true;
    terminalService.initialize();
    return () => {
      mountedRef.current = false;
      // Use service's tracking instead of stale closure over sessions state
      for (const session of terminalService.getAllSessions()) {
        terminalService.closeTerminal(session.id);
      }
      terminalService.destroy();
    };
  }, []);

  /**
   * Handle creating a new terminal session
   */
  const handleCreateTerminal = React.useCallback(
    async (selection: { shell: string; name: string; cwd?: string }) => {
      try {
        console.log('[TerminalManager] Creating terminal with:', selection);
        const sessionNumber = sessions.length + 1;
        const session = await terminalService.createTerminal({
          name: `${selection.name} ${sessionNumber}`,
          shell: selection.shell,
          cwd: selection.cwd,
        });
        console.log('[TerminalManager] Session created:', session);

        // Guard against unmount during async creation
        if (!mountedRef.current) {
          terminalService.closeTerminal(session.id);
          return;
        }

        setSessions((prev) => [...prev, session]);
        setActiveSessionId(session.id);
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

  /**
   * Handle closing a terminal session
   */
  const handleCloseSession = React.useCallback(
    (sessionId: string) => {
      terminalService.closeTerminal(sessionId);

      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== sessionId);

        // If closing the active session, select adjacent
        if (activeSessionId === sessionId) {
          const closedIndex = prev.findIndex((s) => s.id === sessionId);
          const nextSession = updated[Math.min(closedIndex, updated.length - 1)];
          setActiveSessionId(nextSession?.id ?? null);
        }

        return updated;
      });
    },
    [activeSessionId]
  );

  /**
   * Handle terminal exit (PTY process ended)
   */
  const handleTerminalExit = React.useCallback((sessionId: string, exitCode: number) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'exited' as const, exitCode } : s))
    );
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const canCreate = sessions.length < MAX_TERMINAL_SESSIONS;

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden', className)}
      role="region"
      aria-label="Terminal Manager"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border-default bg-base-800 px-2 py-1.5">
        {/* Session tabs */}
        <div
          className="flex flex-1 items-center gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Terminal sessions"
        >
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                'group flex items-center rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors',
                session.id === activeSessionId
                  ? 'bg-base-700 text-text-primary'
                  : 'text-text-muted hover:bg-base-700/50 hover:text-text-secondary'
              )}
            >
              {/* Status dot */}
              <div
                className={cn(
                  'mr-1.5 size-1.5 rounded-full',
                  session.status === 'active' && 'bg-green-500',
                  session.status === 'exited' && 'bg-gray-500',
                  session.status === 'error' && 'bg-red-500'
                )}
              />
              <button
                type="button"
                role="tab"
                aria-selected={session.id === activeSessionId}
                aria-controls={`terminal-panel-${session.id}`}
                id={`terminal-tab-${session.id}`}
                onClick={() => setActiveSessionId(session.id)}
                className="max-w-[140px] truncate focus:outline-none"
              >
                {session.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseSession(session.id);
                }}
                className="ml-1.5 rounded p-0.5 text-text-muted opacity-0 transition-all hover:bg-base-600 hover:text-text-primary group-hover:opacity-100"
                aria-label={`Close ${session.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add terminal button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={!canCreate}
          className={cn(
            'rounded p-1.5 transition-colors',
            canCreate
              ? 'text-text-muted hover:bg-base-700 hover:text-text-primary'
              : 'cursor-not-allowed text-text-muted opacity-40'
          )}
          aria-label="Create new terminal"
          title={canCreate ? 'New terminal' : `Maximum ${MAX_TERMINAL_SESSIONS} terminals reached`}
        >
          <Plus className="size-4" />
        </button>

        {/* Session count */}
        {sessions.length > 0 && (
          <span className="ml-1 text-[10px] text-text-muted">
            {sessions.length}/{MAX_TERMINAL_SESSIONS}
          </span>
        )}
      </div>

      {/* Terminal panel */}
      <div className="flex-1 overflow-hidden">
        {activeSession ? (
          <div
            id={`terminal-panel-${activeSession.id}`}
            role="tabpanel"
            aria-labelledby={`terminal-tab-${activeSession.id}`}
            className="flex h-full flex-col"
          >
            <TerminalToolbar session={activeSession} />
            <div className="flex-1 overflow-hidden">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn('h-full', session.id !== activeSessionId && 'hidden')}
                >
                  <TerminalInstance
                    sessionId={session.id}
                    isActive={session.id === activeSessionId}
                    onExit={(exitCode) => handleTerminalExit(session.id, exitCode)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty state */
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

      {/* Shell selection modal */}
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
