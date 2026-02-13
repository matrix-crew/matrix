import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Use vi.hoisted so mock values are available in vi.mock factories
const { mockTerminalService, mockTerminalInstance } = vi.hoisted(() => ({
  mockTerminalService: {
    initialize: vi.fn(),
    createTerminal: vi.fn(),
    closeTerminal: vi.fn(),
    writeInput: vi.fn(),
    onTerminalData: vi.fn().mockReturnValue(() => {}),
    onTerminalExit: vi.fn().mockReturnValue(() => {}),
  },
  mockTerminalInstance: {
    open: vi.fn(),
    write: vi.fn(),
    onData: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    dispose: vi.fn(),
  },
}));

vi.mock('@/services/TerminalService', () => ({
  terminalService: mockTerminalService,
}));

vi.mock('@xterm/xterm', () => {
  return {
    Terminal: class MockTerminal {
      open = mockTerminalInstance.open;
      write = mockTerminalInstance.write;
      onData = mockTerminalInstance.onData;
      dispose = mockTerminalInstance.dispose;
    },
  };
});

// Mock xterm CSS import
vi.mock('@xterm/xterm/css/xterm.css', () => ({}));

import { MiniTerminal } from './MiniTerminal';

/** Reset mock call history without clearing implementations */
function resetMockCalls() {
  mockTerminalService.initialize.mockClear();
  mockTerminalService.createTerminal.mockClear();
  mockTerminalService.closeTerminal.mockClear();
  mockTerminalService.writeInput.mockClear();
  mockTerminalService.onTerminalData.mockClear();
  mockTerminalService.onTerminalExit.mockClear();
  mockTerminalInstance.open.mockClear();
  mockTerminalInstance.write.mockClear();
  mockTerminalInstance.onData.mockClear();
  mockTerminalInstance.dispose.mockClear();
}

describe('MiniTerminal', () => {
  beforeEach(() => {
    resetMockCalls();

    // Re-apply default return values (mockClear preserves implementation but resets calls)
    mockTerminalInstance.onData.mockReturnValue({ dispose: vi.fn() });
    mockTerminalService.onTerminalData.mockReturnValue(() => {});
    mockTerminalService.onTerminalExit.mockReturnValue(() => {});

    // Default: detectShells returns a default shell
    vi.mocked(window.api.detectShells).mockResolvedValue([
      { id: 'zsh', name: 'Zsh', path: '/bin/zsh', isDefault: true },
    ]);

    // Default: createTerminal succeeds
    mockTerminalService.createTerminal.mockResolvedValue({
      id: 'mini-session-1',
      name: 'mini-terminal',
      shell: '/bin/zsh',
      cwd: '~',
      status: 'active',
      pid: 9999,
      createdAt: new Date(),
    });
  });

  it('renders a container with aria-label', () => {
    render(<MiniTerminal command="brew install gh" />);
    expect(screen.getByRole('region', { name: /Terminal: brew install gh/ })).toBeInTheDocument();
  });

  it('initializes TerminalService on mount', async () => {
    render(<MiniTerminal command="brew install gh" />);
    await vi.waitFor(() => {
      expect(mockTerminalService.initialize).toHaveBeenCalled();
    });
  });

  it('detects shells and creates a terminal session', async () => {
    render(<MiniTerminal command="brew install gh" rows={3} />);

    await vi.waitFor(() => {
      expect(window.api.detectShells).toHaveBeenCalled();
      expect(mockTerminalService.createTerminal).toHaveBeenCalledWith({
        name: 'mini-terminal',
        shell: '/bin/zsh',
        cols: 80,
        rows: 3,
      });
    });
  });

  it('opens xterm.js terminal on the container', async () => {
    render(<MiniTerminal command="gh auth login" />);

    await vi.waitFor(() => {
      expect(mockTerminalInstance.open).toHaveBeenCalled();
    });
  });

  it('auto-executes command on first PTY data', async () => {
    let dataHandler: ((data: string) => void) | null = null;
    mockTerminalService.onTerminalData.mockImplementation(
      (_sessionId: string, handler: (data: string) => void) => {
        dataHandler = handler;
        return () => {};
      }
    );

    render(<MiniTerminal command="brew install gh" />);

    await vi.waitFor(() => {
      expect(dataHandler).not.toBeNull();
    });

    // Simulate shell ready (first data from PTY)
    dataHandler!('$ ');

    expect(mockTerminalService.writeInput).toHaveBeenCalledWith(
      'mini-session-1',
      'brew install gh\r'
    );
  });

  it('sends command only once even with multiple data events', async () => {
    let dataHandler: ((data: string) => void) | null = null;
    mockTerminalService.onTerminalData.mockImplementation(
      (_sessionId: string, handler: (data: string) => void) => {
        dataHandler = handler;
        return () => {};
      }
    );

    render(<MiniTerminal command="brew install gh" />);

    await vi.waitFor(() => {
      expect(dataHandler).not.toBeNull();
    });

    dataHandler!('$ ');
    dataHandler!('brew install gh\r\n');

    const autoExecCalls = vi
      .mocked(mockTerminalService.writeInput)
      .mock.calls.filter((call) => call[1] === 'brew install gh\r');
    expect(autoExecCalls).toHaveLength(1);
  });

  it('cleans up terminal session on unmount', async () => {
    const { unmount } = render(<MiniTerminal command="test-command" />);

    // Wait for async setup to fully complete (onTerminalData is called last)
    await vi.waitFor(() => {
      expect(mockTerminalService.onTerminalData).toHaveBeenCalled();
    });

    unmount();

    expect(mockTerminalInstance.dispose).toHaveBeenCalled();
    expect(mockTerminalService.closeTerminal).toHaveBeenCalledWith('mini-session-1');
  });

  it('uses rows=5 when specified', async () => {
    render(<MiniTerminal command="gh auth login" rows={5} />);

    await vi.waitFor(() => {
      expect(mockTerminalService.createTerminal).toHaveBeenCalledWith(
        expect.objectContaining({ rows: 5 })
      );
    });
  });

  it('falls back to /bin/zsh when no shells detected', async () => {
    vi.mocked(window.api.detectShells).mockResolvedValue([]);

    render(<MiniTerminal command="brew install gh" />);

    await vi.waitFor(() => {
      expect(mockTerminalService.createTerminal).toHaveBeenCalledWith(
        expect.objectContaining({ shell: '/bin/zsh' })
      );
    });
  });
});
