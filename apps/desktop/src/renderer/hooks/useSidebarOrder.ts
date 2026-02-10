import { useState, useCallback, useEffect, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────

export type SidebarGroupId = 'workflow' | 'agent' | 'source';

export type ContextItemId = 'sources' | 'kanban' | 'pipeline' | 'console' | 'mcp';

export interface SidebarOrder {
  groups: SidebarGroupId[];
  items: Record<SidebarGroupId, ContextItemId[]>;
}

// ─── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_ORDER: SidebarOrder = {
  groups: ['workflow', 'agent', 'source'],
  items: {
    workflow: ['kanban', 'pipeline'],
    agent: ['console', 'mcp'],
    source: ['sources'],
  },
};

// ─── LocalStorage cache ───────────────────────────────────────────────

const LS_KEY = 'maxtix-sidebar-order';

function readCache(): SidebarOrder | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SidebarOrder;
  } catch {
    return null;
  }
}

function writeCache(order: SidebarOrder): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(order));
  } catch {
    // localStorage unavailable
  }
}

// ─── Reconciliation ───────────────────────────────────────────────────

/**
 * Merge persisted order with defaults.
 * - Keeps only groups/items that exist in defaults
 * - Appends any new groups/items from defaults that are missing in persisted
 */
export function reconcileWithDefaults(persisted: SidebarOrder): SidebarOrder {
  const defaultGroups = DEFAULT_ORDER.groups;
  const defaultItems = DEFAULT_ORDER.items;

  // Filter persisted groups to only those that still exist, then append new ones
  const knownGroups = persisted.groups.filter((g) => defaultGroups.includes(g));
  const missingGroups = defaultGroups.filter((g) => !knownGroups.includes(g));
  const groups = [...knownGroups, ...missingGroups];

  // For each group, reconcile items
  const items = {} as Record<SidebarGroupId, ContextItemId[]>;
  for (const groupId of groups) {
    const defaultGroupItems = defaultItems[groupId] ?? [];
    const persistedGroupItems = persisted.items?.[groupId] ?? [];

    const knownItems = persistedGroupItems.filter((i) => defaultGroupItems.includes(i));
    const missingItems = defaultGroupItems.filter((i) => !knownItems.includes(i));
    items[groupId] = [...knownItems, ...missingItems];
  }

  return { groups, items };
}

// ─── Persistence helper ───────────────────────────────────────────────

function persist(order: SidebarOrder): void {
  writeCache(order);
  window.api?.writeConfig({ sidebar_order: order }).catch(() => {});
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useSidebarOrder() {
  const cached = useMemo(() => readCache(), []);

  const [order, setOrder] = useState<SidebarOrder>(() => {
    return cached ? reconcileWithDefaults(cached) : DEFAULT_ORDER;
  });

  // Async load from config on mount
  useEffect(() => {
    (async () => {
      try {
        const config = await window.api.readConfig();
        const saved = config.sidebar_order as SidebarOrder | undefined;
        if (saved?.groups && saved?.items) {
          const reconciled = reconcileWithDefaults(saved);
          setOrder((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(reconciled)) return prev;
            return reconciled;
          });
          writeCache(reconciled);
        }
      } catch {
        // Use defaults / cached
      }
    })();
  }, []);

  const reorderGroups = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setOrder((prev) => {
      const newGroups = [...prev.groups];
      const [moved] = newGroups.splice(fromIndex, 1);
      newGroups.splice(toIndex, 0, moved);
      const next = { ...prev, groups: newGroups };
      persist(next);
      return next;
    });
  }, []);

  const reorderItems = useCallback(
    (groupId: SidebarGroupId, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      setOrder((prev) => {
        const groupItems = prev.items[groupId];
        if (!groupItems) return prev;
        const newItems = [...groupItems];
        const [moved] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, moved);
        const next = { ...prev, items: { ...prev.items, [groupId]: newItems } };
        persist(next);
        return next;
      });
    },
    []
  );

  return { order, reorderGroups, reorderItems };
}
