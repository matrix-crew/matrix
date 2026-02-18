import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from './DashboardView';

const mockMatrix = {
  id: 'matrix-uuid-123',
  name: 'Test Matrix',
  source_ids: ['source-uuid-456'],
  workspace_path: '/home/user/.matrix/test-matrix-abc',
  created_at: '2024-01-15T10:30:00+00:00',
  updated_at: '2024-01-15T10:30:00+00:00',
};

const mockSource = {
  id: 'source-uuid-456',
  name: 'frontend-repo',
  path: '/home/user/repos/frontend',
  url: 'https://github.com/user/frontend',
  source_type: 'remote',
  created_at: '2024-01-15T10:30:00+00:00',
};

function setupMock(matrix = mockMatrix, sources = [mockSource]) {
  vi.mocked(window.api.sendMessage).mockImplementation(async (msg) => {
    if (msg.type === 'matrix-get') {
      return { success: true, data: { matrix } };
    }
    if (msg.type === 'source-list') {
      return { success: true, data: { sources } };
    }
    if (msg.type === 'matrix-reconcile') {
      return { success: true, data: { report: { has_repairs: false } } };
    }
    if (msg.type === 'github-check') {
      return {
        success: true,
        data: { installed: false, authenticated: false, user: null },
      };
    }
    return { success: true, data: {} };
  });
}

beforeEach(() => {
  vi.mocked(window.api.sendMessage).mockReset();
});

describe('DashboardView', () => {
  it('shows loading spinner initially', () => {
    vi.mocked(window.api.sendMessage).mockReturnValue(new Promise(() => {}));
    render(<DashboardView matrixId="matrix-uuid-123" />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders source cards after loading', async () => {
    setupMock();
    render(<DashboardView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByText('frontend-repo')).toBeInTheDocument();
    });
  });

  it('renders Add Source button', async () => {
    setupMock();
    render(<DashboardView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByText('Add Source')).toBeInTheDocument();
    });
  });

  it('shows error when matrix fetch fails', async () => {
    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: false,
      error: 'Matrix not found',
    });

    render(<DashboardView matrixId="nonexistent-id" />);

    await waitFor(() => {
      expect(screen.getByText('Matrix not found')).toBeInTheDocument();
    });
  });

  it('shows empty grid with only Add Source for matrix with no sources', async () => {
    const emptyMatrix = { ...mockMatrix, source_ids: [] };
    setupMock(emptyMatrix, []);

    render(<DashboardView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByText('Add Source')).toBeInTheDocument();
    });
    expect(screen.queryByText('frontend-repo')).not.toBeInTheDocument();
  });

  it('opens source form modal when Add Source clicked', async () => {
    const user = userEvent.setup();
    const emptyMatrix = { ...mockMatrix, source_ids: [] };
    setupMock(emptyMatrix, []);

    render(<DashboardView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByText('Add Source')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Add Source'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('renders multiple source cards', async () => {
    const secondSource = {
      id: 'source-uuid-789',
      name: 'backend-api',
      path: '/home/user/repos/backend',
      source_type: 'local',
      created_at: '2024-01-15T10:30:00+00:00',
    };
    const matrixWithTwo = {
      ...mockMatrix,
      source_ids: ['source-uuid-456', 'source-uuid-789'],
    };
    setupMock(matrixWithTwo, [mockSource, secondSource]);

    render(<DashboardView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByText('frontend-repo')).toBeInTheDocument();
      expect(screen.getByText('backend-api')).toBeInTheDocument();
    });
  });
});
