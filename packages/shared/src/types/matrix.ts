/**
 * Matrix and Source Type Definitions
 *
 * This module defines TypeScript interfaces for Matrix and Source entities
 * that are used across the Electron frontend and Python backend.
 */

/**
 * A Matrix represents a collection of Sources.
 *
 * Matrices allow users to organize related git repositories into logical
 * groups. Each Matrix maintains references to its Sources via their IDs.
 */
export interface Matrix {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Human-readable matrix name */
  name: string;
  /** List of Source UUIDs contained in this Matrix */
  source_ids: string[];
  /** ISO 8601 timestamp of when the Matrix was created */
  created_at: string;
  /** ISO 8601 timestamp of when the Matrix was last modified */
  updated_at: string;
}

/**
 * A Source represents a git repository reference.
 *
 * Sources are the fundamental units that can be organized into Matrices.
 * Each Source tracks a repository's location (path) and optional remote URL.
 */
export interface Source {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Human-readable repository name */
  name: string;
  /** Absolute filesystem path to the repository */
  path: string;
  /** Optional remote URL (e.g., GitHub URL) */
  url: string | null;
  /** ISO 8601 timestamp of when the Source was created */
  created_at: string;
}

/**
 * Data for creating a new Matrix
 */
export interface MatrixCreateData {
  /** Human-readable name for the matrix */
  name: string;
}

/**
 * Data for getting or deleting a Matrix by ID
 */
export interface MatrixIdData {
  /** Matrix UUID */
  id: string;
}

/**
 * Data for updating a Matrix
 */
export interface MatrixUpdateData {
  /** Matrix UUID */
  id: string;
  /** New name for the matrix (optional) */
  name?: string;
}

/**
 * Data for creating a new Source
 */
export interface SourceCreateData {
  /** Human-readable name for the repository */
  name: string;
  /** Absolute filesystem path to the repository */
  path: string;
  /** Optional remote URL for the repository */
  url?: string;
}

/**
 * Data for getting a Source by ID
 */
export interface SourceIdData {
  /** Source UUID */
  id: string;
}

/**
 * Data for adding or removing a Source from a Matrix
 */
export interface MatrixSourceData {
  /** Matrix UUID */
  matrixId: string;
  /** Source UUID */
  sourceId: string;
}
