import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, Home, Settings, Wrench } from 'lucide-react';
import type { Matrix } from '@shared/types/matrix';

export interface MatrixTabBarProps {
  matrices: Matrix[];
  activeMatrixId: string | null;
  isHomeActive?: boolean;
  isSettingsActive?: boolean;
  isDevToolsActive?: boolean;
  onSelectMatrix: (id: string) => void;
  onSelectHome?: () => void;
  onCreateMatrix: () => void;
  onCloseMatrix: (id: string) => void;
  onOpenSettings?: () => void;
  onOpenDevTools?: () => void;
  className?: string;
}

export const MatrixTabBar: React.FC<MatrixTabBarProps> = ({
  matrices,
  activeMatrixId,
  isHomeActive = false,
  isSettingsActive = false,
  isDevToolsActive = false,
  onSelectMatrix,
  onSelectHome,
  onCreateMatrix,
  onCloseMatrix,
  onOpenSettings,
  onOpenDevTools,
  className,
}) => {
  return (
    <div
      className={cn(
        'drag-region flex h-12 items-center gap-1 border-b border-border-default bg-base-800 pl-20 pr-2',
        className
      )}
    >
      {/* Tabs */}
      <div className="no-drag flex items-center gap-1 overflow-x-auto">
        {/* Home tab - always first, icon only, no close button */}
        <button
          type="button"
          onClick={onSelectHome}
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors',
            isHomeActive
              ? 'bg-base-600 text-text-primary'
              : 'text-text-muted hover:bg-base-700 hover:text-text-secondary'
          )}
          aria-label="Home"
        >
          <Home className="size-4" />
        </button>

        {matrices.map((matrix) => {
          const isActive = matrix.id === activeMatrixId;
          return (
            <button
              key={matrix.id}
              type="button"
              onClick={() => onSelectMatrix(matrix.id)}
              className={cn(
                'group flex h-8 max-w-[200px] items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors',
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
        className="no-drag flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-base-700 hover:text-text-secondary"
        aria-label="Create new matrix"
      >
        <Plus className="size-4" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* DevTools button (dev mode only) */}
      {import.meta.env.DEV && onOpenDevTools && (
        <button
          type="button"
          onClick={onOpenDevTools}
          className={cn(
            'no-drag flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
            isDevToolsActive
              ? 'bg-base-600 text-text-primary'
              : 'text-text-muted hover:bg-base-700 hover:text-text-secondary'
          )}
          aria-label="DevTools"
        >
          <Wrench className="size-[18px]" />
        </button>
      )}

      {/* Settings button (always visible) */}
      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          className={cn(
            'no-drag flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
            isSettingsActive
              ? 'bg-base-600 text-text-primary'
              : 'text-text-muted hover:bg-base-700 hover:text-text-secondary'
          )}
          aria-label="Settings"
        >
          <Settings className="size-[18px]" />
        </button>
      )}
    </div>
  );
};

MatrixTabBar.displayName = 'MatrixTabBar';
