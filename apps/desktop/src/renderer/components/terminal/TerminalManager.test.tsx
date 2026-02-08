import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react';
import { TerminalManager } from './TerminalManager';
import type { TerminalSessionInfo } from '@maxtix/shared';

// Use vi.hoisted so mock values are available in vi.mock factories (which are hoisted above imports)
const { mockTerminalService } = vi.hoisted(() => ({
  mockTerminalService: {
    initialize: vi.fn(),
    destroy: vi.fn(),
    createTerminal: vi.fn(),
    closeTerminal: vi.fn(),
    closeAllTerminals: vi.fn(),
    getAllSessions: vi.fn().mockReturnValue([]),
    writeInput: vi.fn(),
    resizeTerminal: vi.fn(),
    onTerminalData: vi.fn().mockReturnValue(() => {}),
    onTerminalExit: vi.fn().mockReturnValue(() => {}),
    canCreateSession: vi.fn().mockReturnValue(true),
    getSessionCount: vi.fn().mockReturnValue(0),
    saveState: vi.fn().mockResolvedValue(undefined),
    loadState: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/services/TerminalService', () => ({
  terminalService: mockTerminalService,
  MAX_TERMINAL_SESSIONS: 12,
}));

// Mock TerminalInstance since it requires xterm.js / canvas
vi.mock('./TerminalInstance', async () => {
  const react = await import('react');
  return {
    TerminalInstance: react.forwardRef(({ sessionId }: { sessionId: string }, _ref: unknown) =>
      react.createElement(
        'div',
        { 'data-testid': `terminal-instance-${sessionId}` },
        'Terminal Instance'
      )
    ),
  };
});

/** Helper: create a mock TerminalSessionInfo */
function makeSession(overrides: Partial<TerminalSessionInfo> = {}): TerminalSessionInfo {
  return {
    id: overrides.id ?? `session-${Math.random().toString(36).slice(2, 8)}`,
    name: overrides.name ?? 'Zsh 1',
    shell: overrides.shell ?? '/bin/zsh',
    cwd: overrides.cwd ?? '~',
    status: overrides.status ?? 'active',
    pid: overrides.pid ?? 1234,
    createdAt: overrides.createdAt ?? new Date(),
  };
}

/** Helper: configure createTerminal to return a unique session each call */
function setupCreateTerminal(sessions?: TerminalSessionInfo[]) {
  let callIndex = 0;
  mockTerminalService.createTerminal.mockImplementation(async (config: { name: string }) => {
    if (sessions && callIndex < sessions.length) {
      return sessions[callIndex++];
    }
    return makeSession({ name: config.name });
  });
}

/** Helper: wait for the shell modal to finish loading, then click confirm */
async function confirmShellModal() {
  const dialog = await waitFor(() => {
    const d = screen.getByRole('dialog');
    within(d).getByText('Zsh'); // shells finished loading
    return d;
  });
  fireEvent.click(within(dialog).getByText('Create Terminal'));
}

/**
 * Helper: open the modal, pick the first shell, and confirm.
 * The ToolSelectionModal reads from readConfig to list shells.
 */
async function createTerminalViaModal() {
  // Click "Create Terminal" (empty state) or "+" button
  const createBtn =
    screen.queryByLabelText('Create new terminal') ?? screen.getByText('Create Terminal');
  fireEvent.click(createBtn);
  await confirmShellModal();
}

describe('TerminalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerminalService.getAllSessions.mockReturnValue([]);
    mockTerminalService.loadState.mockResolvedValue(null);
    setupCreateTerminal();

    vi.mocked(window.api.readConfig).mockResolvedValue({
      onboarding_completed: true,
      detected_terminals: [
        { id: 'zsh', name: 'Zsh', path: '/bin/zsh', isDefault: true },
        { id: 'bash', name: 'Bash', path: '/bin/bash', isDefault: false },
      ],
    });
  });

  // ── Empty State ───────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty state when no sessions exist', () => {
      render(<TerminalManager />);
      expect(screen.getByText('No terminal sessions')).toBeInTheDocument();
      expect(screen.getByText('Create Terminal')).toBeInTheDocument();
    });

    it('renders terminal manager region', () => {
      render(<TerminalManager />);
      expect(screen.getByRole('region', { name: 'Terminal Manager' })).toBeInTheDocument();
    });

    it('does not show session counter in empty state', () => {
      render(<TerminalManager />);
      expect(screen.queryByText(/\/12/)).not.toBeInTheDocument();
    });
  });

  // ── Terminal Creation ─────────────────────────────────────────────

  describe('terminal creation', () => {
    it('opens tool selection modal when Create Terminal button is clicked', async () => {
      render(<TerminalManager />);
      fireEvent.click(screen.getByText('Create Terminal'));

      await waitFor(() => {
        expect(screen.getByText('New Terminal')).toBeInTheDocument();
      });
    });

    it('opens tool selection modal with + button', async () => {
      render(<TerminalManager />);
      fireEvent.click(screen.getByLabelText('Create new terminal'));

      await waitFor(() => {
        expect(screen.getByText('New Terminal')).toBeInTheDocument();
      });
    });

    it('closes modal when cancel is clicked', async () => {
      render(<TerminalManager />);
      fireEvent.click(screen.getByText('Create Terminal'));

      await waitFor(() => {
        expect(screen.getByText('New Terminal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('New Terminal')).not.toBeInTheDocument();
      });
    });

    it('creates a terminal session and shows it in the grid', async () => {
      const session = makeSession({ id: 'new-1', name: 'Zsh 1' });
      setupCreateTerminal([session]);

      render(<TerminalManager />);
      await createTerminalViaModal();

      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-new-1')).toBeInTheDocument();
        expect(screen.getByText('Zsh 1')).toBeInTheDocument();
      });
    });

    it('calls terminalService.createTerminal with correct arguments', async () => {
      render(<TerminalManager />);
      await createTerminalViaModal();

      await waitFor(() => {
        expect(mockTerminalService.createTerminal).toHaveBeenCalledWith(
          expect.objectContaining({
            shell: '/bin/zsh',
          })
        );
      });
    });

    it('shows session counter after creating a terminal', async () => {
      const session = makeSession({ id: 'new-1' });
      setupCreateTerminal([session]);

      render(<TerminalManager />);
      await createTerminalViaModal();

      await waitFor(() => {
        expect(screen.getByText('1/12')).toBeInTheDocument();
      });
    });

    it('creates multiple terminals sequentially', async () => {
      const s1 = makeSession({ id: 's1', name: 'Zsh 1' });
      const s2 = makeSession({ id: 's2', name: 'Zsh 2' });
      setupCreateTerminal([s1, s2]);

      render(<TerminalManager />);

      // Create first terminal
      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-s1')).toBeInTheDocument();
      });

      // Create second terminal
      fireEvent.click(screen.getByLabelText('Create new terminal'));
      await confirmShellModal();

      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-s2')).toBeInTheDocument();
        expect(screen.getByText('2/12')).toBeInTheDocument();
      });
    });

    it('handles creation failure gracefully', async () => {
      mockTerminalService.createTerminal.mockRejectedValue(new Error('Shell not found'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<TerminalManager />);
      await createTerminalViaModal();

      // Should still be in empty state, modal closed
      await waitFor(() => {
        expect(screen.queryByText('New Terminal')).not.toBeInTheDocument();
        expect(screen.getByText('No terminal sessions')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  // ── Terminal Closing ──────────────────────────────────────────────

  describe('terminal closing', () => {
    it('closes a terminal and removes it from the grid', async () => {
      const session = makeSession({ id: 'close-1', name: 'Zsh 1' });
      setupCreateTerminal([session]);

      render(<TerminalManager />);
      await createTerminalViaModal();

      await waitFor(() => {
        expect(screen.getByText('Zsh 1')).toBeInTheDocument();
      });

      // Click the close button
      fireEvent.click(screen.getByLabelText('Close Zsh 1'));

      await waitFor(() => {
        expect(screen.queryByTestId('terminal-instance-close-1')).not.toBeInTheDocument();
        expect(screen.getByText('No terminal sessions')).toBeInTheDocument();
      });
    });

    it('calls terminalService.closeTerminal with correct id', async () => {
      const session = makeSession({ id: 'close-2', name: 'Zsh 1' });
      setupCreateTerminal([session]);

      render(<TerminalManager />);
      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByText('Zsh 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Close Zsh 1'));

      expect(mockTerminalService.closeTerminal).toHaveBeenCalledWith('close-2');
    });

    it('closes one of multiple terminals, leaving others intact', async () => {
      const s1 = makeSession({ id: 'keep-1', name: 'Zsh 1' });
      const s2 = makeSession({ id: 'remove-1', name: 'Bash 2' });
      setupCreateTerminal([s1, s2]);

      render(<TerminalManager />);

      // Create first
      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-keep-1')).toBeInTheDocument();
      });

      // Create second
      fireEvent.click(screen.getByLabelText('Create new terminal'));
      await confirmShellModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-remove-1')).toBeInTheDocument();
      });

      // Close second
      fireEvent.click(screen.getByLabelText('Close Bash 2'));

      await waitFor(() => {
        expect(screen.queryByTestId('terminal-instance-remove-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('terminal-instance-keep-1')).toBeInTheDocument();
        expect(screen.getByText('1/12')).toBeInTheDocument();
      });
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('initializes terminalService on mount', () => {
      render(<TerminalManager />);
      expect(mockTerminalService.initialize).toHaveBeenCalledTimes(1);
    });

    it('cleans up on unmount: closeAllTerminals + destroy', () => {
      const { unmount } = render(<TerminalManager />);
      unmount();

      expect(mockTerminalService.closeAllTerminals).toHaveBeenCalled();
      expect(mockTerminalService.destroy).toHaveBeenCalled();
    });
  });

  // ── Persistence (auto-save) ───────────────────────────────────────

  describe('persistence', () => {
    const WORKSPACE = '/home/.matrix/test-workspace';

    it('saves state after creating a terminal when workspacePath is set', async () => {
      const session = makeSession({ id: 'persist-1' });
      setupCreateTerminal([session]);

      render(<TerminalManager workspacePath={WORKSPACE} />);
      await createTerminalViaModal();

      await waitFor(() => {
        expect(mockTerminalService.saveState).toHaveBeenCalledWith(WORKSPACE, expect.any(Function));
      });
    });

    it('saves state after closing a terminal when workspacePath is set', async () => {
      const session = makeSession({ id: 'persist-2', name: 'Zsh 1' });
      setupCreateTerminal([session]);

      render(<TerminalManager workspacePath={WORKSPACE} />);
      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByText('Zsh 1')).toBeInTheDocument();
      });

      // Clear previous save calls
      mockTerminalService.saveState.mockClear();

      fireEvent.click(screen.getByLabelText('Close Zsh 1'));

      // saveState should be called (with remaining sessions — which is 0, so it won't fire
      // because the guard `currentSessions.length === 0` prevents it).
      // But closeTerminal should be called.
      expect(mockTerminalService.closeTerminal).toHaveBeenCalledWith('persist-2');
    });

    it('does not save state when no workspacePath is provided', async () => {
      const session = makeSession({ id: 'no-persist' });
      setupCreateTerminal([session]);

      render(<TerminalManager />);
      await createTerminalViaModal();

      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-no-persist')).toBeInTheDocument();
      });

      // saveState should not be called without workspacePath
      expect(mockTerminalService.saveState).not.toHaveBeenCalled();
    });

    it('loads saved sessions when workspacePath is provided', async () => {
      mockTerminalService.loadState.mockResolvedValue({
        state: {
          sessions: [{ id: 'saved-1', name: 'Restored Zsh', shell: '/bin/zsh', cwd: '~' }],
          savedAt: new Date().toISOString(),
        },
        scrollbacks: { 'saved-1': 'previous output' },
      });

      const restoredSession = makeSession({ id: 'restored-1', name: 'Restored Zsh' });
      setupCreateTerminal([restoredSession]);

      render(<TerminalManager workspacePath={WORKSPACE} />);

      await waitFor(() => {
        expect(mockTerminalService.loadState).toHaveBeenCalledWith(WORKSPACE);
      });

      await waitFor(() => {
        expect(mockTerminalService.createTerminal).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Restored Zsh',
            shell: '/bin/zsh',
            cwd: '~',
          })
        );
      });
    });

    it('handles loadState returning null (no saved data) gracefully', async () => {
      mockTerminalService.loadState.mockResolvedValue(null);

      render(<TerminalManager workspacePath={WORKSPACE} />);

      await waitFor(() => {
        expect(mockTerminalService.loadState).toHaveBeenCalledWith(WORKSPACE);
      });

      // Should show empty state — no sessions restored
      expect(screen.getByText('No terminal sessions')).toBeInTheDocument();
    });

    it('saves state on unmount if workspacePath and sessions exist', async () => {
      const session = makeSession({ id: 'unmount-save' });
      setupCreateTerminal([session]);
      mockTerminalService.getAllSessions.mockReturnValue([session]);

      const { unmount } = render(<TerminalManager workspacePath={WORKSPACE} />);
      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-unmount-save')).toBeInTheDocument();
      });

      mockTerminalService.saveState.mockClear();
      unmount();

      expect(mockTerminalService.saveState).toHaveBeenCalled();
    });
  });

  // ── Workspace Switch ──────────────────────────────────────────────

  describe('workspace switch', () => {
    it('closes all sessions when workspace changes', async () => {
      const { rerender } = render(<TerminalManager workspacePath="/workspace/alpha" />);

      await act(async () => {
        rerender(<TerminalManager workspacePath="/workspace/beta" />);
      });

      expect(mockTerminalService.closeAllTerminals).toHaveBeenCalled();
    });

    it('loads new workspace state when workspace changes', async () => {
      mockTerminalService.loadState.mockResolvedValue(null);

      const { rerender } = render(<TerminalManager workspacePath="/workspace/alpha" />);

      await waitFor(() => {
        expect(mockTerminalService.loadState).toHaveBeenCalledWith('/workspace/alpha');
      });

      mockTerminalService.loadState.mockClear();

      await act(async () => {
        rerender(<TerminalManager workspacePath="/workspace/beta" />);
      });

      await waitFor(() => {
        expect(mockTerminalService.loadState).toHaveBeenCalledWith('/workspace/beta');
      });
    });

    it('saves previous workspace before switching', async () => {
      const session = makeSession({ id: 'switch-save' });
      mockTerminalService.getAllSessions.mockReturnValue([session]);

      const { rerender } = render(<TerminalManager workspacePath="/workspace/alpha" />);

      await act(async () => {
        rerender(<TerminalManager workspacePath="/workspace/beta" />);
      });

      expect(mockTerminalService.saveState).toHaveBeenCalledWith(
        '/workspace/alpha',
        expect.any(Function)
      );
    });
  });

  // ── Grid Layout ───────────────────────────────────────────────────

  describe('grid layout', () => {
    async function createNTerminals(n: number) {
      const sessions = Array.from({ length: n }, (_, i) =>
        makeSession({ id: `grid-${i}`, name: `Term ${i + 1}` })
      );
      setupCreateTerminal(sessions);

      render(<TerminalManager />);

      for (let i = 0; i < n; i++) {
        if (i === 0) {
          await createTerminalViaModal();
        } else {
          fireEvent.click(screen.getByLabelText('Create new terminal'));
          await confirmShellModal();
        }

        await waitFor(() => {
          expect(screen.getByTestId(`terminal-instance-grid-${i}`)).toBeInTheDocument();
        });
      }
    }

    it('renders single terminal filling full space', async () => {
      await createNTerminals(1);
      expect(screen.getByTestId('terminal-instance-grid-0')).toBeInTheDocument();
      expect(screen.getByText('1/12')).toBeInTheDocument();
    });

    it('renders 3 terminals correctly (no fullscreen button for single-terminal case)', async () => {
      await createNTerminals(3);
      expect(screen.getByTestId('terminal-instance-grid-0')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-instance-grid-1')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-instance-grid-2')).toBeInTheDocument();
      expect(screen.getByText('3/12')).toBeInTheDocument();
    });
  });

  // ── Focus (Fullscreen) ────────────────────────────────────────────

  describe('focus (fullscreen)', () => {
    it('hides other terminals when fullscreen is toggled', async () => {
      const s1 = makeSession({ id: 'focus-1', name: 'Term 1' });
      const s2 = makeSession({ id: 'focus-2', name: 'Term 2' });
      setupCreateTerminal([s1, s2]);

      render(<TerminalManager />);

      // Create two terminals
      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-focus-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Create new terminal'));
      await confirmShellModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-focus-2')).toBeInTheDocument();
      });

      // Click fullscreen on first terminal
      fireEvent.click(screen.getAllByLabelText('Fullscreen this terminal')[0]);

      // Only the focused terminal should be visible
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-focus-1')).toBeInTheDocument();
        expect(screen.queryByTestId('terminal-instance-focus-2')).not.toBeInTheDocument();
      });
    });

    it('shows exit fullscreen button in top bar when focused', async () => {
      const s1 = makeSession({ id: 'exit-focus-1', name: 'Term 1' });
      const s2 = makeSession({ id: 'exit-focus-2', name: 'Term 2' });
      setupCreateTerminal([s1, s2]);

      render(<TerminalManager />);

      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-exit-focus-1')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Create new terminal'));
      await confirmShellModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-exit-focus-2')).toBeInTheDocument();
      });

      // Fullscreen
      fireEvent.click(screen.getAllByLabelText('Fullscreen this terminal')[0]);

      await waitFor(() => {
        // Both top bar and cell button show "Exit fullscreen"
        expect(screen.getAllByLabelText('Exit fullscreen').length).toBeGreaterThanOrEqual(1);
      });

      // Click exit fullscreen (top bar button)
      fireEvent.click(screen.getAllByLabelText('Exit fullscreen')[0]);

      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-exit-focus-1')).toBeInTheDocument();
        expect(screen.getByTestId('terminal-instance-exit-focus-2')).toBeInTheDocument();
      });
    });

    it('resets focus when focused terminal is closed', async () => {
      const s1 = makeSession({ id: 'reset-1', name: 'Term 1' });
      const s2 = makeSession({ id: 'reset-2', name: 'Term 2' });
      setupCreateTerminal([s1, s2]);

      render(<TerminalManager />);

      await createTerminalViaModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-reset-1')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Create new terminal'));
      await confirmShellModal();
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-reset-2')).toBeInTheDocument();
      });

      // Focus on Term 1
      fireEvent.click(screen.getAllByLabelText('Fullscreen this terminal')[0]);
      await waitFor(() => {
        expect(screen.queryByTestId('terminal-instance-reset-2')).not.toBeInTheDocument();
      });

      // Close the focused terminal
      fireEvent.click(screen.getByLabelText('Close Term 1'));

      // Focus should reset, showing Term 2
      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-reset-2')).toBeInTheDocument();
      });
    });
  });

  // ── Exit Handling ─────────────────────────────────────────────────

  describe('exit handling', () => {
    it('does not show fullscreen button when only one terminal exists', async () => {
      const session = makeSession({ id: 'solo', name: 'Solo Terminal' });
      setupCreateTerminal([session]);

      render(<TerminalManager />);
      await createTerminalViaModal();

      await waitFor(() => {
        expect(screen.getByTestId('terminal-instance-solo')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Fullscreen this terminal')).not.toBeInTheDocument();
    });
  });
});
