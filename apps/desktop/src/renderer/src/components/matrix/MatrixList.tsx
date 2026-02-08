import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import type { Matrix, Source } from '@maxtix/shared';

/**
 * Matrix list item variants using class-variance-authority
 */
const matrixItemVariants = cva(
  'flex items-center gap-3 rounded-lg p-3 transition-all cursor-pointer border',
  {
    variants: {
      selected: {
        true: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
        false: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

/**
 * Matrix filter options
 */
export interface MatrixFilter {
  /** Search query for matrix name */
  searchQuery?: string;
}

/**
 * Matrix list view state
 */
export interface MatrixListState {
  /** All matrices */
  matrices: Matrix[];
  /** All sources (for displaying source counts) */
  sources: Source[];
  /** Currently selected matrix ID */
  selectedMatrixId: string | null;
  /** Current filter options */
  filter: MatrixFilter;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  errorMessage: string | null;
}

/**
 * Create initial matrix list state
 *
 * @returns Initial MatrixListState
 */
export function createInitialMatrixListState(): MatrixListState {
  return {
    matrices: [],
    sources: [],
    selectedMatrixId: null,
    filter: {},
    isLoading: false,
    errorMessage: null,
  };
}

/**
 * Filter matrices based on filter options
 *
 * @param matrices - Array of matrices to filter
 * @param filter - Filter options
 * @returns Filtered matrices
 */
export function filterMatrices(matrices: Matrix[], filter: MatrixFilter): Matrix[] {
  return matrices.filter((matrix) => {
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      if (!matrix.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Get source count for a matrix
 *
 * @param matrix - The matrix to get source count for
 * @returns Number of sources in the matrix
 */
export function getMatrixSourceCount(matrix: Matrix): number {
  return matrix.source_ids.length;
}

/**
 * Format date for display
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatMatrixDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export interface MatrixListProps extends VariantProps<typeof matrixItemVariants> {
  /** Initial state for the matrix list */
  initialState?: MatrixListState;
  /** Callback when state changes */
  onStateChange?: (state: MatrixListState) => void;
  /** Callback when a matrix is selected */
  onMatrixSelect?: (matrix: Matrix | null) => void;
  /** Callback when create new matrix is clicked */
  onCreateMatrix?: () => void;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * MatrixList component
 *
 * Displays a list of all Matrix objects with search and selection functionality.
 * Follows the BranchesView component pattern for consistency.
 *
 * @example
 * <MatrixList
 *   onMatrixSelect={(matrix) => setSelectedMatrix(matrix)}
 *   onCreateMatrix={() => openCreateDialog()}
 * />
 */
const MatrixList: React.FC<MatrixListProps> = ({
  initialState,
  onStateChange,
  onMatrixSelect,
  onCreateMatrix,
  className,
}) => {
  const [state, setState] = React.useState<MatrixListState>(() => {
    return initialState ?? createInitialMatrixListState();
  });

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: MatrixListState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * Handle matrix selection
   */
  const handleSelectMatrix = React.useCallback(
    (matrixId: string | null) => {
      const newSelectedId = matrixId === state.selectedMatrixId ? null : matrixId;
      const selectedMatrix = newSelectedId
        ? state.matrices.find((m) => m.id === newSelectedId) ?? null
        : null;

      updateState({
        ...state,
        selectedMatrixId: newSelectedId,
      });

      onMatrixSelect?.(selectedMatrix);
    },
    [state, updateState, onMatrixSelect]
  );

  /**
   * Handle search query change
   */
  const handleSearchChange = React.useCallback(
    (searchQuery: string) => {
      updateState({
        ...state,
        filter: {
          ...state.filter,
          searchQuery: searchQuery || undefined,
        },
      });
    },
    [state, updateState]
  );

  /**
   * Get filtered matrices
   */
  const filteredMatrices = React.useMemo(() => {
    return filterMatrices(state.matrices, state.filter);
  }, [state.matrices, state.filter]);

  /**
   * Get the currently selected matrix
   */
  const selectedMatrix = React.useMemo(() => {
    return state.matrices.find((m) => m.id === state.selectedMatrixId) ?? null;
  }, [state.matrices, state.selectedMatrixId]);

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900', className)}
      role="region"
      aria-label="Matrix List"
    >
      {/* Header */}
      <div className="border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Matrices
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {state.matrices.length} matrix{state.matrices.length !== 1 ? 'es' : ''} total
            </p>
          </div>

          {/* Create button */}
          {onCreateMatrix && (
            <button
              type="button"
              onClick={onCreateMatrix}
              className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
              aria-label="Create new matrix"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="inline-block h-3 w-3 mr-1"
              >
                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
              </svg>
              New
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="mt-3">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search matrices..."
              value={state.filter.searchQuery ?? ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Matrix list */}
      <div className="flex-1 overflow-y-auto p-2">
        {state.isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : state.errorMessage ? (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mb-2 h-8 w-8 text-red-400"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-500 dark:text-red-400">{state.errorMessage}</p>
          </div>
        ) : filteredMatrices.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600"
            >
              <path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657ZM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6ZM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 0 1 6.75 6h10.5a3 3 0 0 1 2.683 1.657A4.505 4.505 0 0 0 18.75 7.5H5.25Z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {state.filter.searchQuery ? 'No matrices found' : 'No matrices yet'}
            </p>
            {!state.filter.searchQuery && onCreateMatrix && (
              <button
                type="button"
                onClick={onCreateMatrix}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Create your first matrix
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2" role="listbox" aria-label="Matrix list">
            {filteredMatrices.map((matrix) => (
              <MatrixListItem
                key={matrix.id}
                matrix={matrix}
                selected={matrix.id === state.selectedMatrixId}
                onClick={() => handleSelectMatrix(matrix.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected matrix info footer */}
      {selectedMatrix && (
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Selected: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedMatrix.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Matrix list item component
 */
interface MatrixListItemProps {
  matrix: Matrix;
  selected: boolean;
  onClick: () => void;
}

const MatrixListItem: React.FC<MatrixListItemProps> = ({
  matrix,
  selected,
  onClick,
}) => {
  const sourceCount = getMatrixSourceCount(matrix);
  const formattedDate = formatMatrixDate(matrix.updated_at);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(matrixItemVariants({ selected }), 'w-full text-left')}
      aria-selected={selected}
      role="option"
    >
      {/* Matrix icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 w-4 flex-shrink-0 text-gray-500"
      >
        <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm4.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5Zm3 0a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5Z" />
      </svg>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {matrix.name}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {sourceCount} source{sourceCount !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>Updated {formattedDate}</span>
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 flex-shrink-0 text-blue-500"
        >
          <path
            fillRule="evenodd"
            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
};

MatrixList.displayName = 'MatrixList';

export { MatrixList, matrixItemVariants };
