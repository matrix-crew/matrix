import React from 'react';
import { cn } from '@/lib/utils';
import { FolderGit2 } from 'lucide-react';
import type { Matrix, Source } from '@shared/types/matrix';

export interface MatrixCardProps {
  matrix: Matrix;
  sources: Source[];
  isSelected?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  className?: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'unknown';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'just now';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

export const MatrixCard: React.FC<MatrixCardProps> = ({
  matrix,
  sources,
  isSelected = false,
  onClick,
  onDoubleClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onDoubleClick={onDoubleClick}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-lg border p-5 text-left transition-all',
        isSelected
          ? 'border-accent-lime bg-accent-lime/5 ring-1 ring-accent-lime/20'
          : 'border-border-default bg-surface-raised hover:border-base-400 hover:bg-base-700',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="truncate text-[15px] font-semibold text-text-primary">{matrix.name}</h3>
        <p className="mt-1 text-xs text-text-muted">
          {sources.length} source{sources.length !== 1 ? 's' : ''} &middot;{' '}
          {formatTimeAgo(matrix.updated_at)}
        </p>
      </div>

      {/* Sources */}
      {sources.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {sources.slice(0, 3).map((source) => (
            <div
              key={source.id}
              className="flex max-w-full items-center gap-1.5 rounded-md border border-border-subtle bg-base-800 px-2 py-1"
            >
              <FolderGit2 className="size-3 flex-shrink-0 text-text-muted" />
              <span className="truncate text-xs text-text-secondary">{source.name}</span>
            </div>
          ))}
          {sources.length > 3 && (
            <span className="self-center text-[10px] text-text-muted">
              +{sources.length - 3} more
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-md border border-dashed border-border-subtle py-4 text-xs text-text-muted">
          No sources yet
        </div>
      )}
    </button>
  );
};

MatrixCard.displayName = 'MatrixCard';
