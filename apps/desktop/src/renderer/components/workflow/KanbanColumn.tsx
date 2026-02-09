import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import type {
  KanbanColumn as KanbanColumnType,
  KanbanCard as KanbanCardType,
} from '@/types/kanban';

/**
 * Kanban column header variants
 */
const columnHeaderVariants = cva(
  'flex items-center justify-between rounded-t-lg border-b px-3 py-2',
  {
    variants: {
      columnType: {
        default: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
        todo: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
        'in-progress': 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30',
        review: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30',
        done: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30',
      },
    },
    defaultVariants: {
      columnType: 'default',
    },
  }
);

/**
 * Column container variants based on drop state
 */
const columnContainerVariants = cva(
  'flex h-full min-w-[280px] max-w-[320px] flex-col rounded-lg border transition-all',
  {
    variants: {
      isDropTarget: {
        true: 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-400/20 dark:bg-blue-900/20',
        false: 'border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900',
      },
    },
    defaultVariants: {
      isDropTarget: false,
    },
  }
);

export interface KanbanColumnProps extends VariantProps<typeof columnContainerVariants> {
  /** The column data including cards */
  column: KanbanColumnType;
  /** Callback when a card is dropped on this column */
  onCardDrop?: (cardId: string, targetColumnId: string) => void;
  /** Callback when a card in this column starts being dragged */
  onCardDragStart?: (card: KanbanCardType) => void;
  /** Callback when drag ends */
  onCardDragEnd?: () => void;
  /** Callback when a card is clicked */
  onCardClick?: (card: KanbanCardType) => void;
  /** ID of the currently dragged card */
  draggedCardId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get column type for styling based on column ID
 */
function getColumnType(columnId: string): 'todo' | 'in-progress' | 'review' | 'done' | 'default' {
  const typeMap: Record<string, 'todo' | 'in-progress' | 'review' | 'done'> = {
    todo: 'todo',
    'in-progress': 'in-progress',
    review: 'review',
    done: 'done',
  };
  return typeMap[columnId] || 'default';
}

/**
 * KanbanColumn component
 *
 * Displays a single column in the Kanban board containing cards.
 * Handles drag-and-drop functionality for card reorganization.
 *
 * @example
 * <KanbanColumn
 *   column={{ id: 'todo', title: 'To Do', cards: [...], isDefault: true, order: 0 }}
 *   onCardDrop={(cardId, columnId) => moveCard(cardId, columnId)}
 * />
 */
const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onCardDrop,
  onCardDragStart,
  onCardDragEnd,
  onCardClick,
  draggedCardId,
  className,
}) => {
  const [isDropTarget, setIsDropTarget] = React.useState(false);
  const columnType = getColumnType(column.id);

  /**
   * Handle drag over event to allow drop
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (!isDropTarget) {
      setIsDropTarget(true);
    }
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    // Only set to false if we're leaving the column entirely
    const relatedTarget = event.relatedTarget as Node | null;
    if (!event.currentTarget.contains(relatedTarget)) {
      setIsDropTarget(false);
    }
  };

  /**
   * Handle drop event
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropTarget(false);

    const cardId = event.dataTransfer.getData('text/plain');
    if (cardId && onCardDrop) {
      onCardDrop(cardId, column.id);
    }
  };

  /**
   * Check if WIP limit is exceeded
   */
  const isOverLimit = column.cardLimit !== undefined && column.cards.length >= column.cardLimit;

  return (
    <div
      className={cn(columnContainerVariants({ isDropTarget }), className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="list"
      aria-label={`${column.title} column with ${column.cards.length} cards`}
    >
      {/* Column header */}
      <div className={columnHeaderVariants({ columnType })}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{column.title}</h3>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {column.cards.length}
          </span>
        </div>

        {/* WIP limit indicator */}
        {column.cardLimit !== undefined && (
          <span
            className={cn(
              'text-xs font-medium',
              isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {column.cards.length}/{column.cardLimit}
          </span>
        )}
      </div>

      {/* Cards container */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {column.cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-gray-200 p-4 dark:border-gray-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              No cards yet
              <br />
              <span className="text-xs">Drag cards here or create new ones</span>
            </p>
          </div>
        ) : (
          column.cards
            .sort((a, b) => a.order - b.order)
            .map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                isDragging={draggedCardId === card.id}
                onDragStart={onCardDragStart}
                onDragEnd={onCardDragEnd}
                onClick={onCardClick}
              />
            ))
        )}
      </div>
    </div>
  );
};

KanbanColumn.displayName = 'KanbanColumn';

export { KanbanColumn, columnHeaderVariants, columnContainerVariants };
