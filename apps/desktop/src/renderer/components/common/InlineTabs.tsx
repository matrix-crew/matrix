/**
 * InlineTabs — Reusable inline tab component for compact tabbed content.
 *
 * Renders a row of pill-shaped tab buttons with the associated content panel.
 * Designed for embedding inside cards or sections (not full-page navigation).
 */
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface InlineTab {
  label: string;
  content: React.ReactNode;
}

interface InlineTabsProps {
  tabs: InlineTab[];
  defaultIndex?: number;
  className?: string;
}

export const InlineTabs: React.FC<InlineTabsProps> = ({ tabs, defaultIndex = 0, className }) => {
  const [active, setActive] = useState(defaultIndex);

  if (tabs.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Tab buttons */}
      <div className="flex gap-1">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              i === active
                ? 'bg-base-600 text-text-primary'
                : 'text-text-muted hover:bg-base-700 hover:text-text-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div>{tabs[active].content}</div>
    </div>
  );
};

InlineTabs.displayName = 'InlineTabs';
