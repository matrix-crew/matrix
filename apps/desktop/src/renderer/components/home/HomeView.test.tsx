import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeView } from './HomeView';
import type { Matrix, Source } from '@maxtix/shared';

const mockMatrices: Matrix[] = [
  {
    id: 'matrix-1',
    name: 'Frontend',
    source_ids: ['src-1', 'src-2'],
    workspace_path: '/home/.matrix/frontend',
    created_at: '2024-01-15T10:30:00+00:00',
    updated_at: '2024-01-15T10:30:00+00:00',
  },
  {
    id: 'matrix-2',
    name: 'Backend',
    source_ids: ['src-3'],
    workspace_path: '/home/.matrix/backend',
    created_at: '2024-01-10T08:00:00+00:00',
    updated_at: '2024-01-12T14:00:00+00:00',
  },
];

const mockSources: Source[] = [
  {
    id: 'src-1',
    name: 'web-app',
    path: '/repos/web-app',
    url: null,
    created_at: '2024-01-01T00:00:00+00:00',
  },
  {
    id: 'src-2',
    name: 'design-system',
    path: '/repos/design-system',
    url: null,
    created_at: '2024-01-01T00:00:00+00:00',
  },
  {
    id: 'src-3',
    name: 'api-server',
    path: '/repos/api-server',
    url: null,
    created_at: '2024-01-01T00:00:00+00:00',
  },
];

beforeEach(() => {
  vi.mocked(window.api.sendMessage).mockReset();
});

describe('HomeView', () => {
  it('shows loading state initially', () => {
    vi.mocked(window.api.sendMessage).mockReturnValue(new Promise(() => {}));
    render(
      <HomeView matrices={mockMatrices} onSelectMatrix={() => {}} onCreateMatrix={() => {}} />
    );
    // Loading spinner should be present (no heading yet)
    expect(screen.queryByText('Your Matrices')).not.toBeInTheDocument();
  });

  it('renders matrix cards after loading', async () => {
    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: true,
      data: { sources: mockSources },
    });

    render(
      <HomeView matrices={mockMatrices} onSelectMatrix={() => {}} onCreateMatrix={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText('Your Matrices')).toBeInTheDocument();
    });

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('2 matrices')).toBeInTheDocument();
  });

  it('shows source info on matrix cards', async () => {
    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: true,
      data: { sources: mockSources },
    });

    render(
      <HomeView matrices={mockMatrices} onSelectMatrix={() => {}} onCreateMatrix={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText('web-app')).toBeInTheDocument();
    });

    expect(screen.getByText('design-system')).toBeInTheDocument();
    expect(screen.getByText('api-server')).toBeInTheDocument();
  });

  it('calls onSelectMatrix when a card is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: true,
      data: { sources: [] },
    });

    render(
      <HomeView matrices={mockMatrices} onSelectMatrix={onSelect} onCreateMatrix={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Frontend'));
    expect(onSelect).toHaveBeenCalledWith('matrix-1');
  });

  it('calls onCreateMatrix when create card is clicked', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: true,
      data: { sources: [] },
    });

    render(<HomeView matrices={[]} onSelectMatrix={() => {}} onCreateMatrix={onCreate} />);

    await waitFor(() => {
      expect(screen.getByText('Create Matrix')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Create Matrix'));
    expect(onCreate).toHaveBeenCalled();
  });

  it('renders empty state when no matrices', async () => {
    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: true,
      data: { sources: [] },
    });

    render(<HomeView matrices={[]} onSelectMatrix={() => {}} onCreateMatrix={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('0 matrices')).toBeInTheDocument();
    });

    // Create card should still be visible
    expect(screen.getByText('Create Matrix')).toBeInTheDocument();
  });
});
