import React from 'react';
import { cn } from '@/lib/utils';
import { FolderGit2, Globe, X, GitPullRequest, CircleDot } from 'lucide-react';
import type { Source } from '@shared/types/matrix';
import type { PullRequest, Issue, PRCIStatus } from '@/types/workspace';

export interface DashboardSourceCardProps {
  source: Source;
  myPRs: PullRequest[];
  myIssues: Issue[];
  ghConnected: boolean;
  onRemove: (source: Source) => void;
}

const ciDotColor: Record<PRCIStatus, string> = {
  success: 'bg-green-400',
  failure: 'bg-red-400',
  running: 'bg-yellow-400 animate-pulse',
  pending: 'bg-gray-400',
  cancelled: 'bg-gray-400',
};

export const DashboardSourceCard: React.FC<DashboardSourceCardProps> = ({
  source,
  myPRs,
  myIssues,
  ghConnected,
  onRemove,
}) => {
  const latestPR = myPRs[0];
  const latestIssue = myIssues[0];

  return (
    <div className="group relative flex flex-col rounded-lg border border-border-default bg-surface-raised p-4 transition-colors hover:border-base-400">
      {/* Remove button (hover) */}
      <button
        type="button"
        onClick={() => onRemove(source)}
        className="absolute top-3 right-3 hidden rounded p-1 text-text-muted transition-colors hover:bg-base-600 hover:text-red-400 group-hover:block"
        aria-label={`Remove ${source.name}`}
      >
        <X className="size-3.5" />
      </button>

      {/* Header: name + type badge */}
      <div className="mb-2 flex items-center gap-2 pr-6">
        <FolderGit2 className="size-4 flex-shrink-0 text-text-muted" />
        <span className="truncate text-sm font-semibold text-text-primary">{source.name}</span>
        <span
          className={cn(
            'flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            source.source_type === 'remote'
              ? 'bg-accent-cyan/10 text-accent-cyan'
              : 'bg-base-600 text-text-muted'
          )}
        >
          {source.source_type}
        </span>
      </div>

      {/* Path */}
      <p className="mb-1 truncate font-mono text-xs text-text-muted" title={source.path}>
        {source.path}
      </p>

      {/* Remote URL */}
      {source.url && (
        <div className="mb-1 flex items-center gap-1 text-xs text-text-secondary">
          <Globe className="size-3 flex-shrink-0" />
          <span className="truncate" title={source.url}>
            {source.url}
          </span>
        </div>
      )}

      {/* GitHub sections */}
      {ghConnected && (
        <>
          <div className="my-3 border-t border-border-subtle" />

          {/* My PRs section */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <GitPullRequest className="size-3" />
              <span>
                {myPRs.length} open PR{myPRs.length !== 1 ? 's' : ''}
              </span>
            </div>
            {latestPR && (
              <div className="mt-1 flex items-center gap-1.5 pl-[18px]">
                <span
                  className={cn('size-2 flex-shrink-0 rounded-full', ciDotColor[latestPR.ciStatus])}
                />
                <span className="truncate text-xs text-text-secondary" title={latestPR.title}>
                  {latestPR.title}
                </span>
              </div>
            )}
          </div>

          {/* My Issues section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <CircleDot className="size-3" />
              <span>
                {myIssues.length} assigned issue{myIssues.length !== 1 ? 's' : ''}
              </span>
            </div>
            {latestIssue && (
              <div className="mt-1 pl-[18px]">
                <span className="truncate text-xs text-text-secondary" title={latestIssue.title}>
                  {latestIssue.title}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

DashboardSourceCard.displayName = 'DashboardSourceCard';
