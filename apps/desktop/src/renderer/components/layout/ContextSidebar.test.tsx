import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutProvider } from '@/contexts/ShortcutProvider';
import { ContextSidebar } from './ContextSidebar';

function renderSidebar(activeItem: string = 'kanban', onItemSelect = vi.fn()) {
  return render(
    <ShortcutProvider>
      <ContextSidebar activeItem={activeItem as 'kanban'} onItemSelect={onItemSelect} />
    </ShortcutProvider>
  );
}

describe('ContextSidebar', () => {
  it('renders group titles: Workflow, Agent, Source', () => {
    renderSidebar();

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(['Workflow', 'Agent', 'Source']);
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('renders Terminal label instead of Console', () => {
    renderSidebar('console');

    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.queryByText('Console')).not.toBeInTheDocument();
  });

  it('renders all items with correct labels', () => {
    renderSidebar();

    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('MCP')).toBeInTheDocument();
    expect(screen.getByText('Sources')).toBeInTheDocument();
  });

  it('highlights active item', () => {
    renderSidebar('kanban');

    const kanbanButton = screen.getByRole('button', { name: /Kanban/i });
    expect(kanbanButton.className).toContain('bg-accent-lime');
  });

  it('calls onItemSelect when clicking an item', async () => {
    const user = userEvent.setup();
    const onItemSelect = vi.fn();
    renderSidebar('kanban', onItemSelect);

    await user.click(screen.getByRole('button', { name: /Pipeline/i }));
    expect(onItemSelect).toHaveBeenCalledWith('pipeline');

    await user.click(screen.getByRole('button', { name: /Terminal/i }));
    expect(onItemSelect).toHaveBeenCalledWith('console');
  });
});
