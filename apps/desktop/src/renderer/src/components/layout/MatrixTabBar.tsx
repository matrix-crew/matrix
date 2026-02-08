import React from 'react';
import { cn } from '@maxtix/ui';
import { Plus, X } from 'lucide-react';
import type { Matrix } from '@maxtix/shared';

export interface MatrixTabBarProps {
  matrices: Matrix[];
  activeMatrixId: string | null;
  onSelectMatrix: (id: string) => void;
  onCreateMatrix: () => void;
  onCloseMatrix: (id: string) => void;
  className?: string;
}

export const MatrixTabBar: React.FC<MatrixTabBarProps> = ({
  matrices,
  activeMatrixId,
  onSelectMatrix,
  onCreateMatrix,
  onCloseMatrix,
  className,
}) => {
  return (
    <div
      className={cn(
        'drag-region flex h-10 items-center gap-0.5 border-b border-border-default bg-base-800 px-2',
        className
      )}
    >
      {/* Tabs */}
      <div className="no-drag flex items-center gap-0.5 overflow-x-auto">
        {matrices.map((matrix) => {
          const isActive = matrix.id === activeMatrixId;
          return (
            <button
              key={matrix.id}
              type="button"
              onClick={() => onSelectMatrix(matrix.id)}
              className={cn(
                'group flex h-7 max-w-[180px] items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-base-600 text-text-primary'
                  : 'text-text-muted hover:bg-base-700 hover:text-text-secondary'
              )}
            >
              <span className="truncate">{matrix.name}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseMatrix(matrix.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onCloseMatrix(matrix.id);
                  }
                }}
                className={cn(
                  'flex-shrink-0 rounded p-0.5 transition-colors',
                  isActive
                    ? 'text-text-muted hover:bg-base-400 hover:text-text-primary'
                    : 'text-transparent group-hover:text-text-muted group-hover:hover:bg-base-500 group-hover:hover:text-text-primary'
                )}
                aria-label={`Close ${matrix.name}`}
              >
                <X className="size-3" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Create button */}
      <button
        type="button"
        onClick={onCreateMatrix}
        className="no-drag flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-base-700 hover:text-text-secondary"
        aria-label="Create new matrix"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
};

MatrixTabBar.displayName = 'MatrixTabBar';
