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
} from "./types/ipc";
