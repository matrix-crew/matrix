/**
 * IPC Type Definitions for Electron-Python Communication
 *
 * This module defines TypeScript types for type-safe IPC communication
 * between the Electron frontend and Python backend.
 */

import type {
  Matrix,
  Source,
  MatrixCreateData,
  MatrixIdData,
  MatrixUpdateData,
  SourceCreateData,
  SourceIdData,
  MatrixSourceData,
} from "./matrix";

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

// ============================================================================
// Matrix CRUD Messages
// ============================================================================

/**
 * Message to create a new Matrix
 */
export interface MatrixCreateMessage extends IPCMessage<MatrixCreateData> {
  type: "matrix-create";
  data: MatrixCreateData;
}

/**
 * Response for matrix-create message
 */
export interface MatrixCreateResponse extends IPCResponse<{ matrix: Matrix }> {
  success: true;
  data: {
    matrix: Matrix;
  };
}

/**
 * Message to list all Matrices
 */
export interface MatrixListMessage extends IPCMessage {
  type: "matrix-list";
}

/**
 * Response for matrix-list message
 */
export interface MatrixListResponse extends IPCResponse<{ matrices: Matrix[] }> {
  success: true;
  data: {
    matrices: Matrix[];
  };
}

/**
 * Message to get a single Matrix by ID
 */
export interface MatrixGetMessage extends IPCMessage<MatrixIdData> {
  type: "matrix-get";
  data: MatrixIdData;
}

/**
 * Response for matrix-get message
 */
export interface MatrixGetResponse extends IPCResponse<{ matrix: Matrix }> {
  success: true;
  data: {
    matrix: Matrix;
  };
}

/**
 * Message to update an existing Matrix
 */
export interface MatrixUpdateMessage extends IPCMessage<MatrixUpdateData> {
  type: "matrix-update";
  data: MatrixUpdateData;
}

/**
 * Response for matrix-update message
 */
export interface MatrixUpdateResponse extends IPCResponse<{ matrix: Matrix }> {
  success: true;
  data: {
    matrix: Matrix;
  };
}

/**
 * Message to delete a Matrix
 */
export interface MatrixDeleteMessage extends IPCMessage<MatrixIdData> {
  type: "matrix-delete";
  data: MatrixIdData;
}

/**
 * Response for matrix-delete message
 */
export interface MatrixDeleteResponse extends IPCResponse<{ deleted: true }> {
  success: true;
  data: {
    deleted: true;
  };
}

// ============================================================================
// Source CRUD Messages
// ============================================================================

/**
 * Message to create a new Source
 */
export interface SourceCreateMessage extends IPCMessage<SourceCreateData> {
  type: "source-create";
  data: SourceCreateData;
}

/**
 * Response for source-create message
 */
export interface SourceCreateResponse extends IPCResponse<{ source: Source }> {
  success: true;
  data: {
    source: Source;
  };
}

/**
 * Message to list all Sources
 */
export interface SourceListMessage extends IPCMessage {
  type: "source-list";
}

/**
 * Response for source-list message
 */
export interface SourceListResponse extends IPCResponse<{ sources: Source[] }> {
  success: true;
  data: {
    sources: Source[];
  };
}

/**
 * Message to get a single Source by ID
 */
export interface SourceGetMessage extends IPCMessage<SourceIdData> {
  type: "source-get";
  data: SourceIdData;
}

/**
 * Response for source-get message
 */
export interface SourceGetResponse extends IPCResponse<{ source: Source }> {
  success: true;
  data: {
    source: Source;
  };
}

// ============================================================================
// Matrix-Source Relationship Messages
// ============================================================================

/**
 * Message to add a Source to a Matrix
 */
export interface MatrixAddSourceMessage extends IPCMessage<MatrixSourceData> {
  type: "matrix-add-source";
  data: MatrixSourceData;
}

/**
 * Response for matrix-add-source message
 */
export interface MatrixAddSourceResponse extends IPCResponse<{ matrix: Matrix }> {
  success: true;
  data: {
    matrix: Matrix;
  };
}

/**
 * Message to remove a Source from a Matrix
 */
export interface MatrixRemoveSourceMessage extends IPCMessage<MatrixSourceData> {
  type: "matrix-remove-source";
  data: MatrixSourceData;
}

/**
 * Response for matrix-remove-source message
 */
export interface MatrixRemoveSourceResponse extends IPCResponse<{ matrix: Matrix }> {
  success: true;
  data: {
    matrix: Matrix;
  };
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * Union type of all possible IPC message types
 */
export type IPCMessageTypes =
  | PingMessage
  | MatrixCreateMessage
  | MatrixListMessage
  | MatrixGetMessage
  | MatrixUpdateMessage
  | MatrixDeleteMessage
  | SourceCreateMessage
  | SourceListMessage
  | SourceGetMessage
  | MatrixAddSourceMessage
  | MatrixRemoveSourceMessage;

/**
 * Union type of all possible IPC response types
 */
export type IPCResponseTypes =
  | PongResponse
  | MatrixCreateResponse
  | MatrixListResponse
  | MatrixGetResponse
  | MatrixUpdateResponse
  | MatrixDeleteResponse
  | SourceCreateResponse
  | SourceListResponse
  | SourceGetResponse
  | MatrixAddSourceResponse
  | MatrixRemoveSourceResponse;
