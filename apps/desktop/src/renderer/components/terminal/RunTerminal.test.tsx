import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RunTerminal } from './RunTerminal';

type DataCb = (sessionId: string, data: string) => void;
type ExitCb = (sessionId: string, exitCode: number) => void;

let dataCb: DataCb;
let exitCb: ExitCb;

beforeEach(() => {
  vi.mocked(window.api.execStream.start).mockReset().mockResolvedValue({ started: true });
  vi.mocked(window.api.execStream.kill).mockReset();

  vi.mocked(window.api.execStream.onData)
    .mockReset()
    .mockImplementation((cb) => {
      dataCb = cb;
      return () => {};
    });
  vi.mocked(window.api.execStream.onExit)
    .mockReset()
    .mockImplementation((cb) => {
      exitCb = cb;
      return () => {};
    });
});

/** Simulate streaming output for the first captured session */
function emitData(data: string) {
  const sid = vi.mocked(window.api.execStream.start).mock.calls[0]?.[0];
  if (sid) act(() => dataCb(sid, data));
}

function emitExit(code: number) {
  const sid = vi.mocked(window.api.execStream.start).mock.calls[0]?.[0];
  if (sid) act(() => exitCb(sid, code));
}

describe('RunTerminal', () => {
  it('renders command and run button', () => {
    render(<RunTerminal command="uv --version" />);

    expect(screen.getByText('uv --version')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
  });

  it('does not execute on mount', () => {
    render(<RunTerminal command="uv --version" />);

    expect(window.api.execStream.start).not.toHaveBeenCalled();
  });

  it('starts streaming on Run click and shows live output', async () => {
    render(<RunTerminal command="uv --version" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(window.api.execStream.start).toHaveBeenCalled();
    });

    emitData('uv 0.5.11\n');
    expect(screen.getByText('uv 0.5.11')).toBeInTheDocument();

    emitExit(0);
    expect(screen.getByText('uv 0.5.11')).toBeInTheDocument();
  });

  it('shows error state with exit code', async () => {
    render(<RunTerminal command="invalid-cmd" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(window.api.execStream.start).toHaveBeenCalled();
    });

    emitData('command not found: invalid-cmd\n');
    emitExit(127);

    expect(screen.getByText('command not found: invalid-cmd')).toBeInTheDocument();
    expect(screen.getByText('exit 127')).toBeInTheDocument();
  });

  it('limits output to maxLines', async () => {
    render(<RunTerminal command="git log" maxLines={3} />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(window.api.execStream.start).toHaveBeenCalled();
    });

    emitData('line1\nline2\nline3\nline4\nline5\n');
    emitExit(0);

    expect(screen.getByText('line3')).toBeInTheDocument();
    expect(screen.getByText('line4')).toBeInTheDocument();
    expect(screen.getByText('line5')).toBeInTheDocument();
    expect(screen.queryByText('line1')).not.toBeInTheDocument();
    expect(screen.queryByText('line2')).not.toBeInTheDocument();
  });

  it('accumulates streamed chunks', async () => {
    render(<RunTerminal command="npm install" maxLines={5} />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(window.api.execStream.start).toHaveBeenCalled();
    });

    emitData('Downloading...\n');
    expect(screen.getByText('Downloading...')).toBeInTheDocument();

    emitData('Installing...\n');
    expect(screen.getByText('Installing...')).toBeInTheDocument();

    emitData('Done!\n');
    emitExit(0);
    expect(screen.getByText('Done!')).toBeInTheDocument();
  });

  it('shows error when start returns not started', async () => {
    vi.mocked(window.api.execStream.start).mockResolvedValue({ started: false });

    render(<RunTerminal command="bad-cmd" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('Command not allowed')).toBeInTheDocument();
    });
  });

  it('handles start failure gracefully', async () => {
    vi.mocked(window.api.execStream.start).mockRejectedValue(new Error('IPC error'));

    render(<RunTerminal command="uv --version" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByText('IPC error')).toBeInTheDocument();
    });
  });

  it('disables button during execution', async () => {
    render(<RunTerminal command="uv --version" />);
    fireEvent.click(screen.getByRole('button', { name: /run/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    emitExit(0);

    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});
