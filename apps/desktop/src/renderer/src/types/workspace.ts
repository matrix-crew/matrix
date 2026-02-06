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
// Pull Request Types (for future use)
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
