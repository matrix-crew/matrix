import * as React from 'react';
import { cn } from '@/lib/utils';
import { KanbanColumn } from './KanbanColumn';
import {
  type KanbanBoardState,
  type KanbanCard as KanbanCardType,
  type KanbanColumn as KanbanColumnType,
  createInitialBoardState,
  createKanbanCard,
} from '@/types/kanban';

export interface KanbanBoardProps {
  /** Initial board state - if not provided, creates default empty board */
  initialState?: KanbanBoardState;
  /** Callback when board state changes */
  onStateChange?: (state: KanbanBoardState) => void;
  /** Callback when a card is clicked */
  onCardClick?: (card: KanbanCardType) => void;
  /** Additional CSS classes for the board container */
  className?: string;
}

/**
 * KanbanBoard component
 *
 * Main Kanban board component that manages columns and cards for task tracking.
 * Provides drag-and-drop functionality for moving cards between columns.
 * Default columns: To Do, In Progress, Review, Done.
 *
 * @example
 * <KanbanBoard
 *   onStateChange={(state) => saveToBackend(state)}
 *   onCardClick={(card) => openCardModal(card)}
 * />
 */
const KanbanBoard: React.FC<KanbanBoardProps> = ({
  initialState,
  onStateChange,
  onCardClick,
  className,
}) => {
  const [boardState, setBoardState] = React.useState<KanbanBoardState>(() => {
    // Initialize with provided state or create default
    if (initialState) {
      return initialState;
    }

    // Create initial board with sample cards for demonstration
    const state = createInitialBoardState();

    // Add sample cards to demonstrate the board
    const sampleCards: Partial<KanbanCardType>[] = [
      {
        title: 'Set up development environment',
        description: 'Install Node.js, pnpm, and configure IDE',
        columnId: 'done',
        priority: 'high',
        tags: ['setup', 'devops'],
      },
      {
        title: 'Design system components',
        description: 'Create reusable UI components following design specifications',
        columnId: 'in-progress',
        priority: 'high',
        tags: ['ui', 'design'],
        assignee: 'Alice',
      },
      {
        title: 'Implement authentication',
        description: 'Add user login and registration flow',
        columnId: 'review',
        priority: 'urgent',
        tags: ['auth', 'security'],
        assignee: 'Bob',
      },
      {
        title: 'Write unit tests',
        description: 'Add comprehensive test coverage for core modules',
        columnId: 'todo',
        priority: 'medium',
        tags: ['testing'],
      },
      {
        title: 'API documentation',
        description: 'Document all API endpoints with examples',
        columnId: 'todo',
        priority: 'low',
        tags: ['docs'],
      },
    ];

    // Add sample cards to appropriate columns
    sampleCards.forEach((cardData, index) => {
      const card = createKanbanCard({
        title: cardData.title!,
        columnId: cardData.columnId!,
        description: cardData.description,
        priority: cardData.priority,
        tags: cardData.tags,
        assignee: cardData.assignee,
        order: index,
      });

      const column = state.columns.find((col) => col.id === card.columnId);
      if (column) {
        column.cards.push(card);
      }
    });

    return state;
  });

  /**
   * Update board state and notify parent
   */
  const updateBoardState = React.useCallback(
    (newState: KanbanBoardState) => {
      setBoardState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * Handle card drag start
   */
  const handleCardDragStart = React.useCallback(
    (card: KanbanCardType) => {
      updateBoardState({
        ...boardState,
        isDragging: true,
        draggedCardId: card.id,
      });
    },
    [boardState, updateBoardState]
  );

  /**
   * Handle card drag end
   */
  const handleCardDragEnd = React.useCallback(() => {
    updateBoardState({
      ...boardState,
      isDragging: false,
      draggedCardId: undefined,
    });
  }, [boardState, updateBoardState]);

  /**
   * Handle card drop on a column
   */
  const handleCardDrop = React.useCallback(
    (cardId: string, targetColumnId: string) => {
      // Find the source column and card
      let sourceColumn: KanbanColumnType | undefined;
      let card: KanbanCardType | undefined;

      for (const col of boardState.columns) {
        const foundCard = col.cards.find((c) => c.id === cardId);
        if (foundCard) {
          sourceColumn = col;
          card = foundCard;
          break;
        }
      }

      if (!sourceColumn || !card) return;

      // If dropping on the same column, do nothing
      if (sourceColumn.id === targetColumnId) {
        handleCardDragEnd();
        return;
      }

      // Find target column
      const targetColumn = boardState.columns.find((col) => col.id === targetColumnId);
      if (!targetColumn) return;

      // Create updated columns
      const updatedColumns = boardState.columns.map((col) => {
        if (col.id === sourceColumn!.id) {
          // Remove card from source column
          return {
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          };
        } else if (col.id === targetColumnId) {
          // Add card to target column with updated columnId
          const updatedCard: KanbanCardType = {
            ...card!,
            columnId: targetColumnId,
            updatedAt: new Date(),
            order: col.cards.length, // Add to end
          };
          return {
            ...col,
            cards: [...col.cards, updatedCard],
          };
        }
        return col;
      });

      updateBoardState({
        columns: updatedColumns,
        isDragging: false,
        draggedCardId: undefined,
      });
    },
    [boardState, handleCardDragEnd, updateBoardState]
  );

  /**
   * Handle card click
   */
  const handleCardClick = React.useCallback(
    (card: KanbanCardType) => {
      onCardClick?.(card);
    },
    [onCardClick]
  );

  return (
    <div
      className={cn('flex h-full w-full flex-col', className)}
      role="region"
      aria-label="Kanban board"
    >
      {/* Board header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Board</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {boardState.columns.reduce((acc, col) => acc + col.cards.length, 0)} tasks
        </div>
      </div>

      {/* Columns container with horizontal scroll */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {boardState.columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onCardDrop={handleCardDrop}
              onCardDragStart={handleCardDragStart}
              onCardDragEnd={handleCardDragEnd}
              onCardClick={handleCardClick}
              draggedCardId={boardState.draggedCardId}
            />
          ))}
      </div>
    </div>
  );
};

KanbanBoard.displayName = 'KanbanBoard';

export { KanbanBoard };
