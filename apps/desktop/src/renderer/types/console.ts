/**
 * Console Terminal Type Definitions
 *
 * Type definitions for the Console terminal feature in the Agent tab.
 * Supports up to 10 concurrent terminal sessions for direct agent control.
 */

/**
 * Maximum number of concurrent terminals allowed
 */
export const MAX_TERMINALS = 10;

/**
 * Terminal status states
 */
export type TerminalStatus = 'idle' | 'running' | 'error' | 'closed';

/**
 * Terminal output line type
 */
export type OutputLineType = 'stdout' | 'stderr' | 'system' | 'input';

/**
 * Represents a single line of terminal output
 */
export interface TerminalOutputLine {
  /** Unique identifier for the output line */
  id: string;
  /** The text content of the output */
  content: string;
  /** Type of output (stdout, stderr, system message, or echoed input) */
  type: OutputLineType;
  /** Timestamp when the output was received */
  timestamp: Date;
}

/**
 * Represents a terminal command in history
 */
export interface TerminalCommand {
  /** Unique identifier for the command */
  id: string;
  /** The command text that was executed */
  command: string;
  /** Timestamp when the command was executed */
  executedAt: Date;
  /** Exit code if the command has completed */
  exitCode?: number;
}

/**
 * Represents a single terminal session
 */
export interface TerminalSession {
  /** Unique identifier for the terminal session */
  id: string;
  /** Display name for the terminal tab */
  name: string;
  /** Current status of the terminal */
  status: TerminalStatus;
  /** Output lines displayed in the terminal */
  output: TerminalOutputLine[];
  /** Command history for this terminal */
  commandHistory: TerminalCommand[];
  /** Current command history navigation index (-1 means not navigating) */
  historyIndex: number;
  /** Current working directory */
  cwd?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivityAt: Date;
}

/**
 * Represents the overall console manager state
 */
export interface ConsoleManagerState {
  /** All active terminal sessions */
  terminals: TerminalSession[];
  /** ID of the currently active terminal */
  activeTerminalId: string | null;
}

/**
 * Create a new terminal output line
 *
 * @param content - The text content of the output
 * @param type - Type of output line
 * @returns A new TerminalOutputLine object
 */
export function createOutputLine(
  content: string,
  type: OutputLineType = 'stdout'
): TerminalOutputLine {
  return {
    id: crypto.randomUUID(),
    content,
    type,
    timestamp: new Date(),
  };
}

/**
 * Create a new terminal command entry
 *
 * @param command - The command text
 * @returns A new TerminalCommand object
 */
export function createTerminalCommand(command: string): TerminalCommand {
  return {
    id: crypto.randomUUID(),
    command,
    executedAt: new Date(),
  };
}

/**
 * Create a new terminal session
 *
 * @param name - Display name for the terminal
 * @param cwd - Optional initial working directory
 * @returns A new TerminalSession object
 */
export function createTerminalSession(name?: string, cwd?: string): TerminalSession {
  const now = new Date();
  const id = crypto.randomUUID();

  return {
    id,
    name: name ?? `Terminal ${id.slice(0, 4)}`,
    status: 'idle',
    output: [
      createOutputLine(
        'Terminal session started. Type commands to interact with agents.',
        'system'
      ),
    ],
    commandHistory: [],
    historyIndex: -1,
    cwd,
    createdAt: now,
    lastActivityAt: now,
  };
}

/**
 * Create initial console manager state
 *
 * @returns Initial ConsoleManagerState with one terminal
 */
export function createInitialConsoleState(): ConsoleManagerState {
  const initialTerminal = createTerminalSession('Terminal 1');

  return {
    terminals: [initialTerminal],
    activeTerminalId: initialTerminal.id,
  };
}

/**
 * Check if more terminals can be created
 *
 * @param state - Current console manager state
 * @returns True if more terminals can be added
 */
export function canCreateTerminal(state: ConsoleManagerState): boolean {
  return state.terminals.length < MAX_TERMINALS;
}
