import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MatrixView } from './MatrixView';

const mockMatrix = {
  id: 'matrix-uuid-123',
  name: 'Test Matrix',
  source_ids: [],
  workspace_path: '/home/user/.matrix/test-matrix-abc',
  created_at: '2024-01-15T10:30:00+00:00',
  updated_at: '2024-01-15T10:30:00+00:00',
};

const mockSource = {
  id: 'source-uuid-456',
  name: 'frontend-repo',
  path: '/home/user/repos/frontend',
  url: 'https://github.com/user/frontend',
  created_at: '2024-01-15T10:30:00+00:00',
};

/**
 * Helper: set up mock to return matrix and source data.
 */
function setupMock(matrix = mockMatrix, sources = [mockSource]) {
  vi.mocked(window.api.sendMessage).mockImplementation(async (msg) => {
    if (msg.type === 'matrix-get') {
      return { success: true, data: { matrix } };
    }
    if (msg.type === 'source-list') {
      return { success: true, data: { sources } };
    }
    return { success: true, data: {} };
  });
}

beforeEach(() => {
  vi.mocked(window.api.sendMessage).mockReset();
});

describe('MatrixView', () => {
  it('shows loading spinner initially', () => {
    vi.mocked(window.api.sendMessage).mockReturnValue(new Promise(() => {}));
    render(<MatrixView matrixId="matrix-uuid-123" />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays matrix name in heading after loading', async () => {
    setupMock(mockMatrix, []);

    render(<MatrixView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 2 });
      const matrixHeading = headings.find((h) => h.textContent === 'Test Matrix');
      expect(matrixHeading).toBeDefined();
    });
  });

  it('shows error when matrix not found', async () => {
    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: false,
      error: 'Matrix not found',
    });

    render(<MatrixView matrixId="nonexistent-id" />);

    await waitFor(() => {
      expect(screen.getByText('Matrix not found')).toBeInTheDocument();
    });
  });

  it('displays source count for matrix with sources', async () => {
    const matrixWithSources = {
      ...mockMatrix,
      source_ids: ['source-uuid-456'],
    };
    setupMock(matrixWithSources, [mockSource]);

    render(<MatrixView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      // Source count is in a paragraph like "1 source · Created ..."
      const paragraph = document.querySelector('.text-text-secondary');
      expect(paragraph?.textContent).toMatch(/1 source/);
    });
  });

  it('displays source count for empty matrix', async () => {
    setupMock(mockMatrix, []);

    render(<MatrixView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      const paragraph = document.querySelector('.text-text-secondary');
      expect(paragraph?.textContent).toMatch(/0 sources/);
    });
  });

  it('has Edit button', async () => {
    setupMock(mockMatrix, []);

    render(<MatrixView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit matrix' })).toBeInTheDocument();
    });
  });

  it('has accessible region', async () => {
    setupMock(mockMatrix, []);

    render(<MatrixView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Matrix View' })).toBeInTheDocument();
    });
  });

  it('displays creation date', async () => {
    setupMock(mockMatrix, []);

    render(<MatrixView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      const paragraph = document.querySelector('.text-text-secondary');
      expect(paragraph?.textContent).toMatch(/Created/);
    });
  });

  it('renders source list region', async () => {
    setupMock(mockMatrix, []);

    render(<MatrixView matrixId="matrix-uuid-123" />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Source List' })).toBeInTheDocument();
    });
  });
});
