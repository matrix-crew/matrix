import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardSourceCard } from './DashboardSourceCard';
import type { Source } from '@shared/types/matrix';
import type { PullRequest, Issue } from '@/types/workspace';

const localSource: Source = {
  id: 'src-1',
  name: 'frontend-repo',
  path: '/home/user/repos/frontend',
  source_type: 'local',
  created_at: '2024-01-15T10:30:00+00:00',
};

const remoteSource: Source = {
  id: 'src-2',
  name: 'backend-api',
  path: '/home/user/repos/backend',
  url: 'https://github.com/user/backend-api',
  source_type: 'remote',
  created_at: '2024-01-15T10:30:00+00:00',
};

const makePR = (overrides: Partial<PullRequest> = {}): PullRequest => ({
  id: 'pr-1',
  number: 42,
  title: 'Fix auth flow',
  state: 'open',
  author: 'theo',
  url: 'https://github.com/user/repo/pull/42',
  ciStatus: 'success',
  repository: { id: 'src-1', name: 'frontend-repo', owner: 'user' },
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  ...overrides,
});

const makeIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 'issue-1',
  number: 10,
  title: 'Add dark mode',
  state: 'open',
  assignees: ['theo'],
  labels: [],
  url: 'https://github.com/user/repo/issues/10',
  repository: { id: 'src-1', name: 'frontend-repo', owner: 'user' },
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  ...overrides,
});

describe('DashboardSourceCard', () => {
  it('renders source name and path', () => {
    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[]}
        myIssues={[]}
        ghConnected={false}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('frontend-repo')).toBeInTheDocument();
    expect(screen.getByText('/home/user/repos/frontend')).toBeInTheDocument();
  });

  it('renders local type badge', () => {
    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[]}
        myIssues={[]}
        ghConnected={false}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('local')).toBeInTheDocument();
  });

  it('renders remote type badge and URL', () => {
    render(
      <DashboardSourceCard
        source={remoteSource}
        myPRs={[]}
        myIssues={[]}
        ghConnected={false}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('remote')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/user/backend-api')).toBeInTheDocument();
  });

  it('hides URL for local sources without url', () => {
    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[]}
        myIssues={[]}
        ghConnected={false}
        onRemove={vi.fn()}
      />
    );

    expect(screen.queryByText('https://')).not.toBeInTheDocument();
  });

  it('hides GitHub section when ghConnected is false', () => {
    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[makePR()]}
        myIssues={[makeIssue()]}
        ghConnected={false}
        onRemove={vi.fn()}
      />
    );

    expect(screen.queryByText(/open PR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/assigned issue/)).not.toBeInTheDocument();
  });

  it('shows PR count and latest PR when ghConnected', () => {
    const prs = [makePR({ title: 'Fix auth flow' }), makePR({ id: 'pr-2', title: 'Add tests' })];

    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={prs}
        myIssues={[]}
        ghConnected={true}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('2 open PRs')).toBeInTheDocument();
    expect(screen.getByText('Fix auth flow')).toBeInTheDocument();
  });

  it('shows singular PR label for 1 PR', () => {
    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[makePR()]}
        myIssues={[]}
        ghConnected={true}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('1 open PR')).toBeInTheDocument();
  });

  it('shows issue count and latest issue when ghConnected', () => {
    const issues = [makeIssue({ title: 'Add dark mode' })];

    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[]}
        myIssues={issues}
        ghConnected={true}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('1 assigned issue')).toBeInTheDocument();
    expect(screen.getByText('Add dark mode')).toBeInTheDocument();
  });

  it('shows plural issues label for multiple issues', () => {
    const issues = [makeIssue(), makeIssue({ id: 'issue-2', title: 'Fix bug' })];

    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[]}
        myIssues={issues}
        ghConnected={true}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('2 assigned issues')).toBeInTheDocument();
  });

  it('shows CI status dot for latest PR', () => {
    const { container } = render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[makePR({ ciStatus: 'failure' })]}
        myIssues={[]}
        ghConnected={true}
        onRemove={vi.fn()}
      />
    );

    const dot = container.querySelector('.bg-red-400');
    expect(dot).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <DashboardSourceCard
        source={localSource}
        myPRs={[]}
        myIssues={[]}
        ghConnected={false}
        onRemove={onRemove}
      />
    );

    await user.click(screen.getByRole('button', { name: /Remove frontend-repo/i }));
    expect(onRemove).toHaveBeenCalledWith(localSource);
  });
});
