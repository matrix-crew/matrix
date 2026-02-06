/**
 * IPC Type Definitions for Electron-Python Communication
 *
 * This module defines TypeScript types for type-safe IPC communication
 * between the Electron frontend and Python backend.
 */

/**
 * Base structure for all IPC messages sent from frontend to backend
 */
export interface IPCMessage<T = unknown> {
  /** Message type identifier for routing */
  type: string;
  /** Optional payload data specific to the message type */
  data?: T;
}

/**
 * Base structure for all IPC responses sent from backend to frontend
 */
export interface IPCResponse<T = unknown> {
  /** Indicates whether the operation was successful */
  success: boolean;
  /** Response data when operation succeeds */
  data?: T;
  /** Error message when operation fails */
  error?: string;
}

/**
 * Ping message for testing IPC connectivity
 */
export interface PingMessage extends IPCMessage {
  type: "ping";
}

/**
 * Pong response for ping message
 */
export interface PongResponse extends IPCResponse<{ message: string }> {
  success: true;
  data: {
    message: "pong";
  };
}

/**
 * Union type of all possible IPC message types
 */
export type IPCMessageTypes = PingMessage;

/**
 * Union type of all possible IPC response types
 */
export type IPCResponseTypes = PongResponse;
