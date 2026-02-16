import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  type PRsViewState,
  type PullRequest,
  type PRCIStatus,
  type CICheck,
  type Repository,
  type PRFilter,
  type PRState,
  filterPRs,
  groupPRsByRepository,
  getPRCIStatusBgClass,
  getPRCIStatusText,
  getPRReviewSummary,
  getRelativeTimeString,
} from '@/types/workspace';
import { useGitHubData } from '@/hooks/useGitHubData';
import { GitHubSetupPrompt } from './GitHubSetupPrompt';

export interface PRsViewProps {
  sourceIds: string[];
  initialState?: PRsViewState;
  onStateChange?: (state: PRsViewState) => void;
  className?: string;
}

const PRsView: React.FC<PRsViewProps> = ({ sourceIds, initialState, onStateChange, className }) => {
  const {
    status,
    isCheckingStatus,
    hasCheckedOnce,
    isLoading: isGitHubLoading,
    repositories: ghRepositories,
    pullRequests: ghPullRequests,
    errors,
    refetchAll,
    refreshPRs,
  } = useGitHubData({ sourceIds });

  const contentRef = React.useRef<HTMLDivElement>(null);

  const [selectedRepositoryId, setSelectedRepositoryId] = React.useState<string | null>(
    initialState?.selectedRepositoryId ?? null
  );
  const [filter, setFilter] = React.useState<PRFilter>(initialState?.filter ?? { state: 'open' });
  const [selectedPRId, setSelectedPRId] = React.useState<string | null>(
    initialState?.selectedPRId ?? null
  );

  const currentUser = status.user ?? '';

  const notifyStateChange = React.useCallback(
    (overrides: Partial<PRsViewState>) => {
      onStateChange?.({
        pullRequests: ghPullRequests,
        repositories: ghRepositories,
        selectedRepositoryId,
        filter,
        selectedPRId,
        isLoading: isGitHubLoading,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        currentUser,
        ...overrides,
      });
    },
    [
      onStateChange,
      ghPullRequests,
      ghRepositories,
      selectedRepositoryId,
      filter,
      selectedPRId,
      isGitHubLoading,
      errors,
      currentUser,
    ]
  );

  const handleSelectRepository = React.useCallback(
    (repositoryId: string | null) => {
      const newRepoId = repositoryId === selectedRepositoryId ? null : repositoryId;
      const newFilter = { ...filter, repositoryId: newRepoId ?? undefined };
      setSelectedRepositoryId(newRepoId);
      setFilter(newFilter);
      notifyStateChange({ selectedRepositoryId: newRepoId, filter: newFilter });
      refreshPRs();
    },
    [selectedRepositoryId, filter, notifyStateChange, refreshPRs]
  );

  const handleSelectPR = React.useCallback(
    (prId: string) => {
      const newId = selectedPRId === prId ? null : prId;
      setSelectedPRId(newId);
      notifyStateChange({ selectedPRId: newId });
    },
    [selectedPRId, notifyStateChange]
  );

  const handleSearchChange = React.useCallback(
    (searchQuery: string) => {
      const newFilter = { ...filter, searchQuery: searchQuery || undefined };
      setFilter(newFilter);
      notifyStateChange({ filter: newFilter });
    },
    [filter, notifyStateChange]
  );

  const handleFilterChange = React.useCallback(
    (partial: Partial<PRFilter>) => {
      const newFilter = { ...filter, ...partial };
      setFilter(newFilter);
      notifyStateChange({ filter: newFilter });
    },
    [filter, notifyStateChange]
  );

  const handleStateFilterChange = React.useCallback(
    (prState: PRState | undefined) => {
      if (filter.state === prState) return;
      const newFilter = {
        ...filter,
        state: prState,
      };
      setFilter(newFilter);
      notifyStateChange({ filter: newFilter });
    },
    [filter, notifyStateChange]
  );

  const filteredPRs = React.useMemo(() => {
    return filterPRs(ghPullRequests, filter, currentUser);
  }, [ghPullRequests, filter, currentUser]);

  const groupedPRs = React.useMemo(() => {
    return groupPRsByRepository(filteredPRs);
  }, [filteredPRs]);

  const selectedPR = React.useMemo(() => {
    return ghPullRequests.find((pr) => pr.id === selectedPRId);
  }, [ghPullRequests, selectedPRId]);

  const getRepository = React.useCallback(
    (repoId: string): Repository | undefined => {
      return ghRepositories.find((r) => r.id === repoId);
    },
    [ghRepositories]
  );

  const prCountByState = React.useMemo(() => {
    const scoped = selectedRepositoryId
      ? ghPullRequests.filter((pr) => pr.repository.id === selectedRepositoryId)
      : ghPullRequests;
    const openCount = scoped.filter((pr) => pr.state === 'open').length;
    const mergedCount = scoped.filter((pr) => pr.state === 'merged').length;
    const closedCount = scoped.filter((pr) => pr.state === 'closed').length;
    return { open: openCount, merged: mergedCount, closed: closedCount };
  }, [ghPullRequests, selectedRepositoryId]);

  if (!hasCheckedOnce || !status.installed || !status.authenticated) {
    return (
      <GitHubSetupPrompt
        status={status}
        isCheckingStatus={isCheckingStatus}
        hasCheckedOnce={hasCheckedOnce}
        onRetry={refetchAll}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden', className)}
      role="region"
      aria-label="Pull Requests View"
    >
      {/* Header bar — wraps to 2 lines when narrow */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border-default bg-base-800 px-4 py-1.5 flex-shrink-0">
        {/* Repo tabs — takes full width when wrapped */}
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 scrollbar-none flex-1 basis-48">
          <button
            type="button"
            onClick={() => handleSelectRepository(null)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium transition-colors flex-shrink-0',
              selectedRepositoryId === null
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-base-700'
            )}
          >
            All
            <span className="text-[11px] opacity-60">{ghPullRequests.length}</span>
          </button>
          {ghRepositories.map((repo) => {
            const count = ghPullRequests.filter((pr) => pr.repository.id === repo.id).length;
            return (
              <button
                key={repo.id}
                type="button"
                onClick={() => handleSelectRepository(repo.id)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium transition-colors flex-shrink-0',
                  selectedRepositoryId === repo.id
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-base-700'
                )}
              >
                {repo.name}
                <span className="text-[11px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search + filters group — wraps below repo tabs when narrow */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search PRs..."
              value={filter.searchQuery ?? ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9 w-48 bg-transparent pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
            />
          </div>

          <div className="h-4 w-px bg-border-default" />

          {/* State filters */}
          <div className="flex items-center gap-2.5">
            <StateFilterPill
              label="Open"
              count={prCountByState.open}
              active={filter.state === 'open'}
              onClick={() => handleStateFilterChange('open')}
              activeClass="bg-green-500/15 text-green-400 border-green-500/30"
              icon={<PROpenIcon className="h-3.5 w-3.5" />}
            />
            <StateFilterPill
              label="Merged"
              count={prCountByState.merged}
              active={filter.state === 'merged'}
              onClick={() => handleStateFilterChange('merged')}
              activeClass="bg-violet-500/15 text-violet-400 border-violet-500/30"
              icon={<PRMergedIcon className="h-3.5 w-3.5" />}
            />
            <StateFilterPill
              label="Closed"
              count={prCountByState.closed}
              active={filter.state === 'closed'}
              onClick={() => handleStateFilterChange('closed')}
              activeClass="bg-rose-500/15 text-rose-400 border-rose-500/30"
              icon={<PRClosedIcon className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="h-4 w-px bg-border-default" />

          {/* Extra filters */}
          <FilterPill
            label="Review requested"
            active={filter.reviewRequestedFromMe ?? false}
            onClick={() =>
              handleFilterChange({ reviewRequestedFromMe: !filter.reviewRequestedFromMe })
            }
          />
        </div>
      </div>

      {/* Main content — list + detail panel */}
      <div ref={contentRef} className="flex flex-1 overflow-hidden">
        {/* PR list */}
        <div className="flex-1 overflow-y-auto p-3">
          {isGitHubLoading ? (
            <SkeletonCards />
          ) : filteredPRs.length === 0 ? (
            <EmptyState />
          ) : selectedRepositoryId ? (
            <div className="space-y-1.5">
              {filteredPRs.map((pr) => (
                <PRCard
                  key={pr.id}
                  pr={pr}
                  selected={pr.id === selectedPRId}
                  onClick={() => handleSelectPR(pr.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedPRs).map(([repoId, prs]) => {
                const repo = getRepository(repoId);
                if (!repo) return null;
                return (
                  <div key={repoId}>
                    <RepoGroupHeader repo={repo} count={prs.length} />
                    <div className="mt-1.5 space-y-1.5">
                      {prs.map((pr) => (
                        <PRCard
                          key={pr.id}
                          pr={pr}
                          selected={pr.id === selectedPRId}
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

        {/* Right detail panel */}
        {selectedPR && (
          <PRDetailsPanel
            pr={selectedPR}
            onClose={() => handleSelectPR(selectedPR.id)}
            containerWidth={contentRef.current?.clientWidth}
          />
        )}
      </div>
    </div>
  );
};

/* ── Icons ──────────────────────────────────────────────────── */

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

/* ── Filter components ──────────────────────────────────────── */

interface StateFilterPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  activeClass: string;
  icon: React.ReactNode;
}

const StateFilterPill: React.FC<StateFilterPillProps> = ({
  label,
  count,
  active,
  onClick,
  activeClass,
  icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
      active
        ? activeClass
        : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-base-700'
    )}
  >
    {icon}
    {label}
    <span className="text-xs opacity-70">{count}</span>
  </button>
);

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
      active
        ? 'bg-accent-primary/15 text-accent-primary border-accent-primary/30'
        : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-base-700'
    )}
  >
    {label}
  </button>
);

/* ── PR Card ────────────────────────────────────────────────── */

interface PRCardProps {
  pr: PullRequest;
  selected: boolean;
  onClick: () => void;
}

const PRCard: React.FC<PRCardProps> = ({ pr, selected, onClick }) => {
  const relativeTime = getRelativeTimeString(pr.updatedAt);
  const reviewSummary = getPRReviewSummary(pr.reviews);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border px-3.5 py-2.5 text-left transition-colors cursor-pointer',
        selected
          ? 'bg-accent-primary/8 border-accent-primary/25'
          : 'border-border-subtle hover:border-border-default hover:bg-base-800',
        pr.state === 'merged' && !selected && 'opacity-60',
        pr.state === 'closed' && !selected && 'opacity-50'
      )}
      aria-selected={selected}
      role="option"
    >
      {/* Top row: icon + title + badges + CI/reviews */}
      <div className="flex items-start gap-2.5">
        {pr.state === 'open' ? (
          <PROpenIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
        ) : pr.state === 'merged' ? (
          <PRMergedIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
        ) : (
          <PRClosedIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{pr.title}</span>
            {pr.isDraft && (
              <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-base-600 text-text-muted">
                Draft
              </span>
            )}
            {pr.hasConflicts && (
              <span className="flex-shrink-0 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium bg-rose-500/15 text-rose-400">
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

          {/* Branch info */}
          <div className="mt-1 text-xs text-text-muted">
            <span className="font-mono">{pr.sourceBranch}</span>
            {' \u2192 '}
            <span className="font-mono">{pr.targetBranch}</span>
          </div>

          {/* Labels */}
          {pr.labels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pr.labels.map((label) => (
                <span
                  key={label.name}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    border: `1px solid ${label.color}30`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-text-muted">
            <span className="font-mono">#{pr.number}</span>
            <span>@{pr.author}</span>
            <span>{relativeTime}</span>
            {pr.commitCount > 0 && (
              <span>
                {pr.commitCount} commit{pr.commitCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Right side: CI + reviews + reviewers */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 mt-0.5">
          <CIStatusBadge status={pr.ciStatus} checks={pr.ciChecks} />

          {pr.reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              {reviewSummary.approved > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-green-400">
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
                <span className="flex items-center gap-0.5 text-xs text-rose-400">
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

          {pr.reviewers.length > 0 && (
            <div className="flex -space-x-1">
              {pr.reviewers.slice(0, 3).map((reviewer, index) => (
                <div
                  key={reviewer}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-base-600 text-[10px] font-medium text-text-secondary ring-1 ring-base-900"
                  title={reviewer}
                  style={{ zIndex: 3 - index }}
                >
                  {reviewer[0].toUpperCase()}
                </div>
              ))}
              {pr.reviewers.length > 3 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-base-600 text-[10px] font-medium text-text-muted ring-1 ring-base-900">
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

/* ── CI Status Badge ────────────────────────────────────────── */

interface CIStatusBadgeProps {
  status: PullRequest['ciStatus'];
  checks?: CICheck[];
}

const CIStatusBadge: React.FC<CIStatusBadgeProps> = ({ status, checks }) => {
  const totalCount = checks?.length ?? 0;
  const passedCount =
    totalCount > 0 ? checks!.filter((c) => checkToDisplayStatus(c) === 'success').length : 0;
  const showCount = totalCount > 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        getPRCIStatusBgClass(status),
        status === 'success'
          ? 'text-green-400'
          : status === 'failure'
            ? 'text-rose-400'
            : status === 'running'
              ? 'text-amber-400'
              : 'text-text-muted'
      )}
    >
      <CIStatusIcon status={status} />
      {showCount ? `${passedCount}/${totalCount}` : getPRCIStatusText(status)}
    </span>
  );
};

const CIStatusIcon: React.FC<{ status: PullRequest['ciStatus']; className?: string }> = ({
  status,
  className,
}) => {
  if (status === 'success')
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className={cn('h-3 w-3', className)}
      >
        <path
          fillRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.151-.043l4.25-5.5Z"
          clipRule="evenodd"
        />
      </svg>
    );
  if (status === 'failure')
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className={cn('h-3 w-3', className)}
      >
        <path
          fillRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 0L8 9.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 1.06-1.06L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 0 1 0 1.06Z"
          clipRule="evenodd"
        />
      </svg>
    );
  if (status === 'running')
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className={cn('h-3 w-3 animate-spin', className)}
      >
        <path
          fillRule="evenodd"
          d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.274Z"
          clipRule="evenodd"
        />
      </svg>
    );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn('h-3 w-3', className)}
    >
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path
        fillRule="evenodd"
        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

/** Map a single CICheck to a display-level PRCIStatus. */
function checkToDisplayStatus(check: CICheck): PRCIStatus {
  if (check.status !== 'completed') return check.status === 'in_progress' ? 'running' : 'pending';
  switch (check.conclusion) {
    case 'success':
    case 'neutral':
    case 'skipped':
      return 'success';
    case 'failure':
    case 'timed_out':
    case 'action_required':
      return 'failure';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

const CICheckRow: React.FC<{ check: CICheck }> = ({ check }) => {
  const checkStatus = checkToDisplayStatus(check);

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
        check.detailsUrl ? 'hover:bg-base-700 transition-colors cursor-pointer' : ''
      )}
    >
      <CIStatusIcon status={checkStatus} />
      <span className="flex-1 min-w-0 truncate text-text-secondary">{check.name}</span>
      {check.detailsUrl && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3 w-3 flex-shrink-0 text-text-muted"
        >
          <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
        </svg>
      )}
    </div>
  );

  if (check.detailsUrl) {
    return (
      <a
        href={check.detailsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        title={`Open ${check.name} in browser`}
      >
        {content}
      </a>
    );
  }

  return content;
};

/* ── Detail Panel (right sidebar) ───────────────────────────── */

const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_WIDTH = 960;
const PANEL_DEFAULT_WIDTH = 380;

interface PRDetailsPanelProps {
  pr: PullRequest;
  onClose: () => void;
  containerWidth?: number;
}

const PRDetailsPanel: React.FC<PRDetailsPanelProps> = ({ pr, onClose, containerWidth }) => {
  const reviewSummary = getPRReviewSummary(pr.reviews);
  const [width, setWidth] = React.useState(() => {
    if (containerWidth) {
      return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, Math.floor(containerWidth / 2)));
    }
    return PANEL_DEFAULT_WIDTH;
  });
  const isResizing = React.useRef(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !panelRef.current) return;
      const panelRight = panelRef.current.getBoundingClientRect().right;
      const newWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, panelRight - e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return (
    <div
      ref={panelRef}
      style={{ width }}
      className="relative flex flex-shrink-0 flex-col border-l border-border-default bg-base-800 animate-slide-in"
    >
      {/* Resize handle (left edge) */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-accent-primary/30 active:bg-accent-primary/50"
      />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {pr.state === 'open' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                <PROpenIcon className="h-3 w-3" />
                Open
              </span>
            ) : pr.state === 'merged' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-400">
                <PRMergedIcon className="h-3 w-3" />
                Merged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400">
                <PRClosedIcon className="h-3 w-3" />
                Closed
              </span>
            )}
            {pr.isDraft && (
              <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-base-600 text-text-muted">
                Draft
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-text-primary">{pr.title}</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            #{pr.number} in {pr.repository.fullName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-text-muted transition-colors hover:bg-base-700 hover:text-text-secondary"
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {/* Branches */}
          <div>
            <SectionLabel>Branches</SectionLabel>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded bg-base-700 px-2 py-0.5 font-mono text-xs text-text-secondary">
                {pr.sourceBranch}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3 text-text-muted"
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="rounded bg-base-700 px-2 py-0.5 font-mono text-xs text-text-secondary">
                {pr.targetBranch}
              </span>
            </div>
            {pr.hasConflicts && (
              <p className="mt-2 flex items-center gap-1 text-xs text-rose-400">
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
            <SectionLabel>CI Status</SectionLabel>
            <CIStatusBadge status={pr.ciStatus} checks={pr.ciChecks} />
            {pr.ciChecks.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {pr.ciChecks.map((check) => (
                  <CICheckRow key={check.name} check={check} />
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {pr.body && (
            <div>
              <SectionLabel>Description</SectionLabel>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {pr.body}
              </p>
            </div>
          )}

          {/* Labels */}
          {pr.labels.length > 0 && (
            <div>
              <SectionLabel>Labels</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {pr.labels.map((label) => (
                  <span
                    key={label.name}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      border: `1px solid ${label.color}30`,
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
            <SectionLabel>Reviewers</SectionLabel>
            {pr.reviewers.length > 0 ? (
              <div className="space-y-2">
                {pr.reviewers.map((reviewer) => {
                  const review = pr.reviews.find((r) => r.reviewer === reviewer);
                  return (
                    <div key={reviewer} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-base-600 text-xs font-medium text-text-secondary">
                          {reviewer[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-text-secondary">{reviewer}</span>
                      </div>
                      {review && (
                        <span
                          className={cn(
                            'text-xs font-medium',
                            review.state === 'approved'
                              ? 'text-green-400'
                              : review.state === 'changes_requested'
                                ? 'text-rose-400'
                                : review.state === 'commented'
                                  ? 'text-text-muted'
                                  : 'text-amber-400'
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
                {(reviewSummary.approved > 0 || reviewSummary.changesRequested > 0) && (
                  <div className="flex items-center gap-3 pt-0.5 text-xs">
                    {reviewSummary.approved > 0 && (
                      <span className="text-green-400">{reviewSummary.approved} approved</span>
                    )}
                    {reviewSummary.changesRequested > 0 && (
                      <span className="text-rose-400">
                        {reviewSummary.changesRequested} changes requested
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No reviewers assigned</p>
            )}
          </div>

          {/* Changes */}
          <div>
            <SectionLabel>Changes</SectionLabel>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-text-muted">{pr.filesChanged} files</span>
              <span className="text-green-400">+{pr.additions}</span>
              <span className="text-rose-400">-{pr.deletions}</span>
            </div>
          </div>

          {/* Details */}
          <div>
            <SectionLabel>Details</SectionLabel>
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
      <div className="border-t border-border-subtle p-4">
        <div className="space-y-2">
          <button
            type="button"
            className="w-full rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-base-900 transition-colors hover:bg-accent-primary/90"
          >
            View in Browser
          </button>
          {pr.state === 'open' && (
            <button
              type="button"
              className="w-full rounded-lg border border-border-default bg-base-700 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-base-600"
            >
              Checkout Branch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Shared sub-components ──────────────────────────────────── */

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{children}</h4>
);

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-text-muted">{label}</span>
    <span className="text-sm text-text-primary">{value}</span>
  </div>
);

interface RepoGroupHeaderProps {
  repo: Repository;
  count: number;
}

const RepoGroupHeader: React.FC<RepoGroupHeaderProps> = ({ repo, count }) => (
  <div className="flex items-center gap-2 px-1 pb-1">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-3.5 w-3.5 text-text-muted"
    >
      <path
        fillRule="evenodd"
        d="M2 4.25A2.25 2.25 0 0 1 4.25 2h7.5A2.25 2.25 0 0 1 14 4.25v5.5A2.25 2.25 0 0 1 11.75 12h-1.312c.1.128.21.248.328.36a.75.75 0 0 1-.234 1.238 4.992 4.992 0 0 1-3.064 0 .75.75 0 0 1-.234-1.238c.118-.111.228-.232.328-.36H4.25A2.25 2.25 0 0 1 2 9.75v-5.5Zm2.25-.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-7.5Z"
        clipRule="evenodd"
      />
    </svg>
    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
      {repo.fullName}
    </span>
    <span className="text-xs text-text-muted/70">({count})</span>
  </div>
);

/* ── Loading / Empty states ─────────────────────────────────── */

const SkeletonCards: React.FC = () => (
  <div className="space-y-1.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="rounded-lg border border-border-subtle p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 h-4 w-4 rounded-full bg-base-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-base-700 animate-pulse" />
            <div className="h-3 w-2/5 rounded bg-base-700/60 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-base-700/60 animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-64">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-12 w-12 text-base-500"
    >
      <path
        fillRule="evenodd"
        d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
        clipRule="evenodd"
      />
    </svg>
    <p className="text-sm text-text-muted mt-3">No pull requests found</p>
    <p className="text-xs text-text-muted/70 mt-1">Try adjusting your filters</p>
  </div>
);

PRsView.displayName = 'PRsView';

export { PRsView };
