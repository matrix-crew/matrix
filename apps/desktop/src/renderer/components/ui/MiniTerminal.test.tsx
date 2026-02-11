import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MiniTerminal } from './MiniTerminal';

beforeEach(() => {
  vi.mocked(window.api.execCommand).mockReset();
});

describe('MiniTerminal', () => {
  it('renders command and run button', () => {
    render(<MiniTerminal command="uv --version" />);

    expect(screen.getByText('uv --version')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
  });

  it('does not execute on mount', () => {
    render(<MiniTerminal command="uv --version" />);

    expect(window.api.execCommand).not.toHaveBeenCalled();
  });

  it('executes command on Run click and shows success', async () => {
    vi.mocked(window.api.execCommand).mockResolvedValue({
      success: true,
      stdout: 'uv 0.5.11',
      stderr: '',
      exitCode: 0,
    });

    render(<MiniTerminal command="uv --version" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    expect(window.api.execCommand).toHaveBeenCalledWith('uv --version');

    await waitFor(() => {
      expect(screen.getByText('uv 0.5.11')).toBeInTheDocument();
    });
  });

  it('shows error state with exit code', async () => {
    vi.mocked(window.api.execCommand).mockResolvedValue({
      success: false,
      stdout: '',
      stderr: 'command not found: invalid-cmd',
      exitCode: 127,
    });

    render(<MiniTerminal command="invalid-cmd" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('command not found: invalid-cmd')).toBeInTheDocument();
      expect(screen.getByText('exit 127')).toBeInTheDocument();
    });
  });

  it('limits output to maxLines (default 3)', async () => {
    vi.mocked(window.api.execCommand).mockResolvedValue({
      success: true,
      stdout: 'line1\nline2\nline3\nline4\nline5',
      stderr: '',
      exitCode: 0,
    });

    render(<MiniTerminal command="git log" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('line3')).toBeInTheDocument();
      expect(screen.getByText('line4')).toBeInTheDocument();
      expect(screen.getByText('line5')).toBeInTheDocument();
    });

    expect(screen.queryByText('line1')).not.toBeInTheDocument();
    expect(screen.queryByText('line2')).not.toBeInTheDocument();
  });

  it('respects custom maxLines', async () => {
    vi.mocked(window.api.execCommand).mockResolvedValue({
      success: true,
      stdout: 'a\nb\nc\nd\ne',
      stderr: '',
      exitCode: 0,
    });

    render(<MiniTerminal command="git log" maxLines={2} />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('d')).toBeInTheDocument();
      expect(screen.getByText('e')).toBeInTheDocument();
    });

    expect(screen.queryByText('a')).not.toBeInTheDocument();
    expect(screen.queryByText('b')).not.toBeInTheDocument();
    expect(screen.queryByText('c')).not.toBeInTheDocument();
  });

  it('combines stdout and stderr', async () => {
    vi.mocked(window.api.execCommand).mockResolvedValue({
      success: true,
      stdout: 'stdout line',
      stderr: 'stderr line',
      exitCode: 0,
    });

    render(<MiniTerminal command="uv sync" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('stdout line')).toBeInTheDocument();
      expect(screen.getByText('stderr line')).toBeInTheDocument();
    });
  });

  it('shows fallback message for empty output on success', async () => {
    vi.mocked(window.api.execCommand).mockResolvedValue({
      success: true,
      stdout: '',
      stderr: '',
      exitCode: 0,
    });

    render(<MiniTerminal command="git config user.name" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('Done (no output)')).toBeInTheDocument();
    });
  });

  it('handles execution failure gracefully', async () => {
    vi.mocked(window.api.execCommand).mockRejectedValue(new Error('IPC error'));

    render(<MiniTerminal command="uv --version" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('Command execution failed')).toBeInTheDocument();
    });
  });

  it('disables button during execution', async () => {
    let resolve: (value: unknown) => void;
    vi.mocked(window.api.execCommand).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );

    render(<MiniTerminal command="uv --version" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Running...')).toBeInTheDocument();

    // Resolve to clean up
    resolve!({ success: true, stdout: 'done', stderr: '', exitCode: 0 });
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});
