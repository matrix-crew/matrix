import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import { ConsoleTerminal } from './ConsoleTerminal';
import {
  type ConsoleManagerState,
  type TerminalSession,
  createInitialConsoleState,
  createTerminalSession,
  canCreateTerminal,
  MAX_TERMINALS,
} from '@/types/console';

/**
 * Terminal tab button variants using class-variance-authority
 */
const terminalTabVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  {
    variants: {
      active: {
        true: 'bg-gray-800 text-gray-100 dark:bg-gray-700',
        false:
          'bg-gray-700 text-gray-400 hover:bg-gray-750 hover:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface ConsoleManagerProps extends VariantProps<typeof terminalTabVariants> {
  /** Initial state for the console manager */
  initialState?: ConsoleManagerState;
  /** Callback when state changes */
  onStateChange?: (state: ConsoleManagerState) => void;
  /** Additional CSS classes for the manager container */
  className?: string;
}

/**
 * ConsoleManager component
 *
 * Manages multiple terminal sessions with support for up to 10 concurrent terminals.
 * Provides tabbed interface for switching between terminals and controls for
 * creating/closing terminal sessions.
 *
 * @example
 * <ConsoleManager
 *   onStateChange={(state) => saveToBackend(state)}
 * />
 */
const ConsoleManager: React.FC<ConsoleManagerProps> = ({
  initialState,
  onStateChange,
  className,
}) => {
  const [state, setState] = React.useState<ConsoleManagerState>(() => {
    return initialState ?? createInitialConsoleState();
  });

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: ConsoleManagerState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * Create a new terminal session
   */
  const handleCreateTerminal = React.useCallback(() => {
    if (!canCreateTerminal(state)) return;

    const terminalNumber = state.terminals.length + 1;
    const newTerminal = createTerminalSession(`Terminal ${terminalNumber}`);

    updateState({
      terminals: [...state.terminals, newTerminal],
      activeTerminalId: newTerminal.id,
    });
  }, [state, updateState]);

  /**
   * Close a terminal session
   */
  const handleCloseTerminal = React.useCallback(
    (terminalId: string) => {
      const terminalIndex = state.terminals.findIndex((t) => t.id === terminalId);
      if (terminalIndex === -1) return;

      const updatedTerminals = state.terminals.filter((t) => t.id !== terminalId);

      // Determine new active terminal
      let newActiveId = state.activeTerminalId;
      if (state.activeTerminalId === terminalId) {
        if (updatedTerminals.length === 0) {
          // Create a new terminal if we're closing the last one
          const newTerminal = createTerminalSession('Terminal 1');
          updatedTerminals.push(newTerminal);
          newActiveId = newTerminal.id;
        } else {
          // Select the previous terminal or the first one
          const newIndex = Math.max(0, terminalIndex - 1);
          newActiveId = updatedTerminals[newIndex].id;
        }
      }

      updateState({
        terminals: updatedTerminals,
        activeTerminalId: newActiveId,
      });
    },
    [state, updateState]
  );

  /**
   * Switch to a different terminal
   */
  const handleSwitchTerminal = React.useCallback(
    (terminalId: string) => {
      if (state.activeTerminalId === terminalId) return;

      updateState({
        ...state,
        activeTerminalId: terminalId,
      });
    },
    [state, updateState]
  );

  /**
   * Update a terminal session
   */
  const handleSessionChange = React.useCallback(
    (updatedSession: TerminalSession) => {
      const updatedTerminals = state.terminals.map((t) =>
        t.id === updatedSession.id ? updatedSession : t
      );

      updateState({
        ...state,
        terminals: updatedTerminals,
      });
    },
    [state, updateState]
  );

  /**
   * Get the currently active terminal
   */
  const activeTerminal = React.useMemo(() => {
    return state.terminals.find((t) => t.id === state.activeTerminalId);
  }, [state.terminals, state.activeTerminalId]);

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden', className)}
      role="region"
      aria-label="Console Manager"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-700 bg-gray-800 px-2 py-1.5 dark:border-gray-800 dark:bg-gray-900">
        {/* Terminal tabs */}
        <div
          className="flex flex-1 items-center gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Terminal sessions"
        >
          {state.terminals.map((terminal) => (
            <div
              key={terminal.id}
              className={cn(
                'group flex items-center rounded-t-md',
                terminalTabVariants({ active: terminal.id === state.activeTerminalId })
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={terminal.id === state.activeTerminalId}
                aria-controls={`terminal-panel-${terminal.id}`}
                id={`terminal-tab-${terminal.id}`}
                onClick={() => handleSwitchTerminal(terminal.id)}
                className="truncate focus:outline-none"
              >
                {terminal.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTerminal(terminal.id);
                }}
                className="ml-1 rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-600 hover:text-gray-200"
                aria-label={`Close ${terminal.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add terminal button */}
        <button
          type="button"
          onClick={handleCreateTerminal}
          disabled={!canCreateTerminal(state)}
          className={cn(
            'rounded p-1.5 text-gray-400 transition-colors',
            canCreateTerminal(state)
              ? 'hover:bg-gray-700 hover:text-gray-200'
              : 'cursor-not-allowed opacity-50'
          )}
          aria-label="Create new terminal"
          title={
            canCreateTerminal(state) ? 'New terminal' : `Maximum ${MAX_TERMINALS} terminals reached`
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
          </svg>
        </button>

        {/* Terminal count indicator */}
        <span className="ml-2 text-xs text-gray-500">
          {state.terminals.length}/{MAX_TERMINALS}
        </span>
      </div>

      {/* Terminal panel */}
      <div className="flex-1 overflow-hidden">
        {activeTerminal && (
          <div
            id={`terminal-panel-${activeTerminal.id}`}
            role="tabpanel"
            aria-labelledby={`terminal-tab-${activeTerminal.id}`}
            className="h-full"
          >
            <ConsoleTerminal
              session={activeTerminal}
              onSessionChange={handleSessionChange}
              isActive={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

ConsoleManager.displayName = 'ConsoleManager';

export { ConsoleManager, terminalTabVariants };
