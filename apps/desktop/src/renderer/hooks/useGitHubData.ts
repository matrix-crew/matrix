/**
 * React hook for fetching GitHub Issues and Pull Requests data.
 *
 * Handles the full lifecycle: gh CLI status check, repo detection from
 * matrix sources, and issue/PR fetching with data transformation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Issue,
  PullRequest,
  Repository,
  IssueLabel,
  PRState,
  PRCIStatus,
} from '@/types/workspace';
import type { GitHubRepoDetection } from '@shared/types/ipc';

// ============================================================================
// Types
// ============================================================================

export interface GitHubStatus {
  installed: boolean;
  authenticated: boolean;
  user: string | null;
  error: string | null;
}

export interface UseGitHubDataOptions {
  /** Source IDs from the active matrix */
  sourceIds: string[];
  /** Whether the hook should actively fetch data */
  enabled?: boolean;
}

export interface UseGitHubDataResult {
  // Status
  status: GitHubStatus;
  isCheckingStatus: boolean;
  isLoading: boolean;

  // Data
  repositories: Repository[];
  issues: Issue[];
  pullRequests: PullRequest[];

  // Errors
  errors: string[];

  // Actions
  refetchIssues: () => Promise<void>;
  refetchPRs: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

// ============================================================================
// Transformers: gh CLI JSON -> workspace types
// ============================================================================

function buildRepoMap(detections: GitHubRepoDetection[]): Map<string, Repository> {
  const map = new Map<string, Repository>();
  for (const d of detections) {
    map.set(d.full_name, {
      id: d.source_id,
      name: d.repo,
      owner: d.owner,
      fullName: d.full_name,
      url: `https://github.com/${d.full_name}`,
      defaultBranch: 'main',
      isPrivate: false,
    });
  }
  return map;
}

function transformIssue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  repoMap: Map<string, Repository>
): Issue {
  const repoKey = `${raw._repository?.owner}/${raw._repository?.name}`;
  const repository = repoMap.get(repoKey) ?? {
    id: repoKey,
    name: raw._repository?.name ?? 'unknown',
    owner: raw._repository?.owner ?? 'unknown',
    fullName: repoKey,
    url: `https://github.com/${repoKey}`,
    defaultBranch: 'main',
    isPrivate: false,
  };

  const labels: IssueLabel[] = (raw.labels ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => ({
      name: l.name,
      color: l.color ? `#${l.color}` : '#666666',
      description: l.description,
    })
  );

  return {
    id: `${repoKey}#${raw.number}`,
    number: raw.number,
    title: raw.title,
    body: raw.body ?? '',
    repository,
    state: (raw.state ?? 'OPEN').toLowerCase() === 'open' ? 'open' : 'closed',
    labels,
    author: raw.author?.login ?? 'unknown',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignees: (raw.assignees ?? []).map((a: any) => a.login),
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    closedAt: raw.closedAt ? new Date(raw.closedAt) : undefined,
    commentCount: typeof raw.comments === 'number' ? raw.comments : (raw.comments?.totalCount ?? 0),
  };
}

function transformPR(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  repoMap: Map<string, Repository>
): PullRequest {
  const repoKey = `${raw._repository?.owner}/${raw._repository?.name}`;
  const repository = repoMap.get(repoKey) ?? {
    id: repoKey,
    name: raw._repository?.name ?? 'unknown',
    owner: raw._repository?.owner ?? 'unknown',
    fullName: repoKey,
    url: `https://github.com/${repoKey}`,
    defaultBranch: 'main',
    isPrivate: false,
  };

  // Determine state
  let state: PRState = 'open';
  if (raw.mergedAt) {
    state = 'merged';
  } else if ((raw.state ?? '').toUpperCase() === 'CLOSED') {
    state = 'closed';
  }

  // Determine CI status from statusCheckRollup
  let ciStatus: PRCIStatus = 'pending';
  const rollup = raw.statusCheckRollup;
  if (Array.isArray(rollup) && rollup.length > 0) {
    const first = rollup[0];
    const conclusion = (first.conclusion ?? '').toUpperCase();
    const status = (first.status ?? '').toUpperCase();
    if (conclusion === 'SUCCESS') ciStatus = 'success';
    else if (conclusion === 'FAILURE') ciStatus = 'failure';
    else if (conclusion === 'CANCELLED') ciStatus = 'cancelled';
    else if (status === 'IN_PROGRESS') ciStatus = 'running';
  }

  const labels: IssueLabel[] = (raw.labels ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (l: any) => ({
      name: l.name,
      color: l.color ? `#${l.color}` : '#666666',
      description: l.description,
    })
  );

  // Extract reviewers from reviewRequests
  const reviewers: string[] = (raw.reviewRequests ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => r.login ?? r.name)
    .filter(Boolean);

  return {
    id: `${repoKey}#${raw.number}`,
    number: raw.number,
    title: raw.title,
    body: raw.body ?? '',
    repository,
    state,
    sourceBranch: raw.headRefName ?? '',
    targetBranch: raw.baseRefName ?? '',
    author: raw.author?.login ?? 'unknown',
    labels,
    reviewers,
    reviews: [],
    ciStatus,
    isDraft: raw.isDraft ?? false,
    hasConflicts: raw.mergeable === 'CONFLICTING',
    commitCount: 0,
    filesChanged: raw.changedFiles ?? 0,
    additions: raw.additions ?? 0,
    deletions: raw.deletions ?? 0,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    mergedAt: raw.mergedAt ? new Date(raw.mergedAt) : undefined,
    closedAt: raw.closedAt ? new Date(raw.closedAt) : undefined,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useGitHubData({
  sourceIds,
  enabled = true,
}: UseGitHubDataOptions): UseGitHubDataResult {
  const [status, setStatus] = useState<GitHubStatus>({
    installed: false,
    authenticated: false,
    user: null,
    error: null,
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Keep a ref to repo map for transformations
  const repoMapRef = useRef<Map<string, Repository>>(new Map());
  // Track detected repos for fetching
  const detectedReposRef = useRef<GitHubRepoDetection[]>([]);

  // ---- Check gh CLI status ----
  const checkStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const response = await window.api.sendMessage({ type: 'github-check' });
      if (response.success && response.data) {
        const d = response.data as {
          installed: boolean;
          authenticated: boolean;
          user: string | null;
          error: string | null;
        };
        setStatus({
          installed: d.installed,
          authenticated: d.authenticated,
          user: d.user,
          error: d.error,
        });
      }
    } catch {
      setStatus({
        installed: false,
        authenticated: false,
        user: null,
        error: 'Failed to check gh CLI status',
      });
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  // ---- Detect repos from sources ----
  const detectRepos = useCallback(async () => {
    if (sourceIds.length === 0) {
      setRepositories([]);
      detectedReposRef.current = [];
      repoMapRef.current = new Map();
      return;
    }

    try {
      const response = await window.api.sendMessage({
        type: 'github-detect-repos',
        data: { source_ids: sourceIds },
      });

      if (response.success && response.data) {
        const data = response.data as { repos: GitHubRepoDetection[] };
        const detections = data.repos ?? [];
        detectedReposRef.current = detections;

        const map = buildRepoMap(detections);
        repoMapRef.current = map;
        setRepositories(Array.from(map.values()));
      }
    } catch {
      setErrors((prev) => [...prev, 'Failed to detect GitHub repositories']);
    }
  }, [sourceIds]);

  // ---- Fetch issues ----
  const fetchIssues = useCallback(async () => {
    const detections = detectedReposRef.current;
    if (detections.length === 0) {
      setIssues([]);
      return;
    }

    try {
      const repos = detections.map((d) => ({ owner: d.owner, repo: d.repo }));
      const response = await window.api.sendMessage({
        type: 'github-list-issues',
        data: { repos, state: 'all', limit: 100 },
      });

      if (response.success && response.data) {
        const data = response.data as {
          issues: Record<string, unknown>[];
          errors: string[] | null;
        };
        const transformed = (data.issues ?? []).map((raw) =>
          transformIssue(raw, repoMapRef.current)
        );
        setIssues(transformed);
        if (data.errors) {
          setErrors((prev) => [...prev, ...data.errors!]);
        }
      }
    } catch {
      setErrors((prev) => [...prev, 'Failed to fetch issues']);
    }
  }, []);

  // ---- Fetch PRs ----
  const fetchPRs = useCallback(async () => {
    const detections = detectedReposRef.current;
    if (detections.length === 0) {
      setPullRequests([]);
      return;
    }

    try {
      const repos = detections.map((d) => ({ owner: d.owner, repo: d.repo }));
      const response = await window.api.sendMessage({
        type: 'github-list-prs',
        data: { repos, state: 'all', limit: 100 },
      });

      if (response.success && response.data) {
        const data = response.data as {
          prs: Record<string, unknown>[];
          errors: string[] | null;
        };
        const transformed = (data.prs ?? []).map((raw) => transformPR(raw, repoMapRef.current));
        setPullRequests(transformed);
        if (data.errors) {
          setErrors((prev) => [...prev, ...data.errors!]);
        }
      }
    } catch {
      setErrors((prev) => [...prev, 'Failed to fetch pull requests']);
    }
  }, []);

  // ---- Full data load pipeline ----
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);
    try {
      await detectRepos();
      // fetchIssues/fetchPRs use detectedReposRef set by detectRepos
      await Promise.all([fetchIssues(), fetchPRs()]);
    } finally {
      setIsLoading(false);
    }
  }, [detectRepos, fetchIssues, fetchPRs]);

  // ---- Refetch actions ----
  const refetchIssues = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);
    try {
      await fetchIssues();
    } finally {
      setIsLoading(false);
    }
  }, [fetchIssues]);

  const refetchPRs = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);
    try {
      await fetchPRs();
    } finally {
      setIsLoading(false);
    }
  }, [fetchPRs]);

  const refetchAll = useCallback(async () => {
    await checkStatus();
    await loadData();
  }, [checkStatus, loadData]);

  // ---- Effects ----
  // Check status on mount
  useEffect(() => {
    if (enabled) {
      checkStatus();
    }
  }, [enabled, checkStatus]);

  // Load data when authenticated and sourceIds change
  useEffect(() => {
    if (enabled && status.authenticated && sourceIds.length > 0) {
      loadData();
    }
  }, [enabled, status.authenticated, sourceIds, loadData]);

  return {
    status,
    isCheckingStatus,
    isLoading,
    repositories,
    issues,
    pullRequests,
    errors,
    refetchIssues,
    refetchPRs,
    refetchAll,
  };
}
