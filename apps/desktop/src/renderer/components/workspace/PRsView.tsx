import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  type PRsViewState,
  type PullRequest,
  type Repository,
  type PRFilter,
  type PRState,
  createInitialPRsState,
  filterPRs,
  groupPRsByRepository,
  getPRStateBgClass,
  getPRCIStatusBgClass,
  getPRCIStatusText,
  getPRReviewSummary,
  getRelativeTimeString,
} from '@/types/workspace';

/**
 * Repository list item variants using class-variance-authority
 */
const repoItemVariants = cva(
  'flex items-center gap-3 rounded-lg p-3 transition-all cursor-pointer',
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
 * PR card variants using class-variance-authority
 */
const prCardVariants = cva('rounded-lg border p-3 transition-all cursor-pointer', {
  variants: {
    selected: {
      true: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
      false:
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800',
    },
    state: {
      open: '',
      merged: 'opacity-75',
      closed: 'opacity-60',
    },
  },
  defaultVariants: {
    selected: false,
    state: 'open',
  },
});

export interface PRsViewProps extends VariantProps<typeof repoItemVariants> {
  /** Initial state for the PRs view */
  initialState?: PRsViewState;
  /** Callback when state changes */
  onStateChange?: (state: PRsViewState) => void;
  /** Additional CSS classes for the view container */
  className?: string;
}

/**
 * PRsView component
 *
 * Aggregated pull requests workflow view across matrix repositories.
 * Displays consolidated PR view from all repos in the matrix with
 * filtering, search, and PR status visualization.
 *
 * @example
 * <PRsView
 *   onStateChange={(state) => saveToBackend(state)}
 * />
 */
const PRsView: React.FC<PRsViewProps> = ({ initialState, onStateChange, className }) => {
  const [state, setState] = React.useState<PRsViewState>(() => {
    return initialState ?? createInitialPRsState();
  });

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: PRsViewState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * Handle repository selection
   */
  const handleSelectRepository = React.useCallback(
    (repositoryId: string | null) => {
      updateState({
        ...state,
        selectedRepositoryId: repositoryId === state.selectedRepositoryId ? null : repositoryId,
        filter: {
          ...state.filter,
          repositoryId:
            repositoryId === state.selectedRepositoryId ? undefined : (repositoryId ?? undefined),
        },
      });
    },
    [state, updateState]
  );

  /**
   * Handle PR selection
   */
  const handleSelectPR = React.useCallback(
    (prId: string) => {
      updateState({
        ...state,
        selectedPRId: state.selectedPRId === prId ? null : prId,
      });
    },
    [state, updateState]
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
   * Handle filter change
   */
  const handleFilterChange = React.useCallback(
    (filter: Partial<PRFilter>) => {
      updateState({
        ...state,
        filter: {
          ...state.filter,
          ...filter,
        },
      });
    },
    [state, updateState]
  );

  /**
   * Handle state filter change
   */
  const handleStateFilterChange = React.useCallback(
    (prState: PRState | undefined) => {
      updateState({
        ...state,
        filter: {
          ...state.filter,
          state: state.filter.state === prState ? undefined : prState,
        },
      });
    },
    [state, updateState]
  );

  /**
   * Get filtered PRs
   */
  const filteredPRs = React.useMemo(() => {
    return filterPRs(state.pullRequests, state.filter, state.currentUser);
  }, [state.pullRequests, state.filter, state.currentUser]);

  /**
   * Get PRs grouped by repository
   */
  const groupedPRs = React.useMemo(() => {
    return groupPRsByRepository(filteredPRs);
  }, [filteredPRs]);

  /**
   * Get the currently selected PR
   */
  const selectedPR = React.useMemo(() => {
    return state.pullRequests.find((pr) => pr.id === state.selectedPRId);
  }, [state.pullRequests, state.selectedPRId]);

  /**
   * Get repository by ID
   */
  const getRepository = React.useCallback(
    (repoId: string): Repository | undefined => {
      return state.repositories.find((r) => r.id === repoId);
    },
    [state.repositories]
  );

  /**
   * Count PRs by state
   */
  const prCountByState = React.useMemo(() => {
    const openCount = state.pullRequests.filter((pr) => pr.state === 'open').length;
    const mergedCount = state.pullRequests.filter((pr) => pr.state === 'merged').length;
    const closedCount = state.pullRequests.filter((pr) => pr.state === 'closed').length;
    return { open: openCount, merged: mergedCount, closed: closedCount };
  }, [state.pullRequests]);

  return (
    <div
      className={cn('flex h-full gap-4 overflow-hidden', className)}
      role="region"
      aria-label="Pull Requests View"
    >
      {/* Left panel - Repository list */}
      <div className="flex w-64 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Repositories</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {state.repositories.length} repos in matrix
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {/* All repos option */}
            <button
              type="button"
              onClick={() => handleSelectRepository(null)}
              className={cn(
                repoItemVariants({ selected: state.selectedRepositoryId === null }),
                'w-full border text-left'
              )}
              aria-selected={state.selectedRepositoryId === null}
              role="option"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 flex-shrink-0 text-gray-500"
              >
                <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm4.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5Zm3 0a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5Z" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  All Repositories
                </div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {state.pullRequests.length} PRs total
                </div>
              </div>
            </button>

            {/* Individual repos */}
            {state.repositories.map((repo) => (
              <RepositoryListItem
                key={repo.id}
                repository={repo}
                prCount={state.pullRequests.filter((pr) => pr.repository.id === repo.id).length}
                openCount={
                  state.pullRequests.filter(
                    (pr) => pr.repository.id === repo.id && pr.state === 'open'
                  ).length
                }
                selected={repo.id === state.selectedRepositoryId}
                onClick={() => handleSelectRepository(repo.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center panel - PR list */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Header with search and filters */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex-1">
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
                  placeholder="Search pull requests..."
                  value={state.filter.searchQuery ?? ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <StateFilterButton
                label="Open"
                count={prCountByState.open}
                active={state.filter.state === 'open'}
                onClick={() => handleStateFilterChange('open')}
                variant="open"
              />
              <StateFilterButton
                label="Merged"
                count={prCountByState.merged}
                active={state.filter.state === 'merged'}
                onClick={() => handleStateFilterChange('merged')}
                variant="merged"
              />
              <FilterButton
                label="Review requested"
                active={state.filter.reviewRequestedFromMe ?? false}
                onClick={() =>
                  handleFilterChange({
                    reviewRequestedFromMe: !state.filter.reviewRequestedFromMe,
                  })
                }
              />
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredPRs.length} pull request{filteredPRs.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* PR list */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredPRs.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No pull requests found</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your filters
              </p>
            </div>
          ) : state.selectedRepositoryId ? (
            // Single repository view
            <div className="space-y-2">
              {filteredPRs.map((pr) => (
                <PRCard
                  key={pr.id}
                  pr={pr}
                  selected={pr.id === state.selectedPRId}
                  showRepository={false}
                  onClick={() => handleSelectPR(pr.id)}
                />
              ))}
            </div>
          ) : (
            // Grouped by repository view
            <div className="space-y-6">
              {Object.entries(groupedPRs).map(([repoId, prs]) => {
                const repo = getRepository(repoId);
                if (!repo) return null;
                return (
                  <div key={repoId}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 4.25A2.25 2.25 0 0 1 4.25 2h7.5A2.25 2.25 0 0 1 14 4.25v5.5A2.25 2.25 0 0 1 11.75 12h-1.312c.1.128.21.248.328.36a.75.75 0 0 1-.234 1.238 4.992 4.992 0 0 1-3.064 0 .75.75 0 0 1-.234-1.238c.118-.111.228-.232.328-.36H4.25A2.25 2.25 0 0 1 2 9.75v-5.5Zm2.25-.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {repo.fullName}
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({prs.length})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {prs.map((pr) => (
                        <PRCard
                          key={pr.id}
                          pr={pr}
                          selected={pr.id === state.selectedPRId}
                          showRepository={false}
                          onClick={() => handleSelectPR(pr.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - PR details */}
      {selectedPR && (
        <PRDetailsPanel pr={selectedPR} onClose={() => handleSelectPR(selectedPR.id)} />
      )}
    </div>
  );
};

/**
 * Repository list item component
 */
interface RepositoryListItemProps {
  repository: Repository;
  prCount: number;
  openCount: number;
  selected: boolean;
  onClick: () => void;
}

const RepositoryListItem: React.FC<RepositoryListItemProps> = ({
  repository,
  prCount,
  openCount,
  selected,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(repoItemVariants({ selected }), 'w-full border text-left')}
    aria-selected={selected}
    role="option"
  >
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
      <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
        {repository.name}
      </div>
      <div className="truncate text-xs text-gray-500 dark:text-gray-400">
        {prCount} PRs ({openCount} open)
      </div>
    </div>
  </button>
);

/**
 * Filter button component
 */
interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
    )}
  >
    {label}
  </button>
);

/**
 * State filter button component
 */
interface StateFilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  variant: 'open' | 'merged' | 'closed';
}

const StateFilterButton: React.FC<StateFilterButtonProps> = ({
  label,
  count,
  active,
  onClick,
  variant,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      active
        ? variant === 'open'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : variant === 'merged'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
    )}
  >
    {variant === 'open' ? (
      <PROpenIcon className="h-3 w-3" />
    ) : variant === 'merged' ? (
      <PRMergedIcon className="h-3 w-3" />
    ) : (
      <PRClosedIcon className="h-3 w-3" />
    )}
    {label}
    <span className="text-[10px] opacity-75">({count})</span>
  </button>
);

/**
 * PR Open icon component
 */
const PROpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
  </svg>
);

/**
 * PR Merged icon component
 */
const PRMergedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />
  </svg>
);

/**
 * PR Closed icon component
 */
const PRClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.28a.75.75 0 0 1 1.06 0l.97.97.97-.97a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734l-.97.97.97.97a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-.97-.97-.97.97a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 3.5a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
  </svg>
);

/**
 * PR card component
 */
interface PRCardProps {
  pr: PullRequest;
  selected: boolean;
  showRepository: boolean;
  onClick: () => void;
}

const PRCard: React.FC<PRCardProps> = ({ pr, selected, showRepository, onClick }) => {
  const relativeTime = getRelativeTimeString(pr.updatedAt);
  const reviewSummary = getPRReviewSummary(pr.reviews);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(prCardVariants({ selected, state: pr.state }), 'w-full text-left')}
      aria-selected={selected}
      role="option"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* PR state icon */}
            {pr.state === 'open' ? (
              <PROpenIcon className="h-4 w-4 flex-shrink-0 text-green-500" />
            ) : pr.state === 'merged' ? (
              <PRMergedIcon className="h-4 w-4 flex-shrink-0 text-purple-500" />
            ) : (
              <PRClosedIcon className="h-4 w-4 flex-shrink-0 text-red-500" />
            )}

            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{pr.title}</span>

            {/* Draft badge */}
            {pr.isDraft && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Draft
              </span>
            )}

            {/* Conflict badge */}
            {pr.hasConflicts && (
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 1 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
                Conflicts
              </span>
            )}
          </div>

          {/* Repository name (if showing) */}
          {showRepository && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {pr.repository.fullName}
            </p>
          )}

          {/* Branch info */}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono">{pr.sourceBranch}</span>
            {' \u2192 '}
            <span className="font-mono">{pr.targetBranch}</span>
          </p>

          {/* Labels */}
          {pr.labels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pr.labels.map((label) => (
                <span
                  key={label.name}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    border: `1px solid ${label.color}40`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Meta info */}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            #{pr.number} opened by <span className="font-medium">{pr.author}</span>
            {' \u2022 '}
            {relativeTime}
            {pr.commitCount > 0 && (
              <>
                {' \u2022 '}
                {pr.commitCount} commit{pr.commitCount !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Right side: CI status and reviews */}
        <div className="flex flex-col items-end gap-1">
          {/* CI Status */}
          <CIStatusBadge status={pr.ciStatus} />

          {/* Reviews summary */}
          {pr.reviews.length > 0 && (
            <div className="flex items-center gap-1">
              {reviewSummary.approved > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.151-.043l4.25-5.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {reviewSummary.approved}
                </span>
              )}
              {reviewSummary.changesRequested > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 0L8 9.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 1.06-1.06L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 0 1 0 1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {reviewSummary.changesRequested}
                </span>
              )}
            </div>
          )}

          {/* Reviewers */}
          {pr.reviewers.length > 0 && (
            <div className="flex -space-x-1">
              {pr.reviewers.slice(0, 3).map((reviewer, index) => (
                <div
                  key={reviewer}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 ring-2 ring-white dark:bg-gray-600 dark:text-gray-300 dark:ring-gray-800"
                  title={reviewer}
                  style={{ zIndex: 3 - index }}
                >
                  {reviewer[0].toUpperCase()}
                </div>
              ))}
              {pr.reviewers.length > 3 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 ring-2 ring-white dark:bg-gray-600 dark:text-gray-300 dark:ring-gray-800">
                  +{pr.reviewers.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

/**
 * CI Status badge component
 */
interface CIStatusBadgeProps {
  status: PullRequest['ciStatus'];
}

const CIStatusBadge: React.FC<CIStatusBadgeProps> = ({ status }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      getPRCIStatusBgClass(status),
      status === 'success'
        ? 'text-green-700 dark:text-green-400'
        : status === 'failure'
          ? 'text-red-700 dark:text-red-400'
          : status === 'running'
            ? 'text-yellow-700 dark:text-yellow-400'
            : 'text-gray-700 dark:text-gray-400'
    )}
  >
    {status === 'success' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3"
      >
        <path
          fillRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.151-.043l4.25-5.5Z"
          clipRule="evenodd"
        />
      </svg>
    ) : status === 'failure' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3"
      >
        <path
          fillRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 0L8 9.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 1.06-1.06L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 0 1 0 1.06Z"
          clipRule="evenodd"
        />
      </svg>
    ) : status === 'running' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3 animate-spin"
      >
        <path
          fillRule="evenodd"
          d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.274Z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3"
      >
        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        <path
          fillRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z"
          clipRule="evenodd"
        />
      </svg>
    )}
    {getPRCIStatusText(status)}
  </span>
);

/**
 * PR details panel component
 */
interface PRDetailsPanelProps {
  pr: PullRequest;
  onClose: () => void;
}

const PRDetailsPanel: React.FC<PRDetailsPanelProps> = ({ pr, onClose }) => {
  return (
    <div className="flex w-80 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {pr.state === 'open' ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  getPRStateBgClass(pr.state),
                  'text-green-700 dark:text-green-400'
                )}
              >
                <PROpenIcon className="h-3 w-3" />
                Open
              </span>
            ) : pr.state === 'merged' ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  getPRStateBgClass(pr.state),
                  'text-purple-700 dark:text-purple-400'
                )}
              >
                <PRMergedIcon className="h-3 w-3" />
                Merged
              </span>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  getPRStateBgClass(pr.state),
                  'text-red-700 dark:text-red-400'
                )}
              >
                <PRClosedIcon className="h-3 w-3" />
                Closed
              </span>
            )}
            {pr.isDraft && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Draft
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {pr.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            #{pr.number} in {pr.repository.fullName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Close PR details"
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
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Branch info */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Branches
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-700">
                {pr.sourceBranch}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-700">
                {pr.targetBranch}
              </span>
            </div>
            {pr.hasConflicts && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 1 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
                This branch has conflicts that must be resolved
              </p>
            )}
          </div>

          {/* CI Status */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              CI Status
            </h4>
            <CIStatusBadge status={pr.ciStatus} />
          </div>

          {/* Description */}
          {pr.body && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Description
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {pr.body}
              </p>
            </div>
          )}

          {/* Labels */}
          {pr.labels.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Labels
              </h4>
              <div className="flex flex-wrap gap-1">
                {pr.labels.map((label) => (
                  <span
                    key={label.name}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      border: `1px solid ${label.color}40`,
                    }}
                    title={label.description}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviewers */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Reviewers
            </h4>
            {pr.reviewers.length > 0 ? (
              <div className="space-y-2">
                {pr.reviewers.map((reviewer) => {
                  const review = pr.reviews.find((r) => r.reviewer === reviewer);
                  return (
                    <div key={reviewer} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                          {reviewer[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{reviewer}</span>
                      </div>
                      {review && (
                        <span
                          className={cn(
                            'text-xs font-medium',
                            review.state === 'approved'
                              ? 'text-green-600 dark:text-green-400'
                              : review.state === 'changes_requested'
                                ? 'text-red-600 dark:text-red-400'
                                : review.state === 'commented'
                                  ? 'text-gray-600 dark:text-gray-400'
                                  : 'text-yellow-600 dark:text-yellow-400'
                          )}
                        >
                          {review.state === 'approved'
                            ? 'Approved'
                            : review.state === 'changes_requested'
                              ? 'Changes requested'
                              : review.state === 'commented'
                                ? 'Commented'
                                : 'Pending'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No reviewers assigned</p>
            )}
          </div>

          {/* Changes summary */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Changes
            </h4>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">{pr.filesChanged} files</span>
              <span className="text-green-600 dark:text-green-400">+{pr.additions}</span>
              <span className="text-red-600 dark:text-red-400">-{pr.deletions}</span>
            </div>
          </div>

          {/* Meta info */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Details
            </h4>
            <div className="space-y-2">
              <DetailRow label="Author" value={pr.author} />
              <DetailRow label="Commits" value={pr.commitCount.toString()} />
              <DetailRow
                label="Created"
                value={pr.createdAt.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              />
              <DetailRow label="Updated" value={getRelativeTimeString(pr.updatedAt)} />
              {pr.mergedAt && (
                <DetailRow
                  label="Merged"
                  value={pr.mergedAt.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                />
              )}
              {pr.closedAt && !pr.mergedAt && (
                <DetailRow
                  label="Closed"
                  value={pr.closedAt.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="space-y-2">
          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            View in Browser
          </button>
          {pr.state === 'open' && (
            <button
              type="button"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Checkout Branch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Detail row component
 */
interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className={cn('text-sm text-gray-900 dark:text-gray-100', mono && 'font-mono text-xs')}>
      {value}
    </span>
  </div>
);

PRsView.displayName = 'PRsView';

export { PRsView, repoItemVariants, prCardVariants };
