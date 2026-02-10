import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceFormWizard, extractNameFromPath, extractNameFromUrl } from './SourceFormWizard';

beforeEach(() => {
  vi.mocked(window.api.selectDirectory).mockReset();
});

describe('extractNameFromPath', () => {
  it('extracts last segment of path', () => {
    expect(extractNameFromPath('/home/user/repos/my-repo')).toBe('my-repo');
  });

  it('handles trailing slash', () => {
    expect(extractNameFromPath('/home/user/repos/my-repo/')).toBe('my-repo');
  });

  it('returns empty for empty path', () => {
    expect(extractNameFromPath('')).toBe('');
  });
});

describe('extractNameFromUrl', () => {
  it('extracts name from HTTPS URL with .git', () => {
    expect(extractNameFromUrl('https://github.com/user/my-repo.git')).toBe('my-repo');
  });

  it('extracts name from HTTPS URL without .git', () => {
    expect(extractNameFromUrl('https://github.com/user/my-repo')).toBe('my-repo');
  });

  it('extracts name from SSH URL', () => {
    expect(extractNameFromUrl('git@github.com:user/my-repo.git')).toBe('my-repo');
  });

  it('returns empty for empty URL', () => {
    expect(extractNameFromUrl('')).toBe('');
  });
});

describe('SourceFormWizard', () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onSubmit.mockClear();
    defaultProps.onCancel.mockClear();
  });

  it('renders type selection step initially', () => {
    render(<SourceFormWizard {...defaultProps} />);

    expect(screen.getByText('Add Source')).toBeInTheDocument();
    expect(screen.getByText('Local Directory')).toBeInTheDocument();
    expect(screen.getByText('Remote Git Repository')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked on type selection', async () => {
    render(<SourceFormWizard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('transitions to local details step when Local Directory is selected', async () => {
    render(<SourceFormWizard {...defaultProps} />);

    fireEvent.click(screen.getByText('Local Directory'));

    expect(screen.getByText('Directory Path')).toBeInTheDocument();
  });

  it('transitions to remote details step when Remote Git Repository is selected', async () => {
    render(<SourceFormWizard {...defaultProps} />);

    fireEvent.click(screen.getByText('Remote Git Repository'));

    expect(screen.getByText('Git URL')).toBeInTheDocument();
  });

  it('goes back to type selection from details step', async () => {
    render(<SourceFormWizard {...defaultProps} />);

    fireEvent.click(screen.getByText('Local Directory'));
    // Now on details step
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    // Should be back on type selection
    expect(screen.getByText('Local Directory')).toBeInTheDocument();
    expect(screen.getByText('Remote Git Repository')).toBeInTheDocument();
  });

  it('opens directory picker when Browse button is clicked', async () => {
    vi.mocked(window.api.selectDirectory).mockResolvedValue('/home/user/repos/my-project');

    render(<SourceFormWizard {...defaultProps} />);

    fireEvent.click(screen.getByText('Local Directory'));
    fireEvent.click(screen.getByRole('button', { name: /browse/i }));

    await waitFor(() => {
      expect(window.api.selectDirectory).toHaveBeenCalled();
    });
  });
});
