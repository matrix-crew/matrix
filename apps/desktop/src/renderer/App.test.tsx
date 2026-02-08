import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import type { Matrix } from '@maxtix/shared';

const mockMatrix: Matrix = {
  id: 'matrix-1',
  name: 'My Project',
  source_ids: [],
  workspace_path: '/home/.matrix/my-project-abc',
  created_at: '2024-01-15T10:30:00+00:00',
  updated_at: '2024-01-15T10:30:00+00:00',
};

beforeEach(() => {
  vi.mocked(window.api.sendMessage).mockReset();
  vi.mocked(window.api.readConfig).mockReset();
});

describe('App', () => {
  it('shows loading state initially', () => {
    vi.mocked(window.api.readConfig).mockReturnValue(new Promise(() => {}));
    vi.mocked(window.api.sendMessage).mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows onboarding wizard when not completed', async () => {
    vi.mocked(window.api.readConfig).mockResolvedValue({ onboarding_completed: false });
    vi.mocked(window.api.sendMessage).mockResolvedValue({ success: true, data: { matrices: [] } });

    render(<App />);

    await waitFor(() => {
      // OnboardingWizard should render with a "Welcome to Matrix" heading
      expect(screen.getByText('Welcome to Matrix')).toBeInTheDocument();
    });
  });

  it('shows empty state when no matrices and onboarding completed', async () => {
    vi.mocked(window.api.readConfig).mockResolvedValue({ onboarding_completed: true });
    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: true,
      data: { matrices: [] },
    });

    render(<App />);

    await waitFor(() => {
      // Should show create matrix prompt (+ button in tab bar)
      const addButton = document.querySelector('button');
      expect(addButton).toBeInTheDocument();
    });
  });

  it('displays matrix tabs when matrices exist', async () => {
    vi.mocked(window.api.readConfig).mockResolvedValue({ onboarding_completed: true });
    vi.mocked(window.api.sendMessage).mockImplementation(async (msg) => {
      if (msg.type === 'matrix-list') {
        return { success: true, data: { matrices: [mockMatrix] } };
      }
      if (msg.type === 'matrix-get') {
        return { success: true, data: { matrix: mockMatrix } };
      }
      return { success: true, data: { sources: [] } };
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('My Project')).toBeInTheDocument();
    });
  });

  it('opens create form when + button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(window.api.readConfig).mockResolvedValue({ onboarding_completed: true });
    vi.mocked(window.api.sendMessage).mockResolvedValue({
      success: true,
      data: { matrices: [] },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find and click the + button (must exist)
    const addButtons = screen.getAllByRole('button');
    const addButton = addButtons.find(
      (btn) => btn.textContent?.includes('+') || btn.getAttribute('aria-label')?.includes('Create')
    );
    expect(addButton).toBeDefined();
    await user.click(addButton!);

    // Form dialog should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
