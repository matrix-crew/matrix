import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  type IssuesViewState,
  type Issue,
  type Repository,
  type IssueFilter,
  type IssueState,
  filterIssues,
  groupIssuesByRepository,
  getIssuePriorityBgClass,
  getIssuePriorityText,
  getRelativeTimeString,
} from '@/types/workspace';
import { useGitHubData } from '@/hooks/useGitHubData';
import { GitHubSetupPrompt } from './GitHubSetupPrompt';

export interface IssuesViewProps {
  sourceIds: string[];
  initialState?: IssuesViewState;
  onStateChange?: (state: IssuesViewState) => void;
  className?: string;
}

const IssuesView: React.FC<IssuesViewProps> = ({
  sourceIds,
  initialState,
  onStateChange,
  className,
}) => {
  const {
    status,
    isCheckingStatus,
    hasCheckedOnce,
    isLoading: isGitHubLoading,
    repositories: ghRepositories,
    issues: ghIssues,
    errors,
    refetchAll,
    refreshIssues,
  } = useGitHubData({ sourceIds });

  const [selectedRepositoryId, setSelectedRepositoryId] = React.useState<string | null>(
    initialState?.selectedRepositoryId ?? null
  );
  const [filter, setFilter] = React.useState<IssueFilter>(
    initialState?.filter ?? { state: 'open' }
  );
  const [selectedIssueId, setSelectedIssueId] = React.useState<string | null>(
    initialState?.selectedIssueId ?? null
  );

  const currentUser = status.user ?? '';

  const notifyStateChange = React.useCallback(
    (overrides: Partial<IssuesViewState>) => {
      onStateChange?.({
        issues: ghIssues,
        repositories: ghRepositories,
        selectedRepositoryId,
        filter,
        selectedIssueId,
        isLoading: isGitHubLoading,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        currentUser,
        ...overrides,
      });
    },
    [
      onStateChange,
      ghIssues,
      ghRepositories,
      selectedRepositoryId,
      filter,
      selectedIssueId,
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
      refreshIssues();
    },
    [selectedRepositoryId, filter, notifyStateChange, refreshIssues]
  );

  const handleSelectIssue = React.useCallback(
    (issueId: string) => {
      const newId = selectedIssueId === issueId ? null : issueId;
      setSelectedIssueId(newId);
      notifyStateChange({ selectedIssueId: newId });
    },
    [selectedIssueId, notifyStateChange]
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
    (partial: Partial<IssueFilter>) => {
      const newFilter = { ...filter, ...partial };
      setFilter(newFilter);
      notifyStateChange({ filter: newFilter });
    },
    [filter, notifyStateChange]
  );

  const handleStateFilterChange = React.useCallback(
    (issueState: IssueState | undefined) => {
      if (filter.state === issueState) return;
      const newFilter = {
        ...filter,
        state: issueState,
      };
      setFilter(newFilter);
      notifyStateChange({ filter: newFilter });
    },
    [filter, notifyStateChange]
  );

  const filteredIssues = React.useMemo(() => {
    return filterIssues(ghIssues, filter, currentUser);
  }, [ghIssues, filter, currentUser]);

  const groupedIssues = React.useMemo(() => {
    return groupIssuesByRepository(filteredIssues);
  }, [filteredIssues]);

  const selectedIssue = React.useMemo(() => {
    return ghIssues.find((i) => i.id === selectedIssueId);
  }, [ghIssues, selectedIssueId]);

  const getRepository = React.useCallback(
    (repoId: string): Repository | undefined => {
      return ghRepositories.find((r) => r.id === repoId);
    },
    [ghRepositories]
  );

  const issueCountByState = React.useMemo(() => {
    const scoped = selectedRepositoryId
      ? ghIssues.filter((i) => i.repository.id === selectedRepositoryId)
      : ghIssues;
    const openCount = scoped.filter((i) => i.state === 'open').length;
    const closedCount = scoped.filter((i) => i.state === 'closed').length;
    return { open: openCount, closed: closedCount };
  }, [ghIssues, selectedRepositoryId]);

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
      aria-label="Issues View"
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
            <span className="text-[11px] opacity-60">{ghIssues.length}</span>
          </button>
          {ghRepositories.map((repo) => {
            const count = ghIssues.filter((i) => i.repository.id === repo.id).length;
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
              placeholder="Search issues..."
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
              count={issueCountByState.open}
              active={filter.state === 'open'}
              onClick={() => handleStateFilterChange('open')}
              activeClass="bg-green-500/15 text-green-400 border-green-500/30"
              icon={<IssueOpenIcon className="h-3.5 w-3.5" />}
            />
            <StateFilterPill
              label="Closed"
              count={issueCountByState.closed}
              active={filter.state === 'closed'}
              onClick={() => handleStateFilterChange('closed')}
              activeClass="bg-violet-500/15 text-violet-400 border-violet-500/30"
              icon={<IssueClosedIcon className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="h-4 w-px bg-border-default" />

          {/* Extra filters */}
          <FilterPill
            label="Assigned to me"
            active={filter.assignedToMe ?? false}
            onClick={() => handleFilterChange({ assignedToMe: !filter.assignedToMe })}
          />
        </div>
      </div>

      {/* Main content — list + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Issue list */}
        <div className="flex-1 overflow-y-auto p-3">
          {isGitHubLoading ? (
            <SkeletonCards />
          ) : filteredIssues.length === 0 ? (
            <EmptyState />
          ) : selectedRepositoryId ? (
            <div className="space-y-1.5">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  selected={issue.id === selectedIssueId}
                  onClick={() => handleSelectIssue(issue.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedIssues).map(([repoId, issues]) => {
                const repo = getRepository(repoId);
                if (!repo) return null;
                return (
                  <div key={repoId}>
                    <RepoGroupHeader repo={repo} count={issues.length} />
                    <div className="mt-1.5 space-y-1.5">
                      {issues.map((issue) => (
                        <IssueCard
                          key={issue.id}
                          issue={issue}
                          selected={issue.id === selectedIssueId}
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

        {/* Right detail panel */}
        {selectedIssue && (
          <IssueDetailsPanel
            issue={selectedIssue}
            onClose={() => handleSelectIssue(selectedIssue.id)}
          />
        )}
      </div>
    </div>
  );
};

/* ── Icons ──────────────────────────────────────────────────── */

const IssueOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    <path
      fillRule="evenodd"
      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z"
      clipRule="evenodd"
    />
  </svg>
);

const IssueClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.151-.043l4.25-5.5Z"
      clipRule="evenodd"
    />
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

/* ── Issue Card ─────────────────────────────────────────────── */

interface IssueCardProps {
  issue: Issue;
  selected: boolean;
  onClick: () => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, selected, onClick }) => {
  const relativeTime = getRelativeTimeString(issue.updatedAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border px-3.5 py-2.5 text-left transition-colors cursor-pointer',
        selected
          ? 'bg-accent-primary/8 border-accent-primary/25'
          : 'border-border-subtle hover:border-border-default hover:bg-base-800',
        issue.state === 'closed' && !selected && 'opacity-60'
      )}
      aria-selected={selected}
      role="option"
    >
      {/* Top row: icon + title + assignees */}
      <div className="flex items-start gap-2.5">
        {issue.state === 'open' ? (
          <IssueOpenIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
        ) : (
          <IssueClosedIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{issue.title}</span>
            {issue.priority && (
              <span
                className={cn(
                  'flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                  getIssuePriorityBgClass(issue.priority),
                  issue.priority === 'critical'
                    ? 'text-red-400'
                    : issue.priority === 'high'
                      ? 'text-orange-400'
                      : issue.priority === 'medium'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                )}
              >
                {getIssuePriorityText(issue.priority)}
              </span>
            )}
          </div>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {issue.labels.map((label) => (
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
            <span className="font-mono">#{issue.number}</span>
            <span>@{issue.author}</span>
            <span>{relativeTime}</span>
            {issue.commentCount > 0 && (
              <span className="flex items-center gap-1">
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
            )}
          </div>
        </div>

        {/* Assignees */}
        {issue.assignees.length > 0 && (
          <div className="flex -space-x-1 flex-shrink-0 mt-0.5">
            {issue.assignees.slice(0, 3).map((assignee, index) => (
              <div
                key={assignee}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-base-600 text-[11px] font-medium text-text-secondary ring-1 ring-base-900"
                title={assignee}
                style={{ zIndex: 3 - index }}
              >
                {assignee[0].toUpperCase()}
              </div>
            ))}
            {issue.assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-base-600 text-[11px] font-medium text-text-muted ring-1 ring-base-900">
                +{issue.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

/* ── Detail Panel (right sidebar) ───────────────────────────── */

interface IssueDetailsPanelProps {
  issue: Issue;
  onClose: () => void;
}

const IssueDetailsPanel: React.FC<IssueDetailsPanelProps> = ({ issue, onClose }) => (
  <div className="flex w-80 flex-shrink-0 flex-col border-l border-border-default bg-base-800 animate-slide-in">
    {/* Header */}
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {issue.state === 'open' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
              <IssueOpenIcon className="h-3 w-3" />
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-400">
              <IssueClosedIcon className="h-3 w-3" />
              Closed
            </span>
          )}
        </div>
        <h3 className="mt-2 text-sm font-semibold text-text-primary">{issue.title}</h3>
        <p className="mt-0.5 text-xs text-text-muted">
          #{issue.number} in {issue.repository.fullName}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-text-muted transition-colors hover:bg-base-700 hover:text-text-secondary"
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

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-5">
        {/* Description */}
        {issue.body && (
          <div>
            <SectionLabel>Description</SectionLabel>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {issue.body}
            </p>
          </div>
        )}

        {/* Labels */}
        {issue.labels.length > 0 && (
          <div>
            <SectionLabel>Labels</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {issue.labels.map((label) => (
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

        {/* Assignees */}
        <div>
          <SectionLabel>Assignees</SectionLabel>
          {issue.assignees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {issue.assignees.map((assignee) => (
                <div
                  key={assignee}
                  className="flex items-center gap-1.5 rounded-full bg-base-700 py-1 pl-1 pr-2.5"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-base-500 text-[11px] font-medium text-text-secondary">
                    {assignee[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-text-secondary">{assignee}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No one assigned</p>
          )}
        </div>

        {/* Priority */}
        {issue.priority && (
          <div>
            <SectionLabel>Priority</SectionLabel>
            <span
              className={cn(
                'inline-flex items-center rounded px-2 py-1 text-xs font-medium',
                getIssuePriorityBgClass(issue.priority),
                issue.priority === 'critical'
                  ? 'text-red-400'
                  : issue.priority === 'high'
                    ? 'text-orange-400'
                    : issue.priority === 'medium'
                      ? 'text-yellow-400'
                      : 'text-blue-400'
              )}
            >
              {getIssuePriorityText(issue.priority)}
            </span>
          </div>
        )}

        {/* Details */}
        <div>
          <SectionLabel>Details</SectionLabel>
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
    <div className="border-t border-border-subtle p-4">
      <div className="space-y-2">
        <button
          type="button"
          className="w-full rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-base-900 transition-colors hover:bg-accent-primary/90"
        >
          View in Browser
        </button>
        {issue.state === 'open' && (
          <button
            type="button"
            className="w-full rounded-lg border border-border-default bg-base-700 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-base-600"
          >
            Create Branch
          </button>
        )}
      </div>
    </div>
  </div>
);

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
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        clipRule="evenodd"
      />
    </svg>
    <p className="text-sm text-text-muted mt-3">No issues found</p>
    <p className="text-xs text-text-muted/70 mt-1">Try adjusting your filters</p>
  </div>
);

IssuesView.displayName = 'IssuesView';

export { IssuesView };
