import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  type IssuesViewState,
  type Issue,
  type Repository,
  type IssueFilter,
  type IssueState,
  filterIssues,
  groupIssuesByRepository,
  getIssueStateBgClass,
  getIssuePriorityBgClass,
  getIssuePriorityText,
  getRelativeTimeString,
} from '@/types/workspace';
import { useGitHubData } from '@/hooks/useGitHubData';
import { GitHubSetupPrompt } from './GitHubSetupPrompt';

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
 * Issue card variants using class-variance-authority
 */
const issueCardVariants = cva('rounded-lg border p-3 transition-all cursor-pointer', {
  variants: {
    selected: {
      true: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
      false:
        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800',
    },
    state: {
      open: '',
      closed: 'opacity-75',
    },
  },
  defaultVariants: {
    selected: false,
    state: 'open',
  },
});

export interface IssuesViewProps extends VariantProps<typeof repoItemVariants> {
  /** Source IDs from the active matrix (used to detect GitHub repos) */
  sourceIds: string[];
  /** Initial state for the issues view */
  initialState?: IssuesViewState;
  /** Callback when state changes */
  onStateChange?: (state: IssuesViewState) => void;
  /** Additional CSS classes for the view container */
  className?: string;
}

/**
 * IssuesView component
 *
 * Aggregated git issues workflow view across matrix repositories.
 * Displays consolidated issue view from all repos in the matrix with
 * filtering, search, and issue status visualization.
 *
 * @example
 * <IssuesView
 *   onStateChange={(state) => saveToBackend(state)}
 * />
 */
const IssuesView: React.FC<IssuesViewProps> = ({
  sourceIds,
  initialState,
  onStateChange,
  className,
}) => {
  const {
    status,
    isCheckingStatus,
    isLoading: isGitHubLoading,
    repositories: ghRepositories,
    issues: ghIssues,
    errors,
    refetchAll,
  } = useGitHubData({ sourceIds });

  const [state, setState] = React.useState<IssuesViewState>(() => {
    return (
      initialState ?? {
        issues: [],
        repositories: [],
        selectedRepositoryId: null,
        filter: {},
        selectedIssueId: null,
        isLoading: true,
        errorMessage: null,
        currentUser: '',
      }
    );
  });

  // Sync hook data into view state
  React.useEffect(() => {
    setState((prev) => ({
      ...prev,
      issues: ghIssues,
      repositories: ghRepositories,
      isLoading: isGitHubLoading,
      errorMessage: errors.length > 0 ? errors.join('; ') : null,
      currentUser: status.user ?? '',
    }));
  }, [ghIssues, ghRepositories, isGitHubLoading, errors, status.user]);

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: IssuesViewState) => {
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
   * Handle issue selection
   */
  const handleSelectIssue = React.useCallback(
    (issueId: string) => {
      updateState({
        ...state,
        selectedIssueId: state.selectedIssueId === issueId ? null : issueId,
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
    (filter: Partial<IssueFilter>) => {
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
    (issueState: IssueState | undefined) => {
      updateState({
        ...state,
        filter: {
          ...state.filter,
          state: state.filter.state === issueState ? undefined : issueState,
        },
      });
    },
    [state, updateState]
  );

  /**
   * Get filtered issues
   */
  const filteredIssues = React.useMemo(() => {
    return filterIssues(state.issues, state.filter, state.currentUser);
  }, [state.issues, state.filter, state.currentUser]);

  /**
   * Get issues grouped by repository
   */
  const groupedIssues = React.useMemo(() => {
    return groupIssuesByRepository(filteredIssues);
  }, [filteredIssues]);

  /**
   * Get the currently selected issue
   */
  const selectedIssue = React.useMemo(() => {
    return state.issues.find((i) => i.id === state.selectedIssueId);
  }, [state.issues, state.selectedIssueId]);

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
   * Count issues by state
   */
  const issueCountByState = React.useMemo(() => {
    const openCount = state.issues.filter((i) => i.state === 'open').length;
    const closedCount = state.issues.filter((i) => i.state === 'closed').length;
    return { open: openCount, closed: closedCount };
  }, [state.issues]);

  // Show gh CLI setup prompt if not installed or not authenticated
  if (isCheckingStatus || !status.installed || !status.authenticated) {
    return (
      <GitHubSetupPrompt
        status={status}
        isCheckingStatus={isCheckingStatus}
        onRetry={refetchAll}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn('flex h-full gap-4 overflow-hidden', className)}
      role="region"
      aria-label="Issues View"
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
                  {state.issues.length} issues total
                </div>
              </div>
            </button>

            {/* Individual repos */}
            {state.repositories.map((repo) => (
              <RepositoryListItem
                key={repo.id}
                repository={repo}
                issueCount={state.issues.filter((i) => i.repository.id === repo.id).length}
                openCount={
                  state.issues.filter((i) => i.repository.id === repo.id && i.state === 'open')
                    .length
                }
                selected={repo.id === state.selectedRepositoryId}
                onClick={() => handleSelectRepository(repo.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center panel - Issue list */}
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
                  placeholder="Search issues..."
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
                count={issueCountByState.open}
                active={state.filter.state === 'open'}
                onClick={() => handleStateFilterChange('open')}
              />
              <StateFilterButton
                label="Closed"
                count={issueCountByState.closed}
                active={state.filter.state === 'closed'}
                onClick={() => handleStateFilterChange('closed')}
              />
              <FilterButton
                label="Assigned to me"
                active={state.filter.assignedToMe ?? false}
                onClick={() =>
                  handleFilterChange({
                    assignedToMe: !state.filter.assignedToMe,
                  })
                }
              />
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Issue list */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No issues found</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your filters
              </p>
            </div>
          ) : state.selectedRepositoryId ? (
            // Single repository view
            <div className="space-y-2">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  selected={issue.id === state.selectedIssueId}
                  showRepository={false}
                  onClick={() => handleSelectIssue(issue.id)}
                />
              ))}
            </div>
          ) : (
            // Grouped by repository view
            <div className="space-y-6">
              {Object.entries(groupedIssues).map(([repoId, issues]) => {
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
                        ({issues.length})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {issues.map((issue) => (
                        <IssueCard
                          key={issue.id}
                          issue={issue}
                          selected={issue.id === state.selectedIssueId}
                          showRepository={false}
                          onClick={() => handleSelectIssue(issue.id)}
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

      {/* Right panel - Issue details */}
      {selectedIssue && (
        <IssueDetailsPanel
          issue={selectedIssue}
          onClose={() => handleSelectIssue(selectedIssue.id)}
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
  issueCount: number;
  openCount: number;
  selected: boolean;
  onClick: () => void;
}

const RepositoryListItem: React.FC<RepositoryListItemProps> = ({
  repository,
  issueCount,
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
        {issueCount} issues ({openCount} open)
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
}

const StateFilterButton: React.FC<StateFilterButtonProps> = ({ label, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      active
        ? label === 'Open'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
    )}
  >
    {label === 'Open' ? (
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
    ) : (
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
    )}
    {label}
    <span className="text-[10px] opacity-75">({count})</span>
  </button>
);

/**
 * Issue card component
 */
interface IssueCardProps {
  issue: Issue;
  selected: boolean;
  showRepository: boolean;
  onClick: () => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, selected, showRepository, onClick }) => {
  const relativeTime = getRelativeTimeString(issue.updatedAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(issueCardVariants({ selected, state: issue.state }), 'w-full text-left')}
      aria-selected={selected}
      role="option"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Issue state icon */}
            {issue.state === 'open' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 flex-shrink-0 text-green-500"
              >
                <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                <path
                  fillRule="evenodd"
                  d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 flex-shrink-0 text-purple-500"
              >
                <path
                  fillRule="evenodd"
                  d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.151-.043l4.25-5.5Z"
                  clipRule="evenodd"
                />
              </svg>
            )}

            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {issue.title}
            </span>

            {/* Priority badge */}
            {issue.priority && (
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                  getIssuePriorityBgClass(issue.priority),
                  issue.priority === 'critical'
                    ? 'text-red-700 dark:text-red-400'
                    : issue.priority === 'high'
                      ? 'text-orange-700 dark:text-orange-400'
                      : issue.priority === 'medium'
                        ? 'text-yellow-700 dark:text-yellow-400'
                        : 'text-blue-700 dark:text-blue-400'
                )}
              >
                {getIssuePriorityText(issue.priority)}
              </span>
            )}
          </div>

          {/* Repository name (if showing) */}
          {showRepository && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {issue.repository.fullName}
            </p>
          )}

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {issue.labels.map((label) => (
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
            #{issue.number} opened by <span className="font-medium">{issue.author}</span>
            {' • '}
            {relativeTime}
            {issue.commentCount > 0 && (
              <>
                {' • '}
                <span className="inline-flex items-center gap-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 8.74c0 .983.713 1.825 1.69 1.943.764.092 1.534.164 2.31.216v2.351a.75.75 0 0 0 1.28.53l2.51-2.51c.182-.181.427-.283.684-.283h3.776a1.75 1.75 0 0 0 1.75-1.75V4.75A1.75 1.75 0 0 0 13.25 3H2.75A1.75 1.75 0 0 0 1 4.75v3.99Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {issue.commentCount}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Assignees */}
        {issue.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {issue.assignees.slice(0, 3).map((assignee, index) => (
              <div
                key={assignee}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white dark:bg-gray-600 dark:text-gray-300 dark:ring-gray-800"
                title={assignee}
                style={{ zIndex: 3 - index }}
              >
                {assignee[0].toUpperCase()}
              </div>
            ))}
            {issue.assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white dark:bg-gray-600 dark:text-gray-300 dark:ring-gray-800">
                +{issue.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

/**
 * Issue details panel component
 */
interface IssueDetailsPanelProps {
  issue: Issue;
  onClose: () => void;
}

const IssueDetailsPanel: React.FC<IssueDetailsPanelProps> = ({ issue, onClose }) => (
  <div className="flex w-80 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {issue.state === 'open' ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                getIssueStateBgClass(issue.state),
                'text-green-700 dark:text-green-400'
              )}
            >
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
              Open
            </span>
          ) : (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                getIssueStateBgClass(issue.state),
                'text-purple-700 dark:text-purple-400'
              )}
            >
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
              Closed
            </span>
          )}
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {issue.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          #{issue.number} in {issue.repository.fullName}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        aria-label="Close issue details"
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
        {/* Description section */}
        {issue.body && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Description
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {issue.body}
            </p>
          </div>
        )}

        {/* Labels section */}
        {issue.labels.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Labels
            </h4>
            <div className="flex flex-wrap gap-1">
              {issue.labels.map((label) => (
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

        {/* Assignees section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Assignees
          </h4>
          {issue.assignees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {issue.assignees.map((assignee) => (
                <div
                  key={assignee}
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2.5 dark:bg-gray-700"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-600 dark:bg-gray-500 dark:text-gray-300">
                    {assignee[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {assignee}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No one assigned</p>
          )}
        </div>

        {/* Priority section */}
        {issue.priority && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Priority
            </h4>
            <span
              className={cn(
                'inline-flex items-center rounded px-2 py-1 text-xs font-medium',
                getIssuePriorityBgClass(issue.priority),
                issue.priority === 'critical'
                  ? 'text-red-700 dark:text-red-400'
                  : issue.priority === 'high'
                    ? 'text-orange-700 dark:text-orange-400'
                    : issue.priority === 'medium'
                      ? 'text-yellow-700 dark:text-yellow-400'
                      : 'text-blue-700 dark:text-blue-400'
              )}
            >
              {getIssuePriorityText(issue.priority)}
            </span>
          </div>
        )}

        {/* Meta info section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Details
          </h4>
          <div className="space-y-2">
            <DetailRow label="Author" value={issue.author} />
            <DetailRow
              label="Created"
              value={issue.createdAt.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            />
            <DetailRow label="Updated" value={getRelativeTimeString(issue.updatedAt)} />
            {issue.closedAt && (
              <DetailRow
                label="Closed"
                value={issue.closedAt.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              />
            )}
            <DetailRow label="Comments" value={issue.commentCount.toString()} />
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
        {issue.state === 'open' && (
          <button
            type="button"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Create Branch
          </button>
        )}
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

IssuesView.displayName = 'IssuesView';

export { IssuesView, repoItemVariants, issueCardVariants };
