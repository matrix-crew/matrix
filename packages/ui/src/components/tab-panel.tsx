import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * TabPanel variants using class-variance-authority
 *
 * Defines base styles for tab panel content containers.
 * Uses Tailwind CSS classes with proper focus handling.
 */
const tabPanelVariants = cva('flex-1 overflow-auto focus:outline-none', {
  variants: {
    padding: {
      none: '',
      sm: 'p-2',
      default: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    padding: 'none',
  },
});

export interface TabPanelProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>,
    VariantProps<typeof tabPanelVariants> {
  /** The unique identifier for this tab panel */
  id: T;
  /** The currently active tab ID */
  activeTab: T;
  /** Content to render inside the panel */
  children: React.ReactNode;
}

/**
 * TabPanel component
 *
 * Container component for tab content that handles visibility based on active tab.
 * Implements proper ARIA attributes for accessibility.
 * Works with TabNavigation component for complete tab UI.
 *
 * @example
 * type MyTabId = 'workflow' | 'agent' | 'settings';
 *
 * const [activeTab, setActiveTab] = useState<MyTabId>('workflow');
 *
 * <TabPanel<MyTabId> id="workflow" activeTab={activeTab}>
 *   <WorkflowContent />
 * </TabPanel>
 */
function TabPanel<T extends string = string>({
  id,
  activeTab,
  children,
  className,
  padding,
  ...props
}: TabPanelProps<T>): React.ReactElement | null {
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
      className={cn(tabPanelVariants({ padding, className }))}
      {...props}
    >
      {children}
    </div>
  );
}

TabPanel.displayName = 'TabPanel';

export { TabPanel, tabPanelVariants };
