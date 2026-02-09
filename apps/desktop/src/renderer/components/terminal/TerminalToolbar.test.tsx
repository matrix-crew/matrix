import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TerminalToolbar } from './TerminalToolbar';
import type { TerminalSessionInfo } from '@shared/types/terminal';

function makeSession(overrides?: Partial<TerminalSessionInfo>): TerminalSessionInfo {
  return {
    id: 'test-session',
    name: 'Test Terminal',
    shell: '/bin/zsh',
    cwd: '/Users/test',
    status: 'active',
    pid: 1234,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('TerminalToolbar', () => {
  it('renders shell name', () => {
    render(<TerminalToolbar session={makeSession()} />);
    expect(screen.getByText('/bin/zsh')).toBeInTheDocument();
  });

  it('renders cwd', () => {
    render(<TerminalToolbar session={makeSession()} />);
    expect(screen.getByText('/Users/test')).toBeInTheDocument();
  });

  it('renders PID', () => {
    render(<TerminalToolbar session={makeSession()} />);
    expect(screen.getByText('PID 1234')).toBeInTheDocument();
  });

  it('shows green status for active session', () => {
    render(<TerminalToolbar session={makeSession({ status: 'active' })} />);
    const status = screen.getByLabelText('Status: active');
    expect(status).toBeInTheDocument();
    expect(status.className).toContain('bg-green-500');
  });

  it('shows gray status for exited session', () => {
    render(<TerminalToolbar session={makeSession({ status: 'exited' })} />);
    const status = screen.getByLabelText('Status: exited');
    expect(status.className).toContain('bg-gray-500');
  });

  it('shows red status for error session', () => {
    render(<TerminalToolbar session={makeSession({ status: 'error' })} />);
    const status = screen.getByLabelText('Status: error');
    expect(status.className).toContain('bg-red-500');
  });

  it('does not render PID when not available', () => {
    render(<TerminalToolbar session={makeSession({ pid: undefined })} />);
    expect(screen.queryByText(/PID/)).not.toBeInTheDocument();
  });
});
