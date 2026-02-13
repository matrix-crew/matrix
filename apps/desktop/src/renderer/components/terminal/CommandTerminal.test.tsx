import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { CommandTerminal } from './CommandTerminal';

// Mock terminalService
vi.mock('@/services/TerminalService', () => ({
  terminalService: {
    initialize: vi.fn(),
    createTerminal: vi.fn(),
    writeInput: vi.fn(),
    closeTerminal: vi.fn(),
    onTerminalData: vi.fn().mockReturnValue(() => {}),
    onTerminalExit: vi.fn().mockReturnValue(() => {}),
  },
}));

// Mock EmbedTerminal to avoid xterm.js DOM dependency
vi.mock('./EmbedTerminal', () => ({
  EmbedTerminal: ({
    sessionId,
    onExit,
  }: {
    sessionId: string;
    onExit?: (code: number) => void;
  }) => (
    <div data-testid="embed-terminal" data-session-id={sessionId}>
      <button data-testid="simulate-exit" onClick={() => onExit?.(0)}>
        exit
      </button>
    </div>
  ),
}));

import { terminalService } from '@/services/TerminalService';

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(terminalService.createTerminal).mockResolvedValue({
    id: 'test-session-123',
    name: 'command-terminal',
    shell: '/bin/zsh',
    cwd: '~',
    status: 'active',
    pid: 9999,
    createdAt: new Date(),
  });
});

describe('CommandTerminal', () => {
  it('creates a terminal session on mount', async () => {
    render(<CommandTerminal />);

    await waitFor(() => {
      expect(terminalService.createTerminal).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'command-terminal' })
      );
    });
  });

  it('renders EmbedTerminal once session is ready', async () => {
    render(<CommandTerminal />);

    await waitFor(() => {
      expect(screen.getByTestId('embed-terminal')).toBeInTheDocument();
    });

    expect(screen.getByTestId('embed-terminal')).toHaveAttribute(
      'data-session-id',
      'test-session-123'
    );
  });

  it('shows loading state before session is created', () => {
    // Make createTerminal hang
    vi.mocked(terminalService.createTerminal).mockReturnValue(new Promise(() => {}));

    render(<CommandTerminal />);

    expect(screen.getByText('Starting terminal...')).toBeInTheDocument();
  });

  it('shows error when session creation fails', async () => {
    vi.mocked(terminalService.createTerminal).mockRejectedValue(
      new Error('Maximum 12 terminals reached')
    );

    render(<CommandTerminal />);

    await waitFor(() => {
      expect(screen.getByText('Maximum 12 terminals reached')).toBeInTheDocument();
    });
  });

  it('sends initial command after session is created', async () => {
    // Mock requestAnimationFrame to execute immediately
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    render(<CommandTerminal initialCommand="claude auth login" />);

    await waitFor(() => {
      expect(terminalService.writeInput).toHaveBeenCalledWith(
        'test-session-123',
        'claude auth login\r'
      );
    });

    rafSpy.mockRestore();
  });

  it('does not send command when initialCommand is not provided', async () => {
    render(<CommandTerminal />);

    await waitFor(() => {
      expect(screen.getByTestId('embed-terminal')).toBeInTheDocument();
    });

    expect(terminalService.writeInput).not.toHaveBeenCalled();
  });

  it('closes terminal session on unmount', async () => {
    const { unmount } = render(<CommandTerminal />);

    await waitFor(() => {
      expect(screen.getByTestId('embed-terminal')).toBeInTheDocument();
    });

    unmount();

    expect(terminalService.closeTerminal).toHaveBeenCalledWith('test-session-123');
  });

  it('calls onExit when PTY process exits', async () => {
    const onExit = vi.fn();
    render(<CommandTerminal onExit={onExit} />);

    await waitFor(() => {
      expect(screen.getByTestId('embed-terminal')).toBeInTheDocument();
    });

    // Simulate exit via the mocked EmbedTerminal
    screen.getByTestId('simulate-exit').click();

    expect(onExit).toHaveBeenCalledWith(0);
  });

  it('passes custom shell to createTerminal', async () => {
    render(<CommandTerminal shell="/bin/bash" />);

    await waitFor(() => {
      expect(terminalService.createTerminal).toHaveBeenCalledWith(
        expect.objectContaining({ shell: '/bin/bash' })
      );
    });
  });
});
