/**
 * Shared Types and Utilities for Maxtix Monorepo
 *
 * This package provides shared TypeScript types and utilities used across
 * the Maxtix monorepo, including IPC message definitions and common interfaces.
 */

// Export all IPC types
export type {
  IPCMessage,
  IPCResponse,
  PingMessage,
  PongResponse,
  IPCMessageTypes,
  IPCResponseTypes,
} from './types/ipc';

// Export all Matrix and Source types
export type {
  Matrix,
  Source,
  MatrixCreateData,
  MatrixIdData,
  MatrixUpdateData,
  SourceCreateData,
  SourceIdData,
  MatrixSourceData,
} from './types/matrix';

// Export terminal types
export type {
  TerminalConfig,
  TerminalCreateOptions,
  TerminalCreateResult,
  TerminalSessionStatus,
  TerminalSessionInfo,
  DetectedShell,
} from './types/terminal';

// Export xterm.js theme
export { matrixXtermTheme, matrixXtermOptions } from './theme/xterm-theme';
