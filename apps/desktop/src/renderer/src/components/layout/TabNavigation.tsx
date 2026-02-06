import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Tab definition with label and unique identifier
 */
export type TabId = 'workflow' | 'agent' | 'workspace';

export interface Tab {
  id: TabId;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Pre-defined tabs for the Maxtix application
 */
export const TABS: Tab[] = [
  { id: 'workflow', label: 'Workflow' },
  { id: 'agent', label: 'Agent' },
  { id: 'workspace', label: 'Workspace' },
];

/**
 * Tab button variants using class-variance-authority
 *
 * Defines visual styles for tab buttons in active and inactive states.
 * Uses Tailwind CSS classes with proper composition and responsive design.
 */
const tabButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      active: {
        true: 'border-b-2 border-gray-900 text-gray-900 dark:border-gray-50 dark:text-gray-50',
        false:
          'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface TabNavigationProps extends VariantProps<typeof tabButtonVariants> {
  /** Currently active tab ID */
  activeTab: TabId;
  /** Callback when a tab is selected */
  onTabChange: (tabId: TabId) => void;
  /** Additional CSS classes for the navigation container */
  className?: string;
}

/**
 * TabNavigation component
 *
 * Main navigation component for switching between Workflow, Agent, and Workspace tabs.
 * Provides keyboard navigation and accessibility features.
 *
 * @example
 * const [activeTab, setActiveTab] = useState<TabId>('workflow');
 * <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
 */
const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  /**
   * Handle keyboard navigation between tabs
   */
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    if (event.key === 'ArrowLeft') {
      newIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1;
    } else if (event.key === 'ArrowRight') {
      newIndex = currentIndex === TABS.length - 1 ? 0 : currentIndex + 1;
    } else if (event.key === 'Home') {
      newIndex = 0;
    } else if (event.key === 'End') {
      newIndex = TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    onTabChange(TABS[newIndex].id);
  };

  return (
    <nav
      className={cn('flex border-b border-gray-200 dark:border-gray-800', className)}
      role="tablist"
      aria-label="Main navigation"
    >
      {TABS.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          id={`tab-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={cn(tabButtonVariants({ active: activeTab === tab.id }))}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

TabNavigation.displayName = 'TabNavigation';

export { TabNavigation, tabButtonVariants };
