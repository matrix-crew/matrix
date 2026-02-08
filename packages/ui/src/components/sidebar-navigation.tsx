import * as React from 'react';
import { cn } from '../lib/utils';
import { CollapsibleSection } from './collapsible-section';
import { SidebarItem } from './sidebar-item';

/**
 * Navigation item definition
 */
export interface NavigationItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label for the item */
  label: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Optional keyboard shortcut indicator */
  shortcut?: string;
}

/**
 * Navigation section with collapsible items
 */
export interface NavigationSection {
  /** Unique identifier for the section */
  id: string;
  /** Section header title */
  title: string;
  /** Items within this section */
  items: NavigationItem[];
  /** Whether the section is initially expanded (default: true) */
  defaultExpanded?: boolean;
}

export interface SidebarNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /** Currently active/selected item ID */
  activeItemId?: string;
  /** Callback when a navigation item is selected */
  onItemSelect?: (itemId: string) => void;
  /** Navigation sections to render */
  sections?: NavigationSection[];
  /** Additional CSS classes for the sidebar container */
  className?: string;
}

/**
 * Default navigation sections for the Maxtix application
 */
export const DEFAULT_NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    id: 'workflow',
    title: 'Workflow',
    items: [
      { id: 'kanban', label: 'Kanban Board', shortcut: '⌘K' },
      { id: 'pipeline', label: 'Pipeline', shortcut: '⌘P' },
    ],
    defaultExpanded: true,
  },
  {
    id: 'agent',
    title: 'Agent',
    items: [
      { id: 'terminals', label: 'Terminals', shortcut: '⌘A' },
      { id: 'insights', label: 'Insights', shortcut: '⌘N' },
    ],
    defaultExpanded: true,
  },
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { id: 'branches', label: 'Branches', shortcut: '⌘B' },
      { id: 'issues', label: 'Issues', shortcut: '⌘I' },
      { id: 'prs', label: 'PRs', shortcut: '⌘R' },
    ],
    defaultExpanded: true,
  },
];

/**
 * SidebarNavigation component
 *
 * Main sidebar navigation component that composes collapsible sections and navigation items.
 * Features a Matrix space selector placeholder at the top and hierarchical navigation sections.
 *
 * @example
 * const [activeItem, setActiveItem] = useState('kanban');
 * <SidebarNavigation activeItemId={activeItem} onItemSelect={setActiveItem} />
 *
 * @example
 * // Custom sections
 * const customSections = [
 *   { id: 'custom', title: 'Custom', items: [{ id: 'item1', label: 'Item 1' }] }
 * ];
 * <SidebarNavigation sections={customSections} />
 */
const SidebarNavigation = React.forwardRef<HTMLElement, SidebarNavigationProps>(
  (
    { className, activeItemId, onItemSelect, sections = DEFAULT_NAVIGATION_SECTIONS, ...props },
    ref
  ) => {
    /**
     * Handle navigation item click
     */
    const handleItemClick = (itemId: string) => {
      if (onItemSelect) {
        onItemSelect(itemId);
      }
    };

    return (
      <nav
        className={cn(
          'flex h-full w-64 flex-col bg-gray-900 text-gray-50 dark:bg-gray-900 dark:text-gray-50',
          className
        )}
        ref={ref}
        role="navigation"
        aria-label="Sidebar navigation"
        {...props}
      >
        {/* Matrix Space Selector Placeholder */}
        <div className="flex items-center justify-center border-b border-gray-800 px-4 py-4">
          <div className="rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Project
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <CollapsibleSection
              key={section.id}
              title={section.title}
              defaultExpanded={section.defaultExpanded}
              variant="borderless"
            >
              <div role="menu" aria-label={`${section.title} navigation`}>
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    active={activeItemId === item.id}
                    onClick={() => handleItemClick(item.id)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      </nav>
    );
  }
);
SidebarNavigation.displayName = 'SidebarNavigation';

export { SidebarNavigation };
