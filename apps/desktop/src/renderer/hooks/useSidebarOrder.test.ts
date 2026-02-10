import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarOrder, reconcileWithDefaults, type SidebarOrder } from './useSidebarOrder';

// ─── Setup ────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.mocked(window.api.readConfig).mockResolvedValue({});
  vi.mocked(window.api.writeConfig).mockResolvedValue({ success: true });
});

// ─── reconcileWithDefaults ────────────────────────────────────────────

describe('reconcileWithDefaults', () => {
  it('returns defaults when persisted matches', () => {
    const order: SidebarOrder = {
      groups: ['workflow', 'agent', 'source'],
      items: {
        workflow: ['kanban', 'pipeline'],
        agent: ['console', 'mcp'],
        source: ['sources'],
      },
    };
    expect(reconcileWithDefaults(order)).toEqual(order);
  });

  it('preserves custom group order', () => {
    const order: SidebarOrder = {
      groups: ['source', 'workflow', 'agent'],
      items: {
        workflow: ['kanban', 'pipeline'],
        agent: ['console', 'mcp'],
        source: ['sources'],
      },
    };
    const result = reconcileWithDefaults(order);
    expect(result.groups).toEqual(['source', 'workflow', 'agent']);
  });

  it('preserves custom item order within groups', () => {
    const order: SidebarOrder = {
      groups: ['workflow', 'agent', 'source'],
      items: {
        workflow: ['pipeline', 'kanban'],
        agent: ['mcp', 'console'],
        source: ['sources'],
      },
    };
    const result = reconcileWithDefaults(order);
    expect(result.items.workflow).toEqual(['pipeline', 'kanban']);
    expect(result.items.agent).toEqual(['mcp', 'console']);
  });

  it('appends missing groups from defaults', () => {
    const order: SidebarOrder = {
      groups: ['workflow'],
      items: {
        workflow: ['kanban', 'pipeline'],
        agent: [],
        source: [],
      },
    };
    const result = reconcileWithDefaults(order);
    expect(result.groups).toEqual(['workflow', 'agent', 'source']);
  });

  it('appends missing items within a group', () => {
    const order: SidebarOrder = {
      groups: ['workflow', 'agent', 'source'],
      items: {
        workflow: ['kanban'],
        agent: ['console'],
        source: [],
      },
    };
    const result = reconcileWithDefaults(order);
    expect(result.items.workflow).toEqual(['kanban', 'pipeline']);
    expect(result.items.agent).toEqual(['console', 'mcp']);
    expect(result.items.source).toEqual(['sources']);
  });

  it('removes unknown groups', () => {
    const order = {
      groups: ['workflow', 'unknown' as never, 'agent', 'source'],
      items: {
        workflow: ['kanban', 'pipeline'],
        agent: ['console', 'mcp'],
        source: ['sources'],
      },
    } as SidebarOrder;
    const result = reconcileWithDefaults(order);
    expect(result.groups).toEqual(['workflow', 'agent', 'source']);
  });

  it('removes unknown items', () => {
    const order = {
      groups: ['workflow', 'agent', 'source'],
      items: {
        workflow: ['kanban', 'unknown' as never, 'pipeline'],
        agent: ['console', 'mcp'],
        source: ['sources'],
      },
    } as SidebarOrder;
    const result = reconcileWithDefaults(order);
    expect(result.items.workflow).toEqual(['kanban', 'pipeline']);
  });
});

// ─── useSidebarOrder hook ─────────────────────────────────────────────

describe('useSidebarOrder', () => {
  it('returns default order when no persisted data', () => {
    const { result } = renderHook(() => useSidebarOrder());
    expect(result.current.order.groups).toEqual(['workflow', 'agent', 'source']);
    expect(result.current.order.items.workflow).toEqual(['kanban', 'pipeline']);
    expect(result.current.order.items.agent).toEqual(['console', 'mcp']);
    expect(result.current.order.items.source).toEqual(['sources']);
  });

  it('reads from localStorage on init', () => {
    const cached: SidebarOrder = {
      groups: ['source', 'agent', 'workflow'],
      items: {
        workflow: ['pipeline', 'kanban'],
        agent: ['mcp', 'console'],
        source: ['sources'],
      },
    };
    localStorage.setItem('maxtix-sidebar-order', JSON.stringify(cached));

    const { result } = renderHook(() => useSidebarOrder());
    expect(result.current.order.groups).toEqual(['source', 'agent', 'workflow']);
    expect(result.current.order.items.workflow).toEqual(['pipeline', 'kanban']);
  });

  it('reorderGroups moves a group to a new position', () => {
    const { result } = renderHook(() => useSidebarOrder());

    act(() => {
      result.current.reorderGroups(0, 2); // workflow from 0 to 2
    });

    expect(result.current.order.groups).toEqual(['agent', 'source', 'workflow']);
  });

  it('reorderGroups persists to localStorage and config', () => {
    const { result } = renderHook(() => useSidebarOrder());

    act(() => {
      result.current.reorderGroups(0, 2);
    });

    const cached = JSON.parse(localStorage.getItem('maxtix-sidebar-order')!);
    expect(cached.groups).toEqual(['agent', 'source', 'workflow']);
    expect(window.api.writeConfig).toHaveBeenCalledWith({
      sidebar_order: expect.objectContaining({
        groups: ['agent', 'source', 'workflow'],
      }),
    });
  });

  it('reorderItems swaps items within a group', () => {
    const { result } = renderHook(() => useSidebarOrder());

    act(() => {
      result.current.reorderItems('workflow', 0, 1); // kanban ↔ pipeline
    });

    expect(result.current.order.items.workflow).toEqual(['pipeline', 'kanban']);
  });

  it('reorderItems persists to localStorage and config', () => {
    const { result } = renderHook(() => useSidebarOrder());

    act(() => {
      result.current.reorderItems('agent', 0, 1);
    });

    const cached = JSON.parse(localStorage.getItem('maxtix-sidebar-order')!);
    expect(cached.items.agent).toEqual(['mcp', 'console']);
    expect(window.api.writeConfig).toHaveBeenCalledWith({
      sidebar_order: expect.objectContaining({
        items: expect.objectContaining({ agent: ['mcp', 'console'] }),
      }),
    });
  });

  it('reorderGroups no-op when from === to', () => {
    const { result } = renderHook(() => useSidebarOrder());
    vi.mocked(window.api.writeConfig).mockClear();

    act(() => {
      result.current.reorderGroups(1, 1);
    });

    expect(result.current.order.groups).toEqual(['workflow', 'agent', 'source']);
    expect(window.api.writeConfig).not.toHaveBeenCalled();
  });

  it('reorderItems no-op when from === to', () => {
    const { result } = renderHook(() => useSidebarOrder());
    vi.mocked(window.api.writeConfig).mockClear();

    act(() => {
      result.current.reorderItems('workflow', 0, 0);
    });

    expect(result.current.order.items.workflow).toEqual(['kanban', 'pipeline']);
    expect(window.api.writeConfig).not.toHaveBeenCalled();
  });

  it('loads from config on mount and reconciles', async () => {
    vi.mocked(window.api.readConfig).mockResolvedValue({
      sidebar_order: {
        groups: ['source', 'workflow', 'agent'],
        items: {
          workflow: ['pipeline', 'kanban'],
          agent: ['console', 'mcp'],
          source: ['sources'],
        },
      },
    });

    const { result } = renderHook(() => useSidebarOrder());

    // Wait for async config load
    await vi.waitFor(() => {
      expect(result.current.order.groups).toEqual(['source', 'workflow', 'agent']);
    });
    expect(result.current.order.items.workflow).toEqual(['pipeline', 'kanban']);
  });
});
