import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  type BranchesViewState,
  type Branch,
  type Repository,
  type BranchFilter,
  createInitialBranchesState,
  filterBranches,
  groupBranchesByRepository,
  getBranchStatusBgClass,
  getBranchStatusText,
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
 * Branch card variants using class-variance-authority
 */
const branchCardVariants = cva('rounded-lg border p-3 transition-all cursor-pointer', {
  variants: {
    selected: {
      true: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
      false:
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800',
    },
    isCurrent: {
      true: 'ring-2 ring-green-400 dark:ring-green-500',
      false: '',
    },
  },
  defaultVariants: {
    selected: false,
    isCurrent: false,
  },
});

export interface BranchesViewProps extends VariantProps<typeof repoItemVariants> {
  /** Initial state for the branches view */
  initialState?: BranchesViewState;
  /** Callback when state changes */
  onStateChange?: (state: BranchesViewState) => void;
  /** Additional CSS classes for the view container */
  className?: string;
}

/**
 * BranchesView component
 *
 * Aggregated git branch workflow view across matrix repositories.
 * Displays consolidated branch view from all repos in the matrix with
 * filtering, search, and branch status visualization.
 *
 * @example
 * <BranchesView
 *   onStateChange={(state) => saveToBackend(state)}
 * />
 */
const BranchesView: React.FC<BranchesViewProps> = ({ initialState, onStateChange, className }) => {
  const [state, setState] = React.useState<BranchesViewState>(() => {
    return initialState ?? createInitialBranchesState();
  });

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: BranchesViewState) => {
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
   * Handle branch selection
   */
  const handleSelectBranch = React.useCallback(
    (branchId: string) => {
      updateState({
        ...state,
        selectedBranchId: state.selectedBranchId === branchId ? null : branchId,
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
    (filter: Partial<BranchFilter>) => {
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
   * Get filtered branches
   */
  const filteredBranches = React.useMemo(() => {
    return filterBranches(state.branches, state.filter);
  }, [state.branches, state.filter]);

  /**
   * Get branches grouped by repository
   */
  const groupedBranches = React.useMemo(() => {
    return groupBranchesByRepository(filteredBranches);
  }, [filteredBranches]);

  /**
   * Get the currently selected branch
   */
  const selectedBranch = React.useMemo(() => {
    return state.branches.find((b) => b.id === state.selectedBranchId);
  }, [state.branches, state.selectedBranchId]);

  /**
   * Get repository by ID
   */
  const getRepository = React.useCallback(
    (repoId: string): Repository | undefined => {
      return state.repositories.find((r) => r.id === repoId);
    },
    [state.repositories]
  );

  return (
    <div
      className={cn('flex h-full gap-4 overflow-hidden', className)}
      role="region"
      aria-label="Branches View"
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
                  {state.branches.length} branches total
                </div>
              </div>
            </button>

            {/* Individual repos */}
            {state.repositories.map((repo) => (
              <RepositoryListItem
                key={repo.id}
                repository={repo}
                branchCount={state.branches.filter((b) => b.repository.id === repo.id).length}
                selected={repo.id === state.selectedRepositoryId}
                onClick={() => handleSelectRepository(repo.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center panel - Branch list */}
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
                  placeholder="Search branches..."
                  value={state.filter.searchQuery ?? ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <FilterButton
                label="Current"
                active={state.filter.showCurrentOnly ?? false}
                onClick={() =>
                  handleFilterChange({
                    showCurrentOnly: !state.filter.showCurrentOnly,
                  })
                }
              />
              <FilterButton
                label="Has PR"
                active={state.filter.hasOpenPR ?? false}
                onClick={() =>
                  handleFilterChange({
                    hasOpenPR: !state.filter.hasOpenPR,
                  })
                }
              />
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''} found
          </p>
        </div>

        {/* Branch list */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054a8.25 8.25 0 0 0 5.58.652l3.109-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No branches found</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your filters
              </p>
            </div>
          ) : state.selectedRepositoryId ? (
            // Single repository view
            <div className="space-y-2">
              {filteredBranches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  selected={branch.id === state.selectedBranchId}
                  showRepository={false}
                  onClick={() => handleSelectBranch(branch.id)}
                />
              ))}
            </div>
          ) : (
            // Grouped by repository view
            <div className="space-y-6">
              {Object.entries(groupedBranches).map(([repoId, branches]) => {
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
                        <path d="M8.75 1.75a.75.75 0 0 0-1.5 0V5H4a.75.75 0 0 0 0 1.5h3.25v8.75a.75.75 0 0 0 1.5 0V6.5H12A.75.75 0 0 0 12 5H8.75V1.75Z" />
                      </svg>
                      {repo.fullName}
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({branches.length})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {branches.map((branch) => (
                        <BranchCard
                          key={branch.id}
                          branch={branch}
                          selected={branch.id === state.selectedBranchId}
                          showRepository={false}
                          onClick={() => handleSelectBranch(branch.id)}
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

      {/* Right panel - Branch details */}
      {selectedBranch && (
        <BranchDetailsPanel
          branch={selectedBranch}
          onClose={() => handleSelectBranch(selectedBranch.id)}
        />
      )}
    </div>
  );
};

/**
 * Repository list item component
 */
interface RepositoryListItemProps {
  repository: Repository;
  branchCount: number;
  selected: boolean;
  onClick: () => void;
}

const RepositoryListItem: React.FC<RepositoryListItemProps> = ({
  repository,
  branchCount,
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
        {branchCount} branches
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
 * Branch card component
 */
interface BranchCardProps {
  branch: Branch;
  selected: boolean;
  showRepository: boolean;
  onClick: () => void;
}

const BranchCard: React.FC<BranchCardProps> = ({ branch, selected, showRepository, onClick }) => {
  const statusText = getBranchStatusText(branch.status, branch.commitsAhead, branch.commitsBehind);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        branchCardVariants({ selected, isCurrent: branch.isCurrent }),
        'w-full text-left'
      )}
      aria-selected={selected}
      role="option"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Branch icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 flex-shrink-0 text-gray-500"
            >
              <path d="M5.75 1.5a.75.75 0 0 0-.75.75v2.462a2.5 2.5 0 0 0 1 4.788v2.25a.75.75 0 0 0 1.5 0V9.5a2.5 2.5 0 0 0 1-4.788V2.25a.75.75 0 0 0-.75-.75h-2ZM6 7a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm4.75-2a.75.75 0 0 0-.75.75V8a2.5 2.5 0 0 0 1 4.788v1.462a.75.75 0 0 0 1.5 0V12.75A2.5 2.5 0 0 0 13.5 8V5.75a.75.75 0 0 0-.75-.75h-2ZM11 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" />
            </svg>

            <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
              {branch.name}
            </span>

            {/* Badges */}
            {branch.isDefault && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                default
              </span>
            )}
            {branch.isCurrent && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                current
              </span>
            )}
            {branch.protection === 'protected' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3.5 w-3.5 text-yellow-500"
                aria-label="Protected branch"
              >
                <title>Protected branch</title>
                <path
                  fillRule="evenodd"
                  d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {branch.pullRequestId && (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M5.243 3.757a.75.75 0 1 0-1.061 1.061L5.939 6.5H1.75a.75.75 0 0 0 0 1.5h4.189L4.182 9.757a.75.75 0 1 0 1.061 1.061l2.925-2.925a.75.75 0 0 0 0-1.061L5.243 3.757ZM10.757 3.757a.75.75 0 0 1 1.061 0l2.925 2.925a.75.75 0 0 1 0 1.061l-2.925 2.925a.75.75 0 0 1-1.061-1.061L12.561 8H8.25a.75.75 0 0 1 0-1.5h4.311l-1.804-1.743a.75.75 0 0 1 0-1.061Z" />
                </svg>
                PR
              </span>
            )}
          </div>

          {/* Repository name (if showing) */}
          {showRepository && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {branch.repository.fullName}
            </p>
          )}

          {/* Last commit info */}
          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">{branch.lastCommitAuthor}</span>
            {' - '}
            {branch.lastCommitMessage}
          </p>
        </div>

        {/* Status badge */}
        {!branch.isDefault && (
          <span
            className={cn(
              'inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
              getBranchStatusBgClass(branch.status),
              branch.status === 'ahead'
                ? 'text-green-700 dark:text-green-400'
                : branch.status === 'behind'
                  ? 'text-yellow-700 dark:text-yellow-400'
                  : branch.status === 'diverged'
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-400'
            )}
          >
            {statusText}
          </span>
        )}
      </div>
    </button>
  );
};

/**
 * Branch details panel component
 */
interface BranchDetailsPanelProps {
  branch: Branch;
  onClose: () => void;
}

const BranchDetailsPanel: React.FC<BranchDetailsPanelProps> = ({ branch, onClose }) => (
  <div className="flex w-80 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
          {branch.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{branch.repository.fullName}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        aria-label="Close branch details"
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
        {/* Status section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Status
          </h4>
          <div className="space-y-2">
            <DetailRow
              label="State"
              value={getBranchStatusText(branch.status, branch.commitsAhead, branch.commitsBehind)}
            />
            {branch.commitsAhead > 0 && (
              <DetailRow label="Commits ahead" value={branch.commitsAhead.toString()} />
            )}
            {branch.commitsBehind > 0 && (
              <DetailRow label="Commits behind" value={branch.commitsBehind.toString()} />
            )}
            <DetailRow
              label="Protection"
              value={branch.protection === 'protected' ? 'Protected' : 'Unprotected'}
            />
          </div>
        </div>

        {/* Last commit section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Last Commit
          </h4>
          <div className="space-y-2">
            <DetailRow label="SHA" value={branch.lastCommitSha} mono />
            <DetailRow label="Author" value={branch.lastCommitAuthor} />
            <DetailRow
              label="Date"
              value={branch.lastCommitDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Message</span>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {branch.lastCommitMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Associated PR */}
        {branch.pullRequestId && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Pull Request
            </h4>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 text-blue-500"
                >
                  <path d="M5.243 3.757a.75.75 0 1 0-1.061 1.061L5.939 6.5H1.75a.75.75 0 0 0 0 1.5h4.189L4.182 9.757a.75.75 0 1 0 1.061 1.061l2.925-2.925a.75.75 0 0 0 0-1.061L5.243 3.757ZM10.757 3.757a.75.75 0 0 1 1.061 0l2.925 2.925a.75.75 0 0 1 0 1.061l-2.925 2.925a.75.75 0 0 1-1.061-1.061L12.561 8H8.25a.75.75 0 0 1 0-1.5h4.311l-1.804-1.743a.75.75 0 0 1 0-1.061Z" />
                </svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Open Pull Request
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                #{branch.pullRequestId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Actions */}
    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
      <div className="space-y-2">
        <button
          type="button"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Checkout Branch
        </button>
        <button
          type="button"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          View in Browser
        </button>
      </div>
    </div>
  </div>
);

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

BranchesView.displayName = 'BranchesView';

export { BranchesView, repoItemVariants, branchCardVariants };
