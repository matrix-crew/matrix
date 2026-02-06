/**
 * Workspace Type Definitions
 *
 * Type definitions for the aggregated git workflow views in the Workspace tab.
 * Provides types for branches, issues, and pull requests across matrix repositories.
 */

// ============================================================================
// Repository Types
// ============================================================================

/**
 * Repository information
 */
export interface Repository {
  /** Unique identifier for the repository */
  id: string;
  /** Display name of the repository */
  name: string;
  /** Repository owner (org or user) */
  owner: string;
  /** Full repository path (owner/name) */
  fullName: string;
  /** Repository URL */
  url: string;
  /** Default branch name */
  defaultBranch: string;
  /** Whether this is a private repository */
  isPrivate: boolean;
}

// ============================================================================
// Branch Types
// ============================================================================

/**
 * Branch status relative to default branch
 */
export type BranchStatus = 'ahead' | 'behind' | 'diverged' | 'up-to-date';

/**
 * Branch protection status
 */
export type BranchProtection = 'protected' | 'unprotected';

/**
 * Git branch information
 */
export interface Branch {
  /** Unique identifier for the branch */
  id: string;
  /** Branch name */
  name: string;
  /** Repository this branch belongs to */
  repository: Repository;
  /** Whether this is the default branch */
  isDefault: boolean;
  /** Whether this is the currently checked out branch */
  isCurrent: boolean;
  /** Branch protection status */
  protection: BranchProtection;
  /** Commits ahead of default branch */
  commitsAhead: number;
  /** Commits behind default branch */
  commitsBehind: number;
  /** Status relative to default branch */
  status: BranchStatus;
  /** Last commit SHA */
  lastCommitSha: string;
  /** Last commit message */
  lastCommitMessage: string;
  /** Last commit author */
  lastCommitAuthor: string;
  /** Last commit date */
  lastCommitDate: Date;
  /** Associated pull request (if any) */
  pullRequestId?: string;
}

/**
 * Branch filter options
 */
export interface BranchFilter {
  /** Filter by repository */
  repositoryId?: string;
  /** Filter by branch status */
  status?: BranchStatus;
  /** Filter by protection status */
  protection?: BranchProtection;
  /** Search query for branch name */
  searchQuery?: string;
  /** Show only branches with open PRs */
  hasOpenPR?: boolean;
  /** Show only current branches */
  showCurrentOnly?: boolean;
}

/**
 * Branches view state
 */
export interface BranchesViewState {
  /** All branches from matrix repositories */
  branches: Branch[];
  /** All repositories in the matrix */
  repositories: Repository[];
  /** Currently selected repository filter */
  selectedRepositoryId: string | null;
  /** Current filter options */
  filter: BranchFilter;
  /** Currently selected branch ID */
  selectedBranchId: string | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  errorMessage: string | null;
}

// ============================================================================
// Issue Types
// ============================================================================

/**
 * Issue state
 */
export type IssueState = 'open' | 'closed';

/**
 * Issue priority
 */
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Issue label
 */
export interface IssueLabel {
  /** Label name */
  name: string;
  /** Label color (hex) */
  color: string;
  /** Label description */
  description?: string;
}

/**
 * Git issue information
 */
export interface Issue {
  /** Unique identifier for the issue */
  id: string;
  /** Issue number in the repository */
  number: number;
  /** Issue title */
  title: string;
  /** Issue body/description */
  body: string;
  /** Repository this issue belongs to */
  repository: Repository;
  /** Issue state */
  state: IssueState;
  /** Issue priority */
  priority?: IssuePriority;
  /** Issue labels */
  labels: IssueLabel[];
  /** Issue author */
  author: string;
  /** Assigned users */
  assignees: string[];
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
  /** Close date (if closed) */
  closedAt?: Date;
  /** Number of comments */
  commentCount: number;
}

/**
 * Issue filter options
 */
export interface IssueFilter {
  /** Filter by repository */
  repositoryId?: string;
  /** Filter by issue state */
  state?: IssueState;
  /** Filter by priority */
  priority?: IssuePriority;
  /** Search query for issue title or body */
  searchQuery?: string;
  /** Filter by label name */
  labelName?: string;
  /** Show only issues assigned to current user */
  assignedToMe?: boolean;
  /** Show only issues created by current user */
  createdByMe?: boolean;
}

/**
 * Issues view state
 */
export interface IssuesViewState {
  /** All issues from matrix repositories */
  issues: Issue[];
  /** All repositories in the matrix */
  repositories: Repository[];
  /** Currently selected repository filter */
  selectedRepositoryId: string | null;
  /** Current filter options */
  filter: IssueFilter;
  /** Currently selected issue ID */
  selectedIssueId: string | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  errorMessage: string | null;
  /** Current user (for assignee filtering) */
  currentUser: string;
}

// ============================================================================
// Pull Request Types
// ============================================================================

/**
 * Pull request state
 */
export type PRState = 'open' | 'closed' | 'merged';

/**
 * Pull request review state
 */
export type PRReviewState = 'pending' | 'approved' | 'changes_requested' | 'commented';

/**
 * Pull request CI status
 */
export type PRCIStatus = 'pending' | 'running' | 'success' | 'failure' | 'cancelled';

/**
 * Pull request review
 */
export interface PRReview {
  /** Reviewer username */
  reviewer: string;
  /** Review state */
  state: PRReviewState;
  /** Review timestamp */
  submittedAt: Date;
}

/**
 * Pull request information
 */
export interface PullRequest {
  /** Unique identifier for the PR */
  id: string;
  /** PR number in the repository */
  number: number;
  /** PR title */
  title: string;
  /** PR body/description */
  body: string;
  /** Repository this PR belongs to */
  repository: Repository;
  /** PR state */
  state: PRState;
  /** Source branch name */
  sourceBranch: string;
  /** Target branch name */
  targetBranch: string;
  /** PR author */
  author: string;
  /** PR labels */
  labels: IssueLabel[];
  /** Assigned reviewers */
  reviewers: string[];
  /** Reviews received */
  reviews: PRReview[];
  /** CI status */
  ciStatus: PRCIStatus;
  /** Whether PR is a draft */
  isDraft: boolean;
  /** Whether PR has conflicts */
  hasConflicts: boolean;
  /** Number of commits */
  commitCount: number;
  /** Number of files changed */
  filesChanged: number;
  /** Lines added */
  additions: number;
  /** Lines removed */
  deletions: number;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
  /** Merge date (if merged) */
  mergedAt?: Date;
  /** Close date (if closed without merge) */
  closedAt?: Date;
}

/**
 * Pull request filter options
 */
export interface PRFilter {
  /** Filter by repository */
  repositoryId?: string;
  /** Filter by PR state */
  state?: PRState;
  /** Filter by CI status */
  ciStatus?: PRCIStatus;
  /** Search query for PR title or body */
  searchQuery?: string;
  /** Filter by label name */
  labelName?: string;
  /** Show only PRs authored by current user */
  authoredByMe?: boolean;
  /** Show only PRs where current user is reviewer */
  reviewRequestedFromMe?: boolean;
  /** Show only draft PRs */
  isDraft?: boolean;
  /** Show only PRs with conflicts */
  hasConflicts?: boolean;
}

/**
 * Pull requests view state
 */
export interface PRsViewState {
  /** All pull requests from matrix repositories */
  pullRequests: PullRequest[];
  /** All repositories in the matrix */
  repositories: Repository[];
  /** Currently selected repository filter */
  selectedRepositoryId: string | null;
  /** Current filter options */
  filter: PRFilter;
  /** Currently selected PR ID */
  selectedPRId: string | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  errorMessage: string | null;
  /** Current user (for author/reviewer filtering) */
  currentUser: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new repository object
 *
 * @param name - Repository name
 * @param owner - Repository owner
 * @param defaultBranch - Default branch name
 * @returns A new Repository object
 */
export function createRepository(
  name: string,
  owner: string,
  defaultBranch: string = 'main'
): Repository {
  return {
    id: crypto.randomUUID(),
    name,
    owner,
    fullName: `${owner}/${name}`,
    url: `https://github.com/${owner}/${name}`,
    defaultBranch,
    isPrivate: false,
  };
}

/**
 * Create a new branch object
 *
 * @param name - Branch name
 * @param repository - Repository the branch belongs to
 * @param options - Additional branch options
 * @returns A new Branch object
 */
export function createBranch(
  name: string,
  repository: Repository,
  options: Partial<Omit<Branch, 'id' | 'name' | 'repository'>> = {}
): Branch {
  const isDefault = name === repository.defaultBranch;
  const commitsAhead = options.commitsAhead ?? 0;
  const commitsBehind = options.commitsBehind ?? 0;

  let status: BranchStatus = 'up-to-date';
  if (commitsAhead > 0 && commitsBehind > 0) {
    status = 'diverged';
  } else if (commitsAhead > 0) {
    status = 'ahead';
  } else if (commitsBehind > 0) {
    status = 'behind';
  }

  return {
    id: crypto.randomUUID(),
    name,
    repository,
    isDefault,
    isCurrent: options.isCurrent ?? false,
    protection: options.protection ?? 'unprotected',
    commitsAhead,
    commitsBehind,
    status,
    lastCommitSha: options.lastCommitSha ?? crypto.randomUUID().slice(0, 8),
    lastCommitMessage: options.lastCommitMessage ?? 'Initial commit',
    lastCommitAuthor: options.lastCommitAuthor ?? 'developer',
    lastCommitDate: options.lastCommitDate ?? new Date(),
    pullRequestId: options.pullRequestId,
  };
}

/**
 * Get branch status color class
 *
 * @param status - Branch status
 * @returns Tailwind CSS color class
 */
export function getBranchStatusColorClass(status: BranchStatus): string {
  switch (status) {
    case 'ahead':
      return 'text-green-500';
    case 'behind':
      return 'text-yellow-500';
    case 'diverged':
      return 'text-orange-500';
    case 'up-to-date':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get branch status background class
 *
 * @param status - Branch status
 * @returns Tailwind CSS background color class
 */
export function getBranchStatusBgClass(status: BranchStatus): string {
  switch (status) {
    case 'ahead':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'behind':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'diverged':
      return 'bg-orange-100 dark:bg-orange-900/30';
    case 'up-to-date':
      return 'bg-gray-100 dark:bg-gray-700';
    default:
      return 'bg-gray-100 dark:bg-gray-700';
  }
}

/**
 * Get branch status text
 *
 * @param status - Branch status
 * @param ahead - Commits ahead
 * @param behind - Commits behind
 * @returns Human-readable status text
 */
export function getBranchStatusText(
  status: BranchStatus,
  ahead: number,
  behind: number
): string {
  switch (status) {
    case 'ahead':
      return `${ahead} commit${ahead !== 1 ? 's' : ''} ahead`;
    case 'behind':
      return `${behind} commit${behind !== 1 ? 's' : ''} behind`;
    case 'diverged':
      return `${ahead} ahead, ${behind} behind`;
    case 'up-to-date':
      return 'Up to date';
    default:
      return 'Unknown';
  }
}

/**
 * Filter branches based on filter options
 *
 * @param branches - Array of branches to filter
 * @param filter - Filter options
 * @returns Filtered branches
 */
export function filterBranches(branches: Branch[], filter: BranchFilter): Branch[] {
  return branches.filter((branch) => {
    if (filter.repositoryId && branch.repository.id !== filter.repositoryId) {
      return false;
    }
    if (filter.status && branch.status !== filter.status) {
      return false;
    }
    if (filter.protection && branch.protection !== filter.protection) {
      return false;
    }
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      if (!branch.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filter.hasOpenPR && !branch.pullRequestId) {
      return false;
    }
    if (filter.showCurrentOnly && !branch.isCurrent) {
      return false;
    }
    return true;
  });
}

/**
 * Group branches by repository
 *
 * @param branches - Array of branches
 * @returns Branches grouped by repository
 */
export function groupBranchesByRepository(
  branches: Branch[]
): Record<string, Branch[]> {
  return branches.reduce(
    (acc, branch) => {
      const repoId = branch.repository.id;
      if (!acc[repoId]) {
        acc[repoId] = [];
      }
      acc[repoId].push(branch);
      return acc;
    },
    {} as Record<string, Branch[]>
  );
}

/**
 * Create initial branches view state with sample data
 *
 * @returns Initial BranchesViewState with sample data
 */
export function createInitialBranchesState(): BranchesViewState {
  // Sample repositories
  const repositories: Repository[] = [
    createRepository('matrix', 'theo'),
    createRepository('desktop', 'theo'),
    createRepository('shared', 'theo'),
  ];

  // Sample branches for each repository
  const branches: Branch[] = [
    // Matrix repo branches
    createBranch('main', repositories[0], {
      isCurrent: true,
      protection: 'protected',
      lastCommitMessage: 'chore: update dependencies',
      lastCommitAuthor: 'theo',
    }),
    createBranch('feature/workspace-tabs', repositories[0], {
      commitsAhead: 5,
      commitsBehind: 2,
      lastCommitMessage: 'feat: add workspace tab navigation',
      lastCommitAuthor: 'developer',
      pullRequestId: 'pr-123',
    }),
    createBranch('fix/ipc-handler', repositories[0], {
      commitsAhead: 2,
      lastCommitMessage: 'fix: resolve IPC timeout issue',
      lastCommitAuthor: 'contributor',
    }),

    // Desktop repo branches
    createBranch('main', repositories[1], {
      protection: 'protected',
      lastCommitMessage: 'docs: update README',
      lastCommitAuthor: 'theo',
    }),
    createBranch('feature/dark-mode', repositories[1], {
      commitsAhead: 8,
      commitsBehind: 1,
      lastCommitMessage: 'feat: implement dark mode toggle',
      lastCommitAuthor: 'designer',
      pullRequestId: 'pr-456',
    }),
    createBranch('refactor/components', repositories[1], {
      commitsAhead: 12,
      commitsBehind: 5,
      lastCommitMessage: 'refactor: extract common components',
      lastCommitAuthor: 'developer',
    }),

    // Shared repo branches
    createBranch('main', repositories[2], {
      isCurrent: true,
      protection: 'protected',
      lastCommitMessage: 'feat: add type exports',
      lastCommitAuthor: 'theo',
    }),
    createBranch('feature/utils', repositories[2], {
      commitsAhead: 3,
      lastCommitMessage: 'feat: add utility functions',
      lastCommitAuthor: 'developer',
    }),
  ];

  return {
    branches,
    repositories,
    selectedRepositoryId: null,
    filter: {},
    selectedBranchId: null,
    isLoading: false,
    errorMessage: null,
  };
}

// ============================================================================
// Issue Helper Functions
// ============================================================================

/**
 * Create a new issue object
 *
 * @param title - Issue title
 * @param repository - Repository the issue belongs to
 * @param options - Additional issue options
 * @returns A new Issue object
 */
export function createIssue(
  title: string,
  repository: Repository,
  options: Partial<Omit<Issue, 'id' | 'title' | 'repository'>> = {}
): Issue {
  return {
    id: crypto.randomUUID(),
    number: options.number ?? Math.floor(Math.random() * 1000) + 1,
    title,
    body: options.body ?? '',
    repository,
    state: options.state ?? 'open',
    priority: options.priority,
    labels: options.labels ?? [],
    author: options.author ?? 'developer',
    assignees: options.assignees ?? [],
    createdAt: options.createdAt ?? new Date(),
    updatedAt: options.updatedAt ?? new Date(),
    closedAt: options.closedAt,
    commentCount: options.commentCount ?? 0,
  };
}

/**
 * Get issue state color class
 *
 * @param state - Issue state
 * @returns Tailwind CSS color class
 */
export function getIssueStateColorClass(state: IssueState): string {
  switch (state) {
    case 'open':
      return 'text-green-500';
    case 'closed':
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get issue state background class
 *
 * @param state - Issue state
 * @returns Tailwind CSS background color class
 */
export function getIssueStateBgClass(state: IssueState): string {
  switch (state) {
    case 'open':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'closed':
      return 'bg-purple-100 dark:bg-purple-900/30';
    default:
      return 'bg-gray-100 dark:bg-gray-700';
  }
}

/**
 * Get issue priority color class
 *
 * @param priority - Issue priority
 * @returns Tailwind CSS color class
 */
export function getIssuePriorityColorClass(priority: IssuePriority | undefined): string {
  switch (priority) {
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get issue priority background class
 *
 * @param priority - Issue priority
 * @returns Tailwind CSS background color class
 */
export function getIssuePriorityBgClass(priority: IssuePriority | undefined): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'high':
      return 'bg-orange-100 dark:bg-orange-900/30';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'low':
      return 'bg-blue-100 dark:bg-blue-900/30';
    default:
      return 'bg-gray-100 dark:bg-gray-700';
  }
}

/**
 * Get issue priority text
 *
 * @param priority - Issue priority
 * @returns Human-readable priority text
 */
export function getIssuePriorityText(priority: IssuePriority | undefined): string {
  switch (priority) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'None';
  }
}

/**
 * Filter issues based on filter options
 *
 * @param issues - Array of issues to filter
 * @param filter - Filter options
 * @param currentUser - Current user for assignee filtering
 * @returns Filtered issues
 */
export function filterIssues(
  issues: Issue[],
  filter: IssueFilter,
  currentUser: string = ''
): Issue[] {
  return issues.filter((issue) => {
    if (filter.repositoryId && issue.repository.id !== filter.repositoryId) {
      return false;
    }
    if (filter.state && issue.state !== filter.state) {
      return false;
    }
    if (filter.priority && issue.priority !== filter.priority) {
      return false;
    }
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      if (
        !issue.title.toLowerCase().includes(query) &&
        !issue.body.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (filter.labelName) {
      const hasLabel = issue.labels.some(
        (label) => label.name.toLowerCase() === filter.labelName?.toLowerCase()
      );
      if (!hasLabel) {
        return false;
      }
    }
    if (filter.assignedToMe && !issue.assignees.includes(currentUser)) {
      return false;
    }
    if (filter.createdByMe && issue.author !== currentUser) {
      return false;
    }
    return true;
  });
}

/**
 * Group issues by repository
 *
 * @param issues - Array of issues
 * @returns Issues grouped by repository
 */
export function groupIssuesByRepository(issues: Issue[]): Record<string, Issue[]> {
  return issues.reduce(
    (acc, issue) => {
      const repoId = issue.repository.id;
      if (!acc[repoId]) {
        acc[repoId] = [];
      }
      acc[repoId].push(issue);
      return acc;
    },
    {} as Record<string, Issue[]>
  );
}

/**
 * Get relative time string for a date
 *
 * @param date - Date to format
 * @returns Human-readable relative time string
 */
export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined,
    });
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Create initial issues view state with sample data
 *
 * @returns Initial IssuesViewState with sample data
 */
export function createInitialIssuesState(): IssuesViewState {
  // Sample repositories
  const repositories: Repository[] = [
    createRepository('matrix', 'theo'),
    createRepository('desktop', 'theo'),
    createRepository('shared', 'theo'),
  ];

  // Sample labels
  const bugLabel: IssueLabel = { name: 'bug', color: '#d73a4a', description: 'Something is not working' };
  const featureLabel: IssueLabel = { name: 'enhancement', color: '#a2eeef', description: 'New feature or request' };
  const docsLabel: IssueLabel = { name: 'documentation', color: '#0075ca', description: 'Improvements to documentation' };
  const helpWantedLabel: IssueLabel = { name: 'help wanted', color: '#008672', description: 'Extra attention is needed' };

  // Sample issues for each repository
  const issues: Issue[] = [
    // Matrix repo issues
    createIssue('Fix memory leak in IPC handler', repositories[0], {
      number: 42,
      body: 'There is a memory leak when processing large IPC messages. Need to investigate and fix.',
      state: 'open',
      priority: 'high',
      labels: [bugLabel],
      author: 'developer',
      assignees: ['theo'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      commentCount: 5,
    }),
    createIssue('Add workspace tab navigation', repositories[0], {
      number: 38,
      body: 'Implement the workspace tab navigation feature for switching between branches, issues, and PRs.',
      state: 'open',
      priority: 'medium',
      labels: [featureLabel],
      author: 'theo',
      assignees: ['developer'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      commentCount: 12,
    }),
    createIssue('Update README with installation instructions', repositories[0], {
      number: 35,
      body: 'The README needs updated installation instructions for the new build system.',
      state: 'closed',
      labels: [docsLabel],
      author: 'contributor',
      assignees: [],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      commentCount: 3,
    }),

    // Desktop repo issues
    createIssue('Implement dark mode toggle', repositories[1], {
      number: 15,
      body: 'Add a toggle in settings to switch between light and dark mode.',
      state: 'open',
      priority: 'low',
      labels: [featureLabel],
      author: 'designer',
      assignees: ['designer', 'developer'],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      commentCount: 8,
    }),
    createIssue('Window resize causes layout issues', repositories[1], {
      number: 14,
      body: 'When resizing the window quickly, the layout breaks and components overlap.',
      state: 'open',
      priority: 'critical',
      labels: [bugLabel, helpWantedLabel],
      author: 'tester',
      assignees: ['theo'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      commentCount: 2,
    }),

    // Shared repo issues
    createIssue('Add utility functions for date formatting', repositories[2], {
      number: 8,
      body: 'Create a set of utility functions for consistent date formatting across the app.',
      state: 'open',
      priority: 'medium',
      labels: [featureLabel],
      author: 'developer',
      assignees: [],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      commentCount: 0,
    }),
    createIssue('Export types from package', repositories[2], {
      number: 7,
      body: 'The shared types are not being exported correctly from the package.',
      state: 'closed',
      labels: [bugLabel],
      author: 'theo',
      assignees: ['developer'],
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      commentCount: 4,
    }),
  ];

  return {
    issues,
    repositories,
    selectedRepositoryId: null,
    filter: {},
    selectedIssueId: null,
    isLoading: false,
    errorMessage: null,
    currentUser: 'theo',
  };
}

// ============================================================================
// Pull Request Helper Functions
// ============================================================================

/**
 * Create a new pull request object
 *
 * @param title - PR title
 * @param repository - Repository the PR belongs to
 * @param options - Additional PR options
 * @returns A new PullRequest object
 */
export function createPullRequest(
  title: string,
  repository: Repository,
  options: Partial<Omit<PullRequest, 'id' | 'title' | 'repository'>> = {}
): PullRequest {
  return {
    id: crypto.randomUUID(),
    number: options.number ?? Math.floor(Math.random() * 1000) + 1,
    title,
    body: options.body ?? '',
    repository,
    state: options.state ?? 'open',
    sourceBranch: options.sourceBranch ?? 'feature/branch',
    targetBranch: options.targetBranch ?? repository.defaultBranch,
    author: options.author ?? 'developer',
    labels: options.labels ?? [],
    reviewers: options.reviewers ?? [],
    reviews: options.reviews ?? [],
    ciStatus: options.ciStatus ?? 'pending',
    isDraft: options.isDraft ?? false,
    hasConflicts: options.hasConflicts ?? false,
    commitCount: options.commitCount ?? 1,
    filesChanged: options.filesChanged ?? 1,
    additions: options.additions ?? 0,
    deletions: options.deletions ?? 0,
    createdAt: options.createdAt ?? new Date(),
    updatedAt: options.updatedAt ?? new Date(),
    mergedAt: options.mergedAt,
    closedAt: options.closedAt,
  };
}

/**
 * Get PR state color class
 *
 * @param state - PR state
 * @returns Tailwind CSS color class
 */
export function getPRStateColorClass(state: PRState): string {
  switch (state) {
    case 'open':
      return 'text-green-500';
    case 'merged':
      return 'text-purple-500';
    case 'closed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get PR state background class
 *
 * @param state - PR state
 * @returns Tailwind CSS background color class
 */
export function getPRStateBgClass(state: PRState): string {
  switch (state) {
    case 'open':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'merged':
      return 'bg-purple-100 dark:bg-purple-900/30';
    case 'closed':
      return 'bg-red-100 dark:bg-red-900/30';
    default:
      return 'bg-gray-100 dark:bg-gray-700';
  }
}

/**
 * Get PR CI status color class
 *
 * @param status - CI status
 * @returns Tailwind CSS color class
 */
export function getPRCIStatusColorClass(status: PRCIStatus): string {
  switch (status) {
    case 'success':
      return 'text-green-500';
    case 'failure':
      return 'text-red-500';
    case 'running':
      return 'text-yellow-500';
    case 'pending':
      return 'text-gray-500';
    case 'cancelled':
      return 'text-gray-400';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get PR CI status background class
 *
 * @param status - CI status
 * @returns Tailwind CSS background color class
 */
export function getPRCIStatusBgClass(status: PRCIStatus): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'failure':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'running':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'pending':
      return 'bg-gray-100 dark:bg-gray-700';
    case 'cancelled':
      return 'bg-gray-100 dark:bg-gray-700';
    default:
      return 'bg-gray-100 dark:bg-gray-700';
  }
}

/**
 * Get PR CI status text
 *
 * @param status - CI status
 * @returns Human-readable status text
 */
export function getPRCIStatusText(status: PRCIStatus): string {
  switch (status) {
    case 'success':
      return 'Passing';
    case 'failure':
      return 'Failing';
    case 'running':
      return 'Running';
    case 'pending':
      return 'Pending';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Get PR review summary
 *
 * @param reviews - Array of reviews
 * @returns Review summary object
 */
export function getPRReviewSummary(reviews: PRReview[]): {
  approved: number;
  changesRequested: number;
  commented: number;
  pending: number;
} {
  return reviews.reduce(
    (acc, review) => {
      switch (review.state) {
        case 'approved':
          acc.approved++;
          break;
        case 'changes_requested':
          acc.changesRequested++;
          break;
        case 'commented':
          acc.commented++;
          break;
        case 'pending':
          acc.pending++;
          break;
      }
      return acc;
    },
    { approved: 0, changesRequested: 0, commented: 0, pending: 0 }
  );
}

/**
 * Filter pull requests based on filter options
 *
 * @param pullRequests - Array of pull requests to filter
 * @param filter - Filter options
 * @param currentUser - Current user for author/reviewer filtering
 * @returns Filtered pull requests
 */
export function filterPRs(
  pullRequests: PullRequest[],
  filter: PRFilter,
  currentUser: string = ''
): PullRequest[] {
  return pullRequests.filter((pr) => {
    if (filter.repositoryId && pr.repository.id !== filter.repositoryId) {
      return false;
    }
    if (filter.state && pr.state !== filter.state) {
      return false;
    }
    if (filter.ciStatus && pr.ciStatus !== filter.ciStatus) {
      return false;
    }
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      if (
        !pr.title.toLowerCase().includes(query) &&
        !pr.body.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (filter.labelName) {
      const hasLabel = pr.labels.some(
        (label) => label.name.toLowerCase() === filter.labelName?.toLowerCase()
      );
      if (!hasLabel) {
        return false;
      }
    }
    if (filter.authoredByMe && pr.author !== currentUser) {
      return false;
    }
    if (filter.reviewRequestedFromMe && !pr.reviewers.includes(currentUser)) {
      return false;
    }
    if (filter.isDraft !== undefined && pr.isDraft !== filter.isDraft) {
      return false;
    }
    if (filter.hasConflicts && !pr.hasConflicts) {
      return false;
    }
    return true;
  });
}

/**
 * Group pull requests by repository
 *
 * @param pullRequests - Array of pull requests
 * @returns Pull requests grouped by repository
 */
export function groupPRsByRepository(
  pullRequests: PullRequest[]
): Record<string, PullRequest[]> {
  return pullRequests.reduce(
    (acc, pr) => {
      const repoId = pr.repository.id;
      if (!acc[repoId]) {
        acc[repoId] = [];
      }
      acc[repoId].push(pr);
      return acc;
    },
    {} as Record<string, PullRequest[]>
  );
}

/**
 * Create initial pull requests view state with sample data
 *
 * @returns Initial PRsViewState with sample data
 */
export function createInitialPRsState(): PRsViewState {
  // Sample repositories
  const repositories: Repository[] = [
    createRepository('matrix', 'theo'),
    createRepository('desktop', 'theo'),
    createRepository('shared', 'theo'),
  ];

  // Sample labels
  const bugLabel: IssueLabel = { name: 'bug', color: '#d73a4a', description: 'Something is not working' };
  const featureLabel: IssueLabel = { name: 'enhancement', color: '#a2eeef', description: 'New feature or request' };
  const docsLabel: IssueLabel = { name: 'documentation', color: '#0075ca', description: 'Improvements to documentation' };
  const reviewNeededLabel: IssueLabel = { name: 'review needed', color: '#fbca04', description: 'Needs review' };

  // Sample pull requests for each repository
  const pullRequests: PullRequest[] = [
    // Matrix repo PRs
    createPullRequest('feat: Add workspace tab navigation', repositories[0], {
      number: 123,
      body: 'This PR implements the workspace tab navigation feature, allowing users to switch between branches, issues, and PRs views.',
      state: 'open',
      sourceBranch: 'feature/workspace-tabs',
      targetBranch: 'main',
      author: 'developer',
      labels: [featureLabel, reviewNeededLabel],
      reviewers: ['theo', 'contributor'],
      reviews: [
        { reviewer: 'theo', state: 'approved', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
      ciStatus: 'success',
      commitCount: 5,
      filesChanged: 12,
      additions: 450,
      deletions: 23,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    }),
    createPullRequest('fix: Resolve IPC timeout issue', repositories[0], {
      number: 124,
      body: 'Fixes the IPC timeout issue that was causing messages to be dropped under heavy load.',
      state: 'open',
      sourceBranch: 'fix/ipc-handler',
      targetBranch: 'main',
      author: 'contributor',
      labels: [bugLabel],
      reviewers: ['developer'],
      reviews: [
        { reviewer: 'developer', state: 'changes_requested', submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      ],
      ciStatus: 'failure',
      hasConflicts: true,
      commitCount: 2,
      filesChanged: 3,
      additions: 45,
      deletions: 12,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    }),
    createPullRequest('chore: Update dependencies to latest versions', repositories[0], {
      number: 120,
      body: 'Updates all dependencies to their latest versions.',
      state: 'merged',
      sourceBranch: 'chore/update-deps',
      targetBranch: 'main',
      author: 'theo',
      labels: [],
      reviewers: ['developer'],
      reviews: [
        { reviewer: 'developer', state: 'approved', submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      ],
      ciStatus: 'success',
      commitCount: 1,
      filesChanged: 2,
      additions: 120,
      deletions: 98,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      mergedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    }),

    // Desktop repo PRs
    createPullRequest('feat: Implement dark mode toggle', repositories[1], {
      number: 456,
      body: 'Adds a toggle in the settings panel to switch between light and dark mode.',
      state: 'open',
      sourceBranch: 'feature/dark-mode',
      targetBranch: 'main',
      author: 'designer',
      labels: [featureLabel],
      reviewers: ['theo', 'developer'],
      reviews: [],
      ciStatus: 'running',
      isDraft: true,
      commitCount: 8,
      filesChanged: 15,
      additions: 320,
      deletions: 45,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    }),
    createPullRequest('refactor: Extract common components', repositories[1], {
      number: 455,
      body: 'Refactors the codebase to extract common UI components into a shared module.',
      state: 'open',
      sourceBranch: 'refactor/components',
      targetBranch: 'main',
      author: 'developer',
      labels: [reviewNeededLabel],
      reviewers: ['theo'],
      reviews: [
        { reviewer: 'theo', state: 'commented', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
      ciStatus: 'success',
      commitCount: 12,
      filesChanged: 28,
      additions: 890,
      deletions: 650,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    }),

    // Shared repo PRs
    createPullRequest('feat: Add utility functions for date formatting', repositories[2], {
      number: 12,
      body: 'Adds a comprehensive set of utility functions for consistent date formatting.',
      state: 'open',
      sourceBranch: 'feature/utils',
      targetBranch: 'main',
      author: 'developer',
      labels: [featureLabel],
      reviewers: ['theo'],
      reviews: [
        { reviewer: 'theo', state: 'approved', submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      ],
      ciStatus: 'success',
      commitCount: 3,
      filesChanged: 4,
      additions: 156,
      deletions: 0,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    }),
    createPullRequest('docs: Update README with usage examples', repositories[2], {
      number: 11,
      body: 'Updates the README with comprehensive usage examples for all exported utilities.',
      state: 'merged',
      sourceBranch: 'docs/readme',
      targetBranch: 'main',
      author: 'theo',
      labels: [docsLabel],
      reviewers: ['developer'],
      reviews: [
        { reviewer: 'developer', state: 'approved', submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      ],
      ciStatus: 'success',
      commitCount: 1,
      filesChanged: 1,
      additions: 85,
      deletions: 12,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      mergedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    }),
  ];

  return {
    pullRequests,
    repositories,
    selectedRepositoryId: null,
    filter: {},
    selectedPRId: null,
    isLoading: false,
    errorMessage: null,
    currentUser: 'theo',
  };
}
