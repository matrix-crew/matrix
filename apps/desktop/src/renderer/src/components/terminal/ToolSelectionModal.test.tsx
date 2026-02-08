import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolSelectionModal } from './ToolSelectionModal';

describe('ToolSelectionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.api.readConfig).mockResolvedValue({
      onboarding_completed: true,
      detected_terminals: [
        { id: 'zsh', name: 'Zsh', path: '/bin/zsh', isDefault: true },
        { id: 'bash', name: 'Bash', path: '/bin/bash', isDefault: false },
      ],
    });
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <ToolSelectionModal isOpen={false} onClose={mockOnClose} onConfirm={mockOnConfirm} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with shell options when open', async () => {
    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText('New Terminal')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Zsh')).toBeInTheDocument();
      expect(screen.getByText('Bash')).toBeInTheDocument();
    });
  });

  it('shows default badge for default shell', async () => {
    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click backdrop (the dialog overlay)
    fireEvent.click(screen.getByRole('dialog'));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('calls onConfirm with selected shell when Create Terminal is clicked', async () => {
    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText('Create Terminal')).toBeInTheDocument();
    });

    // Default shell (Zsh) should be pre-selected
    fireEvent.click(screen.getByText('Create Terminal'));

    expect(mockOnConfirm).toHaveBeenCalledWith({
      shell: '/bin/zsh',
      name: 'Zsh',
    });
  });

  it('allows selecting a different shell', async () => {
    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText('Bash')).toBeInTheDocument();
    });

    // Click Bash
    fireEvent.click(screen.getByText('Bash'));

    // Then create
    fireEvent.click(screen.getByText('Create Terminal'));

    expect(mockOnConfirm).toHaveBeenCalledWith({
      shell: '/bin/bash',
      name: 'Bash',
    });
  });

  it('closes on Escape key', async () => {
    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText('New Terminal')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('shows loading state initially', () => {
    // Delay the config read
    vi.mocked(window.api.readConfig).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ detected_terminals: [] }), 1000))
    );

    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    expect(screen.getByText('Detecting shells...')).toBeInTheDocument();
  });

  it('falls back to detectTerminals when config has no detected_terminals', async () => {
    vi.mocked(window.api.readConfig).mockResolvedValue({
      onboarding_completed: true,
    });
    vi.mocked(window.api.detectTerminals).mockResolvedValue([
      { id: 'iterm2', name: 'iTerm2', path: '/Applications/iTerm.app', isDefault: true },
    ]);

    render(<ToolSelectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    await waitFor(() => {
      expect(screen.getByText('iTerm2')).toBeInTheDocument();
    });
  });
});
