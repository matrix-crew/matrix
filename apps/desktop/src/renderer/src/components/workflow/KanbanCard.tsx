import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import type { KanbanCard as KanbanCardType, KanbanCardPriority } from '@/types/kanban';

/**
 * Kanban card priority badge variants
 */
const priorityBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      priority: {
        low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      },
    },
    defaultVariants: {
      priority: 'medium',
    },
  }
);

/**
 * Kanban card container variants
 */
const cardVariants = cva(
  'group relative rounded-lg border bg-white p-3 shadow-sm transition-all dark:bg-gray-800',
  {
    variants: {
      isDragging: {
        true: 'rotate-2 scale-105 border-blue-500 shadow-lg ring-2 ring-blue-500/20',
        false: 'border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:hover:border-gray-600',
      },
    },
    defaultVariants: {
      isDragging: false,
    },
  }
);

export interface KanbanCardProps extends VariantProps<typeof cardVariants> {
  /** The card data to display */
  card: KanbanCardType;
  /** Callback when the card is clicked */
  onClick?: (card: KanbanCardType) => void;
  /** Callback when drag starts */
  onDragStart?: (card: KanbanCardType) => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
  /** Whether the card is currently being dragged */
  isDragging?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Priority badge component for displaying card priority
 */
const PriorityBadge: React.FC<{ priority: KanbanCardPriority }> = ({ priority }) => (
  <span className={priorityBadgeVariants({ priority })}>
    {priority.charAt(0).toUpperCase() + priority.slice(1)}
  </span>
);

/**
 * Format a date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * KanbanCard component
 *
 * Displays a single task card within a Kanban column. Supports drag-and-drop
 * functionality and displays card metadata including priority, tags, and assignee.
 *
 * @example
 * <KanbanCard
 *   card={{ id: '1', title: 'Task', columnId: 'todo', ... }}
 *   onDragStart={(card) => handleDragStart(card)}
 *   onDragEnd={() => handleDragEnd()}
 * />
 */
const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
  className,
}) => {
  /**
   * Handle drag start event
   */
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text/plain', card.id);
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(card);
  };

  /**
   * Handle drag end event
   */
  const handleDragEnd = () => {
    onDragEnd?.();
  };

  /**
   * Handle card click
   */
  const handleClick = () => {
    onClick?.(card);
  };

  return (
    <div
      className={cn(cardVariants({ isDragging }), className)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      role="listitem"
      aria-label={`Task: ${card.title}`}
    >
      {/* Card header with title */}
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {card.title}
      </h4>

      {/* Card description */}
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
          {card.description}
        </p>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Card footer with metadata */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          {card.priority && <PriorityBadge priority={card.priority} />}

          {/* Due date */}
          {card.dueDate && (
            <span className="text-gray-500 dark:text-gray-400">
              Due {formatDate(card.dueDate)}
            </span>
          )}
        </div>

        {/* Assignee avatar/initial */}
        {card.assignee && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white"
            title={card.assignee}
          >
            {card.assignee.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Drag handle indicator */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>
    </div>
  );
};

KanbanCard.displayName = 'KanbanCard';

export { KanbanCard, cardVariants, priorityBadgeVariants };
