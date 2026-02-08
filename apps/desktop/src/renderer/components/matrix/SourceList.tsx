import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import type { Source, Matrix } from '@maxtix/shared';

/**
 * Source list item variants using class-variance-authority
 */
const sourceItemVariants = cva(
  'flex items-center gap-3 rounded-lg p-3 transition-all cursor-pointer border',
  {
    variants: {
      selected: {
        true: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
        false:
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

/**
 * Source filter options
 */
export interface SourceFilter {
  /** Search query for source name or path */
  searchQuery?: string;
}

/**
 * Source list view state
 */
export interface SourceListState {
  /** All sources in the matrix */
  sources: Source[];
  /** The parent matrix (optional, for context) */
  matrix: Matrix | null;
  /** Currently selected source ID */
  selectedSourceId: string | null;
  /** Current filter options */
  filter: SourceFilter;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  errorMessage: string | null;
}

/**
 * Create initial source list state
 *
 * @param matrix - Optional matrix to set context
 * @returns Initial SourceListState
 */
export function createInitialSourceListState(matrix?: Matrix | null): SourceListState {
  return {
    sources: [],
    matrix: matrix ?? null,
    selectedSourceId: null,
    filter: {},
    isLoading: false,
    errorMessage: null,
  };
}

/**
 * Filter sources based on filter options
 *
 * @param sources - Array of sources to filter
 * @param filter - Filter options
 * @returns Filtered sources
 */
export function filterSources(sources: Source[], filter: SourceFilter): Source[] {
  return sources.filter((source) => {
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const nameMatch = source.name.toLowerCase().includes(query);
      const pathMatch = source.path.toLowerCase().includes(query);
      if (!nameMatch && !pathMatch) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Format date for display
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatSourceDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate path for display
 *
 * @param path - Full file path
 * @param maxLength - Maximum length before truncating
 * @returns Truncated path with ellipsis
 */
export function truncatePath(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) {
    return path;
  }
  // Keep the last part of the path visible
  const parts = path.split('/');
  const lastPart = parts[parts.length - 1];
  if (lastPart.length >= maxLength - 3) {
    return '...' + lastPart.slice(-(maxLength - 3));
  }
  // Try to show as much of the path as possible
  let result = '...';
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = '.../' + parts.slice(i).join('/');
    if (candidate.length <= maxLength) {
      result = candidate;
    } else {
      break;
    }
  }
  return result;
}

export interface SourceListProps extends VariantProps<typeof sourceItemVariants> {
  /** Initial state for the source list */
  initialState?: SourceListState;
  /** Callback when state changes */
  onStateChange?: (state: SourceListState) => void;
  /** Callback when a source is selected */
  onSourceSelect?: (source: Source | null) => void;
  /** Callback when add source is clicked */
  onAddSource?: () => void;
  /** Callback when remove source is clicked */
  onRemoveSource?: (source: Source) => void;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * SourceList component
 *
 * Displays a list of Sources within a Matrix with search and selection functionality.
 * Follows the MatrixList component pattern for consistency.
 *
 * @example
 * <SourceList
 *   onSourceSelect={(source) => setSelectedSource(source)}
 *   onAddSource={() => openAddSourceDialog()}
 *   onRemoveSource={(source) => removeSourceFromMatrix(source)}
 * />
 */
const SourceList: React.FC<SourceListProps> = ({
  initialState,
  onStateChange,
  onSourceSelect,
  onAddSource,
  onRemoveSource,
  className,
}) => {
  const [state, setState] = React.useState<SourceListState>(() => {
    return initialState ?? createInitialSourceListState();
  });

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: SourceListState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * Handle source selection
   */
  const handleSelectSource = React.useCallback(
    (sourceId: string | null) => {
      const newSelectedId = sourceId === state.selectedSourceId ? null : sourceId;
      const selectedSource = newSelectedId
        ? (state.sources.find((s) => s.id === newSelectedId) ?? null)
        : null;

      updateState({
        ...state,
        selectedSourceId: newSelectedId,
      });

      onSourceSelect?.(selectedSource);
    },
    [state, updateState, onSourceSelect]
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
   * Handle remove source action
   */
  const handleRemoveSource = React.useCallback(
    (source: Source, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent selection when clicking remove
      onRemoveSource?.(source);
    },
    [onRemoveSource]
  );

  /**
   * Get filtered sources
   */
  const filteredSources = React.useMemo(() => {
    return filterSources(state.sources, state.filter);
  }, [state.sources, state.filter]);

  /**
   * Get the currently selected source
   */
  const selectedSource = React.useMemo(() => {
    return state.sources.find((s) => s.id === state.selectedSourceId) ?? null;
  }, [state.sources, state.selectedSourceId]);

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      role="region"
      aria-label="Source List"
    >
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sources</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {state.matrix ? (
                <>
                  {state.sources.length} source{state.sources.length !== 1 ? 's' : ''} in{' '}
                  <span className="font-medium">{state.matrix.name}</span>
                </>
              ) : (
                <>
                  {state.sources.length} source{state.sources.length !== 1 ? 's' : ''} total
                </>
              )}
            </p>
          </div>

          {/* Add source button */}
          {onAddSource && (
            <button
              type="button"
              onClick={onAddSource}
              className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
              aria-label="Add source to matrix"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="inline-block h-3 w-3 mr-1"
              >
                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
              </svg>
              Add
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
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search sources..."
              value={state.filter.searchQuery ?? ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Result count */}
        {state.filter.searchQuery && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Source list */}
      <div className="flex-1 overflow-y-auto p-4">
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
        ) : filteredSources.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            {/* Repository icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600"
            >
              <path
                fillRule="evenodd"
                d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {state.filter.searchQuery ? 'No sources found' : 'No sources yet'}
            </p>
            {!state.filter.searchQuery && onAddSource && (
              <button
                type="button"
                onClick={onAddSource}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Add your first source
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2" role="listbox" aria-label="Source list">
            {filteredSources.map((source) => (
              <SourceListItem
                key={source.id}
                source={source}
                selected={source.id === state.selectedSourceId}
                onClick={() => handleSelectSource(source.id)}
                onRemove={onRemoveSource ? (e) => handleRemoveSource(source, e) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected source info footer */}
      {selectedSource && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="space-y-2">
            <DetailRow label="Name" value={selectedSource.name} />
            <DetailRow label="Path" value={selectedSource.path} mono />
            {selectedSource.url && <DetailRow label="URL" value={selectedSource.url} mono />}
            <DetailRow label="Added" value={formatSourceDate(selectedSource.created_at)} />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Source list item component
 */
interface SourceListItemProps {
  source: Source;
  selected: boolean;
  onClick: () => void;
  onRemove?: (e: React.MouseEvent) => void;
}

const SourceListItem: React.FC<SourceListItemProps> = ({ source, selected, onClick, onRemove }) => {
  const truncatedPath = truncatePath(source.path);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(sourceItemVariants({ selected }), 'w-full text-left group')}
      aria-selected={selected}
      role="option"
    >
      {/* Repository icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 w-4 flex-shrink-0 text-gray-500"
      >
        <path
          fillRule="evenodd"
          d="M2 4.25A2.25 2.25 0 0 1 4.25 2h7.5A2.25 2.25 0 0 1 14 4.25v5.5A2.25 2.25 0 0 1 11.75 12h-1.312c.1.128.21.248.328.36a.75.75 0 0 1-.234 1.238 4.992 4.992 0 0 1-3.064 0 .75.75 0 0 1-.234-1.238c.118-.111.228-.232.328-.36H4.25A2.25 2.25 0 0 1 2 9.75v-5.5Zm2.25-.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-7.5Z"
          clipRule="evenodd"
        />
      </svg>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {source.name}
          </span>
          {source.url && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3 flex-shrink-0 text-gray-400"
              aria-label="Has remote URL"
            >
              <title>Has remote URL</title>
              <path d="M8.914 6.025a.75.75 0 0 1 1.06 0 3.5 3.5 0 0 1 0 4.95l-2 2a3.5 3.5 0 0 1-5.396-4.402.75.75 0 0 1 1.251.827 2 2 0 0 0 3.085 2.514l2-2a2 2 0 0 0 0-2.828.75.75 0 0 1 0-1.06Z" />
              <path d="M7.086 9.975a.75.75 0 0 1-1.06 0 3.5 3.5 0 0 1 0-4.95l2-2a3.5 3.5 0 0 1 5.396 4.402.75.75 0 0 1-1.251-.827 2 2 0 0 0-3.085-2.514l-2 2a2 2 0 0 0 0 2.828.75.75 0 0 1 0 1.06Z" />
            </svg>
          )}
        </div>
        <p
          className="mt-0.5 truncate font-mono text-xs text-gray-500 dark:text-gray-400"
          title={source.path}
        >
          {truncatedPath}
        </p>
      </div>

      {/* Remove button (shown on hover) */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-red-100 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          aria-label={`Remove ${source.name} from matrix`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      )}

      {/* Selection indicator */}
      {selected && !onRemove && (
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

/**
 * Detail row component for the footer section
 */
interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-2">
    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
    <span
      className={cn(
        'text-xs text-gray-900 dark:text-gray-100 text-right break-all',
        mono && 'font-mono'
      )}
    >
      {value}
    </span>
  </div>
);

SourceList.displayName = 'SourceList';

export { SourceList, sourceItemVariants };
