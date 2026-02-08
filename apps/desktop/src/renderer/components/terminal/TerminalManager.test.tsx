import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TerminalManager } from './TerminalManager';

// Mock the TerminalService
vi.mock('@/services/TerminalService', () => ({
  terminalService: {
    initialize: vi.fn(),
    destroy: vi.fn(),
    createTerminal: vi.fn().mockResolvedValue({
      id: 'test-session-1',
      name: 'Default Shell 1',
      shell: '/bin/zsh',
      cwd: '~',
      status: 'active',
      pid: 1234,
      createdAt: new Date(),
    }),
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
  MAX_TERMINAL_SESSIONS: 12,
}));

// Mock TerminalInstance since it requires xterm.js / canvas
vi.mock('./TerminalInstance', () => ({
  TerminalInstance: React.forwardRef(
    ({ sessionId }: { sessionId: string }, _ref: React.Ref<unknown>) => (
      <div data-testid={`terminal-instance-${sessionId}`}>Terminal Instance</div>
    )
  ),
}));

describe('TerminalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset readConfig mock to return detected terminals
    vi.mocked(window.api.readConfig).mockResolvedValue({
      onboarding_completed: true,
      detected_terminals: [
        { id: 'zsh', name: 'Zsh', path: '/bin/zsh', isDefault: true },
        { id: 'bash', name: 'Bash', path: '/bin/bash', isDefault: false },
      ],
    });
  });

  it('renders empty state when no sessions exist', () => {
    render(<TerminalManager />);
    expect(screen.getByText('No terminal sessions')).toBeInTheDocument();
    expect(screen.getByText('Create Terminal')).toBeInTheDocument();
  });

  it('renders terminal manager region', () => {
    render(<TerminalManager />);
    expect(screen.getByRole('region', { name: 'Terminal Manager' })).toBeInTheDocument();
  });

  it('opens tool selection modal when create button is clicked', async () => {
    render(<TerminalManager />);

    // Click the "Create Terminal" button in the empty state
    fireEvent.click(screen.getByText('Create Terminal'));

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('New Terminal')).toBeInTheDocument();
    });
  });

  it('opens tool selection modal with + button', async () => {
    render(<TerminalManager />);

    // Click the + button in the tab bar
    fireEvent.click(screen.getByLabelText('Create new terminal'));

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('New Terminal')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel is clicked', async () => {
    render(<TerminalManager />);

    // Open modal
    fireEvent.click(screen.getByText('Create Terminal'));

    await waitFor(() => {
      expect(screen.getByText('New Terminal')).toBeInTheDocument();
    });

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('New Terminal')).not.toBeInTheDocument();
    });
  });
});
