/**
 * React hook for fetching GitHub Issues and Pull Requests data.
 *
 * Handles the full lifecycle: gh CLI status check, repo detection from
 * matrix sources, and issue/PR fetching with data transformation.
 */

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import type {
  Issue,
  PullRequest,
  Repository,
  IssueLabel,
  PRState,
  PRCIStatus,
  CICheck,
  CheckRunStatus,
  CheckRunConclusion,
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
  /** True after the initial gh CLI status check has completed at least once */
  hasCheckedOnce: boolean;
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
  /** Refresh issues in background (no loading spinner) */
  refreshIssues: () => Promise<void>;
  /** Refresh PRs in background (no loading spinner) */
  refreshPRs: () => Promise<void>;
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

// ── GitHub Check Run value parsers ──────────────────────────────────────────

const VALID_STATUSES = new Set<CheckRunStatus>([
  'queued',
  'in_progress',
  'completed',
  'waiting',
  'requested',
  'pending',
]);
const VALID_CONCLUSIONS = new Set<CheckRunConclusion>([
  'success',
  'failure',
  'neutral',
  'cancelled',
  'skipped',
  'timed_out',
  'action_required',
]);

function parseCheckRunStatus(raw: string): CheckRunStatus {
  const v = raw.toLowerCase() as CheckRunStatus;
  return VALID_STATUSES.has(v) ? v : 'queued';
}

function parseCheckRunConclusion(raw: string): CheckRunConclusion {
  const v = raw.toLowerCase() as CheckRunConclusion;
  return VALID_CONCLUSIONS.has(v) ? v : 'failure';
}

/** Derive a single aggregate PRCIStatus from individual check runs (worst-case). */
function aggregateCIStatus(checks: CICheck[]): PRCIStatus {
  if (checks.length === 0) return 'pending';
  if (
    checks.some(
      (c) =>
        c.conclusion === 'failure' ||
        c.conclusion === 'timed_out' ||
        c.conclusion === 'action_required'
    )
  )
    return 'failure';
  if (checks.some((c) => c.conclusion === 'cancelled')) return 'cancelled';
  if (checks.some((c) => c.status !== 'completed')) return 'running';
  return 'success';
}

// ── Data transformers ───────────────────────────────────────────────────────

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

  // Parse individual CI checks from statusCheckRollup
  const rollup = raw.statusCheckRollup;
  const ciChecks: CICheck[] = Array.isArray(rollup)
    ? rollup.map((c: Record<string, unknown>) => ({
        name: (c.name as string) ?? 'Unknown',
        status: parseCheckRunStatus((c.status as string) ?? ''),
        conclusion: c.conclusion ? parseCheckRunConclusion(c.conclusion as string) : null,
        detailsUrl: (c.detailsUrl as string) ?? undefined,
        workflowName: (c.workflowName as string) ?? undefined,
      }))
    : [];

  // Derive aggregate CI status (worst-case across all checks)
  const ciStatus = aggregateCIStatus(ciChecks);

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
    ciChecks,
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
// Persistent status cache (localStorage — survives HMR + app restart)
// ============================================================================

const STATUS_CACHE_KEY = 'matrix:gh-status-cache';
/** Cache TTL: 5 minutes - within TTL, skip background revalidation entirely */
const STATUS_CACHE_TTL_MS = 5 * 60 * 1000;

interface StatusCacheEntry {
  status: GitHubStatus;
  timestamp: number;
}

/** Read cache synchronously from localStorage */
function readStatusCache(): StatusCacheEntry | null {
  try {
    const raw = localStorage.getItem(STATUS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StatusCacheEntry;
  } catch {
    return null;
  }
}

/** Write cache to localStorage */
function writeStatusCache(entry: StatusCacheEntry): void {
  try {
    localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — ignore
  }
}

// ============================================================================
// Persistent data cache (issues, PRs, repos — keyed by sourceIds)
// ============================================================================

/** Build a cache key from sorted source IDs */
function dataCacheKey(sourceIds: string[], suffix: string): string {
  const sorted = [...sourceIds].sort().join(',');
  return `matrix:gh-${suffix}:${sorted}`;
}

interface DataCacheEntry<T> {
  data: T;
  timestamp: number;
}

function readDataCache<T>(key: string): DataCacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as DataCacheEntry<T>;
  } catch {
    return null;
  }
}

function writeDataCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Storage full or unavailable — ignore
  }
}

/** Revive Date fields that were serialized as ISO strings by JSON.stringify */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reviveIssue(raw: any): Issue {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    closedAt: raw.closedAt ? new Date(raw.closedAt) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function revivePR(raw: any): PullRequest {
  return {
    ...raw,
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
  const initialCache = readStatusCache();

  const [status, setStatus] = useState<GitHubStatus>(
    initialCache?.status ?? {
      installed: false,
      authenticated: false,
      user: null,
      error: null,
    }
  );
  const [isCheckingStatus, setIsCheckingStatus] = useState(initialCache === null);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(initialCache !== null);
  const [isLoading, setIsLoading] = useState(false);

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Keep a ref to repo map for transformations
  const repoMapRef = useRef<Map<string, Repository>>(new Map());
  // Track detected repos for fetching
  const detectedReposRef = useRef<GitHubRepoDetection[]>([]);

  // ---- Fetch status from backend and update cache ----
  const fetchStatus = useCallback(async (): Promise<GitHubStatus> => {
    try {
      const response = await window.api.sendMessage({ type: 'github-check' });
      if (response.success && response.data) {
        const d = response.data as {
          installed: boolean;
          authenticated: boolean;
          user: string | null;
          error: string | null;
        };
        return {
          installed: d.installed,
          authenticated: d.authenticated,
          user: d.user,
          error: d.error,
        };
      }
    } catch {
      // fall through
    }
    return {
      installed: false,
      authenticated: false,
      user: null,
      error: 'Failed to check gh CLI status',
    };
  }, []);

  // ---- Foreground check (used by "Check Again" button) ----
  const checkStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const result = await fetchStatus();
      writeStatusCache({ status: result, timestamp: Date.now() });
      setStatus(result);
    } finally {
      setIsCheckingStatus(false);
      setHasCheckedOnce(true);
    }
  }, [fetchStatus]);

  // ---- Background revalidate (no loading indicator) ----
  const revalidateStatus = useCallback(async () => {
    const result = await fetchStatus();
    writeStatusCache({ status: result, timestamp: Date.now() });
    setStatus(result);
    setHasCheckedOnce(true);
  }, [fetchStatus]);

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
        writeDataCache(dataCacheKey(sourceIds, 'repos'), detections);
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
        writeDataCache(dataCacheKey(sourceIds, 'issues'), transformed);
        if (data.errors) {
          setErrors((prev) => [...prev, ...data.errors!]);
        }
      }
    } catch {
      setErrors((prev) => [...prev, 'Failed to fetch issues']);
    }
  }, [sourceIds]);

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
        writeDataCache(dataCacheKey(sourceIds, 'prs'), transformed);
        if (data.errors) {
          setErrors((prev) => [...prev, ...data.errors!]);
        }
      }
    } catch {
      setErrors((prev) => [...prev, 'Failed to fetch pull requests']);
    }
  }, [sourceIds]);

  // ---- Full data load pipeline ----
  const loadData = useCallback(
    async (background: boolean) => {
      if (!background) {
        setIsLoading(true);
      }
      setErrors([]);
      try {
        await detectRepos();
        // fetchIssues/fetchPRs use detectedReposRef set by detectRepos
        await Promise.all([fetchIssues(), fetchPRs()]);
      } finally {
        setIsLoading(false);
      }
    },
    [detectRepos, fetchIssues, fetchPRs]
  );

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

  // Background refresh (no loading spinner — keeps showing cached data)
  const refreshIssues = useCallback(async () => {
    await fetchIssues();
  }, [fetchIssues]);

  const refreshPRs = useCallback(async () => {
    await fetchPRs();
  }, [fetchPRs]);

  const refetchAll = useCallback(async () => {
    await checkStatus();
    await loadData(false);
  }, [checkStatus, loadData]);

  // ---- Effects ----
  // Stale-while-revalidate: use cache immediately, refresh in background
  useEffect(() => {
    if (!enabled) return;

    const cached = readStatusCache();
    if (cached) {
      // Show cached status immediately (already set via useState initializer)
      setStatus(cached.status);
      setIsCheckingStatus(false);
      setHasCheckedOnce(true);

      // Background revalidate if cache is stale
      if (Date.now() - cached.timestamp >= STATUS_CACHE_TTL_MS) {
        revalidateStatus();
      }
      return;
    }

    // No cache at all - first-ever check (foreground with loading indicator)
    checkStatus();
  }, [enabled, checkStatus, revalidateStatus]);

  // Sync cache restore: runs BEFORE paint so the user never sees stale data
  // from a previous repo when switching matrices
  useLayoutEffect(() => {
    if (!enabled || !status.authenticated || sourceIds.length === 0) {
      setIssues([]);
      setPullRequests([]);
      setRepositories([]);
      return;
    }

    const cachedRepos = readDataCache<GitHubRepoDetection[]>(dataCacheKey(sourceIds, 'repos'));
    const cachedIssues = readDataCache<Issue[]>(dataCacheKey(sourceIds, 'issues'));
    const cachedPRs = readDataCache<PullRequest[]>(dataCacheKey(sourceIds, 'prs'));

    if (cachedRepos) {
      detectedReposRef.current = cachedRepos.data;
      const map = buildRepoMap(cachedRepos.data);
      repoMapRef.current = map;
      setRepositories(Array.from(map.values()));
    }
    if (cachedIssues) setIssues(cachedIssues.data.map(reviveIssue));
    if (cachedPRs) setPullRequests(cachedPRs.data.map(revivePR));
  }, [enabled, status.authenticated, sourceIds]);

  // Async background refresh: fetch fresh data after cache is shown
  useEffect(() => {
    if (!enabled || !status.authenticated || sourceIds.length === 0) return;

    const hasCachedData =
      readDataCache(dataCacheKey(sourceIds, 'issues')) !== null ||
      readDataCache(dataCacheKey(sourceIds, 'prs')) !== null;

    loadData(hasCachedData);
  }, [enabled, status.authenticated, sourceIds, loadData]);

  return {
    status,
    isCheckingStatus,
    hasCheckedOnce,
    isLoading,
    repositories,
    issues,
    pullRequests,
    errors,
    refetchIssues,
    refetchPRs,
    refetchAll,
    refreshIssues,
    refreshPRs,
  };
}
