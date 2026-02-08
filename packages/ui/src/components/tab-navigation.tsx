import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * Generic Tab definition with label and unique identifier
 */
export interface Tab<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Tab button variants using class-variance-authority
 *
 * Defines visual styles for tab buttons in active and inactive states.
 * Uses Tailwind CSS classes with proper dark mode support.
 */
const tabNavigationVariants = cva(
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

export interface TabNavigationProps<T extends string = string>
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'onChange'>,
    VariantProps<typeof tabNavigationVariants> {
  /** Array of tabs to display */
  tabs: Tab<T>[];
  /** Currently active tab ID */
  activeTab: T;
  /** Callback when a tab is selected */
  onTabChange: (tabId: T) => void;
  /** Accessible label for the navigation */
  ariaLabel?: string;
}

/**
 * TabNavigation component
 *
 * A generic tab navigation component that accepts tabs as props.
 * Provides keyboard navigation (arrow keys, Home, End) and full accessibility support.
 *
 * @example
 * type MyTabId = 'workflow' | 'agent' | 'settings';
 *
 * const tabs: Tab<MyTabId>[] = [
 *   { id: 'workflow', label: 'Workflow' },
 *   { id: 'agent', label: 'Agent' },
 *   { id: 'settings', label: 'Settings' },
 * ];
 *
 * const [activeTab, setActiveTab] = useState<MyTabId>('workflow');
 * <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
 */
function TabNavigation<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
  ariaLabel = 'Tab navigation',
  ...props
}: TabNavigationProps<T>): React.ReactElement {
  /**
   * Handle keyboard navigation between tabs
   */
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    if (event.key === 'ArrowLeft') {
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    } else if (event.key === 'ArrowRight') {
      newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    } else if (event.key === 'Home') {
      newIndex = 0;
    } else if (event.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    onTabChange(tabs[newIndex].id);
  };

  return (
    <nav
      className={cn('flex border-b border-gray-200 dark:border-gray-800', className)}
      role="tablist"
      aria-label={ariaLabel}
      {...props}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          id={`tab-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={cn(tabNavigationVariants({ active: activeTab === tab.id }))}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {tab.icon && (
            <span className="mr-2 [&_svg]:size-4 [&_svg]:pointer-events-none" aria-hidden="true">
              {tab.icon}
            </span>
          )}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

TabNavigation.displayName = 'TabNavigation';

export { TabNavigation, tabNavigationVariants };
