import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Terminal } from 'lucide-react';
import { ToolSelectionModal, type SelectionItem } from './ToolSelectionModal';

const shells: SelectionItem[] = [
  { id: 'zsh', name: 'Zsh', description: '/bin/zsh', isDefault: true },
  { id: 'bash', name: 'Bash', description: '/bin/bash', isDefault: false },
];

describe('ToolSelectionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    items: shells,
    title: 'New Terminal',
    icon: Terminal,
    description: 'Select a shell:',
    confirmLabel: 'Create Terminal',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(<ToolSelectionModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with items when open', () => {
    render(<ToolSelectionModal {...defaultProps} />);

    expect(screen.getByText('New Terminal')).toBeInTheDocument();
    expect(screen.getByText('Zsh')).toBeInTheDocument();
    expect(screen.getByText('Bash')).toBeInTheDocument();
  });

  it('shows default badge for default item', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    expect(screen.getByText('Select a shell:')).toBeInTheDocument();
  });

  it('shows item description (path)', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    expect(screen.getByText('/bin/zsh')).toBeInTheDocument();
    expect(screen.getByText('/bin/bash')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('calls onConfirm with default item when confirm is clicked', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Create Terminal'));

    expect(mockOnConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 'zsh', name: 'Zsh' }));
  });

  it('allows selecting a different item', () => {
    render(<ToolSelectionModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Bash'));
    fireEvent.click(screen.getByText('Create Terminal'));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bash', name: 'Bash' })
    );
  });

  it('closes on Escape key', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('confirms on Enter key', () => {
    render(<ToolSelectionModal {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockOnConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 'zsh' }));
  });

  it('shows loading state', () => {
    render(
      <ToolSelectionModal
        {...defaultProps}
        items={[]}
        isLoading={true}
        loadingText="Detecting shells..."
      />
    );
    expect(screen.getByText('Detecting shells...')).toBeInTheDocument();
  });

  it('disables confirm button when loading', () => {
    render(<ToolSelectionModal {...defaultProps} items={[]} isLoading={true} />);
    expect(screen.getByText('Create Terminal').closest('button')).toBeDisabled();
  });

  it('auto-selects first item when no default', () => {
    const items: SelectionItem[] = [
      { id: 'fish', name: 'Fish', description: '/bin/fish' },
      { id: 'bash', name: 'Bash', description: '/bin/bash' },
    ];
    render(<ToolSelectionModal {...defaultProps} items={items} />);
    fireEvent.click(screen.getByText('Create Terminal'));

    expect(mockOnConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 'fish' }));
  });

  it('uses custom confirm label', () => {
    render(<ToolSelectionModal {...defaultProps} confirmLabel="Open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
