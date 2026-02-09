import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  type TerminalSession,
  type TerminalOutputLine,
  createOutputLine,
  createTerminalCommand,
} from '@/types/console';

/**
 * Output line variants using class-variance-authority
 *
 * Defines visual styles for different types of terminal output.
 */
const outputLineVariants = cva('font-mono text-sm leading-relaxed', {
  variants: {
    type: {
      stdout: 'text-gray-200',
      stderr: 'text-red-400',
      system: 'text-blue-400 italic',
      input: 'text-green-400',
    },
  },
  defaultVariants: {
    type: 'stdout',
  },
});

export interface ConsoleTerminalProps extends VariantProps<typeof outputLineVariants> {
  /** The terminal session to display */
  session: TerminalSession;
  /** Callback when the terminal state changes */
  onSessionChange: (session: TerminalSession) => void;
  /** Whether this terminal is currently active */
  isActive?: boolean;
  /** Additional CSS classes for the terminal container */
  className?: string;
}

/**
 * ConsoleTerminal component
 *
 * Renders a single terminal session with command input and output display.
 * Supports command history navigation using up/down arrow keys.
 *
 * @example
 * <ConsoleTerminal
 *   session={terminalSession}
 *   onSessionChange={(updated) => updateSession(updated)}
 *   isActive={true}
 * />
 */
const ConsoleTerminal: React.FC<ConsoleTerminalProps> = ({
  session,
  onSessionChange,
  isActive = true,
  className,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const outputRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  /**
   * Auto-scroll to bottom when new output is added
   */
  React.useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [session.output]);

  /**
   * Focus input when terminal becomes active
   */
  React.useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  /**
   * Handle command submission
   */
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedInput = inputValue.trim();
      if (!trimmedInput) return;

      // Create command entry
      const command = createTerminalCommand(trimmedInput);

      // Create output lines for the input echo and simulated response
      const inputEcho = createOutputLine(`$ ${trimmedInput}`, 'input');
      const responseOutput = createOutputLine(
        `Command received: "${trimmedInput}" (Agent integration pending)`,
        'system'
      );

      // Update session state
      const updatedSession: TerminalSession = {
        ...session,
        output: [...session.output, inputEcho, responseOutput],
        commandHistory: [...session.commandHistory, command],
        historyIndex: -1,
        lastActivityAt: new Date(),
      };

      onSessionChange(updatedSession);
      setInputValue('');
    },
    [inputValue, session, onSessionChange]
  );

  /**
   * Handle keyboard navigation through command history
   */
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { commandHistory, historyIndex } = session;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length === 0) return;

        const newIndex =
          historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);

        const command = commandHistory[newIndex];
        setInputValue(command.command);

        onSessionChange({
          ...session,
          historyIndex: newIndex,
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex === -1) return;

        const newIndex = historyIndex + 1;

        if (newIndex >= commandHistory.length) {
          setInputValue('');
          onSessionChange({
            ...session,
            historyIndex: -1,
          });
        } else {
          const command = commandHistory[newIndex];
          setInputValue(command.command);
          onSessionChange({
            ...session,
            historyIndex: newIndex,
          });
        }
      }
    },
    [session, onSessionChange]
  );

  /**
   * Handle clear command
   */
  const handleClear = React.useCallback(() => {
    const clearedSession: TerminalSession = {
      ...session,
      output: [createOutputLine('Terminal cleared.', 'system')],
      lastActivityAt: new Date(),
    };
    onSessionChange(clearedSession);
  }, [session, onSessionChange]);

  /**
   * Render a single output line
   */
  const renderOutputLine = (line: TerminalOutputLine) => (
    <div key={line.id} className={cn(outputLineVariants({ type: line.type }))}>
      <span className="mr-2 text-gray-600 dark:text-gray-500">
        {line.timestamp.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="whitespace-pre-wrap break-all">{line.content}</span>
    </div>
  );

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg bg-gray-900 dark:bg-gray-950',
        className
      )}
      role="region"
      aria-label={`Terminal: ${session.name}`}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              session.status === 'running' && 'bg-yellow-500',
              session.status === 'idle' && 'bg-green-500',
              session.status === 'error' && 'bg-red-500',
              session.status === 'closed' && 'bg-gray-500'
            )}
            aria-label={`Status: ${session.status}`}
          />
          <span className="text-sm font-medium text-gray-200">{session.name}</span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
          aria-label="Clear terminal"
        >
          Clear
        </button>
      </div>

      {/* Terminal output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {session.output.map(renderOutputLine)}
      </div>

      {/* Command input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 dark:border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-mono text-sm text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-mono text-sm text-gray-200 placeholder-gray-500 outline-none"
            placeholder="Enter command..."
            aria-label="Command input"
            disabled={session.status === 'closed'}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </form>
    </div>
  );
};

ConsoleTerminal.displayName = 'ConsoleTerminal';

export { ConsoleTerminal, outputLineVariants };
