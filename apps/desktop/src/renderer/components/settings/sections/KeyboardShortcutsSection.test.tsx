import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutProvider } from '@/contexts/ShortcutProvider';
import { KeyboardShortcutsSection } from './KeyboardShortcutsSection';

// ─── Setup ────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(window.api.readConfig).mockResolvedValue({
    onboarding_completed: true,
  });
  vi.mocked(window.api.writeConfig).mockResolvedValue({ success: true });

  localStorage.clear();

  vi.stubGlobal('navigator', { platform: 'MacIntel' });
});

function renderSection() {
  return render(
    <ShortcutProvider>
      <KeyboardShortcutsSection />
    </ShortcutProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('KeyboardShortcutsSection', () => {
  it('renders section header', () => {
    renderSection();

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('View and customize keyboard shortcuts')).toBeInTheDocument();
  });

  it('renders all shortcut categories', () => {
    renderSection();

    expect(screen.getByText('Tabs')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Context Panel')).toBeInTheDocument();
  });

  it('renders all 17 default shortcuts', () => {
    renderSection();

    // Tab shortcuts
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 9')).toBeInTheDocument();

    // Navigation
    expect(screen.getByText('Open Settings')).toBeInTheDocument();
    expect(screen.getByText('Toggle DevTools')).toBeInTheDocument();
    expect(screen.getByText('Create Matrix')).toBeInTheDocument();

    // Context panel
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Console')).toBeInTheDocument();
    expect(screen.getByText('MCP')).toBeInTheDocument();
  });

  it('does not show "Reset All" when no overrides exist', () => {
    renderSection();
    expect(screen.queryByText('Reset All')).not.toBeInTheDocument();
  });

  it('does not show conflict warning when no conflicts', () => {
    renderSection();
    expect(screen.queryByText(/conflicting key bindings/)).not.toBeInTheDocument();
  });

  it('opens recorder modal when clicking a binding button', async () => {
    const user = userEvent.setup();
    renderSection();

    // Find the ⌘S button (Sources context shortcut)
    const allButtons = screen.getAllByRole('button');
    const bindingButton = allButtons.find((btn) => btn.textContent?.includes('\u2318S'));
    expect(bindingButton).toBeDefined();
    await user.click(bindingButton!);

    expect(screen.getByText('Record Shortcut')).toBeInTheDocument();
    expect(screen.getByText(/Press a key combination/)).toBeInTheDocument();
  });

  it('shows "Reset All" when overrides exist', async () => {
    localStorage.setItem('matrix-shortcuts', JSON.stringify({ 'tab-1': 'meta+shift+1' }));

    renderSection();
    expect(screen.getByText('Reset All')).toBeInTheDocument();
  });

  it('shows conflict warning when overrides create duplicates', () => {
    // Set context-sources to same binding as tab-1 (meta+1)
    localStorage.setItem('matrix-shortcuts', JSON.stringify({ 'context-sources': 'meta+1' }));

    renderSection();
    expect(screen.getByText(/conflicting key bindings/)).toBeInTheDocument();
  });
});
