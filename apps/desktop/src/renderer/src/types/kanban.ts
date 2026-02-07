/**
 * Kanban Board Type Definitions
 *
 * Type definitions for the Kanban task management board feature.
 * Supports columns with cards representing work items moving through completion stages.
 */

/**
 * Default column identifiers for the Kanban board
 */
export type KanbanColumnId = 'todo' | 'in-progress' | 'review' | 'done';

/**
 * Priority levels for Kanban cards
 */
export type KanbanCardPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Represents a single Kanban card (work item)
 */
export interface KanbanCard {
  /** Unique identifier for the card */
  id: string;
  /** Card title displayed as the main text */
  title: string;
  /** Optional detailed description of the task */
  description?: string;
  /** Column ID where the card currently resides */
  columnId: KanbanColumnId | string;
  /** Priority level of the task */
  priority?: KanbanCardPriority;
  /** Optional tags/labels for categorization */
  tags?: string[];
  /** Optional assignee name or identifier */
  assignee?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Optional due date for the task */
  dueDate?: Date;
  /** Order within the column for sorting */
  order: number;
}

/**
 * Represents a Kanban column containing cards
 */
export interface KanbanColumn {
  /** Unique identifier for the column */
  id: KanbanColumnId | string;
  /** Display title for the column */
  title: string;
  /** Cards within this column */
  cards: KanbanCard[];
  /** Optional limit on cards in this column (WIP limit) */
  cardLimit?: number;
  /** Whether this is a default column or custom */
  isDefault: boolean;
  /** Order of the column on the board */
  order: number;
}

/**
 * Represents the complete Kanban board state
 */
export interface KanbanBoardState {
  /** All columns on the board */
  columns: KanbanColumn[];
  /** Whether drag and drop is currently active */
  isDragging: boolean;
  /** ID of the currently dragged card, if any */
  draggedCardId?: string;
}

/**
 * Default columns for a new Kanban board
 */
export const DEFAULT_COLUMNS: Omit<KanbanColumn, 'cards'>[] = [
  { id: 'todo', title: 'To Do', isDefault: true, order: 0 },
  { id: 'in-progress', title: 'In Progress', isDefault: true, order: 1 },
  { id: 'review', title: 'Review', isDefault: true, order: 2 },
  { id: 'done', title: 'Done', isDefault: true, order: 3 },
];

/**
 * Create a new Kanban card with default values
 *
 * @param overrides - Partial card properties to override defaults
 * @returns A new KanbanCard object
 */
export function createKanbanCard(overrides: Partial<KanbanCard> & { title: string; columnId: string }): KanbanCard {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    order: overrides.order ?? 0,
    ...overrides,
  };
}

/**
 * Create initial board state with default columns
 *
 * @returns Initial KanbanBoardState with empty columns
 */
export function createInitialBoardState(): KanbanBoardState {
  return {
    columns: DEFAULT_COLUMNS.map((col) => ({ ...col, cards: [] })),
    isDragging: false,
  };
}
