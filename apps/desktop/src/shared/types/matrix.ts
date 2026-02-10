/**
 * Matrix and Source Type Definitions
 *
 * This module defines TypeScript interfaces for Matrix and Source entities
 * that are used across the Electron frontend and Python backend.
 */

/**
 * Source type discriminator: local directory or cloned remote repository
 */
export type SourceType = 'local' | 'remote';

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
  /** Absolute path to the matrix workspace folder */
  workspace_path: string;
  /** ISO 8601 timestamp of when the Matrix was created */
  created_at: string;
  /** ISO 8601 timestamp of when the Matrix was last modified */
  updated_at: string;
}

/**
 * A Source represents a local directory or cloned git repository.
 *
 * Sources can be either:
 * - local: Existing directory symlinked into matrix workspace
 * - remote: Git repository cloned to ~/.matrix/repositories/ and symlinked
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
  /** Source type: "local" or "remote" */
  source_type: SourceType;
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
 * Data for creating a new Source (generic, backward-compatible)
 */
export interface SourceCreateData {
  /** Human-readable name for the repository */
  name: string;
  /** Absolute filesystem path to the repository */
  path: string;
  /** Optional remote URL for the repository */
  url?: string;
  /** Source type */
  source_type?: SourceType;
}

/**
 * Data for creating a local source (directory picker)
 */
export interface LocalSourceCreateData {
  /** Human-readable name for the directory */
  name: string;
  /** Absolute filesystem path to the directory */
  path: string;
  /** Source type discriminator */
  source_type: 'local';
  /** Optional git remote URL */
  url?: string;
}

/**
 * Data for creating a remote source (git clone)
 */
export interface RemoteSourceCreateData {
  /** Human-readable name for the repository */
  name: string;
  /** Git clone URL (required) */
  url: string;
  /** Source type discriminator */
  source_type: 'remote';
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
