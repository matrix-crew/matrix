import * as React from 'react';
import { cn } from '@/lib/utils';
import type { TabId } from './TabNavigation';

export interface TabPanelProps {
  /** The unique identifier for this tab panel */
  id: TabId;
  /** The currently active tab ID */
  activeTab: TabId;
  /** Content to render inside the panel */
  children: React.ReactNode;
  /** Additional CSS classes for the panel */
  className?: string;
}

/**
 * TabPanel component
 *
 * Container component for tab content that handles visibility based on active tab.
 * Implements proper ARIA attributes for accessibility.
 *
 * @example
 * <TabPanel id="workflow" activeTab={activeTab}>
 *   <WorkflowContent />
 * </TabPanel>
 */
const TabPanel: React.FC<TabPanelProps> = ({ id, activeTab, children, className }) => {
  const isActive = activeTab === id;

  if (!isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={cn('flex-1 overflow-auto focus:outline-none', className)}
    >
      {children}
    </div>
  );
};

TabPanel.displayName = 'TabPanel';

export { TabPanel };
