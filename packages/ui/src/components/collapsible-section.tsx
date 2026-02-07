import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * CollapsibleSection variants using class-variance-authority
 *
 * Defines visual styles for the collapsible section container and header.
 * Uses Tailwind CSS classes with proper dark mode support.
 */
const collapsibleSectionVariants = cva('w-full', {
  variants: {
    variant: {
      default: 'border-b border-gray-800 dark:border-gray-800',
      borderless: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const collapsibleHeaderVariants = cva(
  'flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'text-gray-400 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const collapsibleContentVariants = cva(
  'overflow-hidden transition-all duration-200 ease-in-out',
  {
    variants: {
      expanded: {
        true: 'opacity-100',
        false: 'opacity-0 h-0',
      },
    },
    defaultVariants: {
      expanded: true,
    },
  }
);

export interface CollapsibleSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof collapsibleSectionVariants> {
  /** Title text for the section header */
  title: string;
  /** Content to show/hide when toggling the section */
  children: React.ReactNode;
  /** Whether the section is initially expanded (default: true) */
  defaultExpanded?: boolean;
  /** Controlled expanded state (use with onExpandedChange for controlled component) */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * ChevronIcon component
 *
 * Simple chevron icon that rotates based on expanded state
 */
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    className={cn(
      'size-4 transition-transform duration-200',
      expanded ? 'rotate-90' : 'rotate-0'
    )}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

/**
 * CollapsibleSection component
 *
 * An expandable/collapsible section container for sidebar navigation.
 * Displays a clickable header with title and chevron icon, and toggleable content area.
 * Supports both controlled and uncontrolled usage.
 *
 * @example
 * // Uncontrolled (default)
 * <CollapsibleSection title="Workflow">
 *   <SidebarItem icon={<Icon />} label="Kanban Board" shortcut="⌘K" />
 *   <SidebarItem icon={<Icon />} label="Pipeline" shortcut="⌘P" />
 * </CollapsibleSection>
 *
 * @example
 * // Controlled
 * const [expanded, setExpanded] = useState(true);
 * <CollapsibleSection
 *   title="Agent"
 *   expanded={expanded}
 *   onExpandedChange={setExpanded}
 * >
 *   <SidebarItem icon={<Icon />} label="Terminals" />
 * </CollapsibleSection>
 */
const CollapsibleSection = React.forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  (
    {
      className,
      variant,
      title,
      children,
      defaultExpanded = true,
      expanded: controlledExpanded,
      onExpandedChange,
      ...props
    },
    ref
  ) => {
    // Internal state for uncontrolled mode
    const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);

    // Use controlled value if provided, otherwise use internal state
    const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

    /**
     * Toggle expanded/collapsed state
     */
    const handleToggle = () => {
      const newExpanded = !isExpanded;

      // Update internal state for uncontrolled mode
      if (controlledExpanded === undefined) {
        setInternalExpanded(newExpanded);
      }

      // Call onChange callback if provided
      if (onExpandedChange) {
        onExpandedChange(newExpanded);
      }
    };

    /**
     * Handle keyboard navigation
     */
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    };

    return (
      <div
        className={cn(collapsibleSectionVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        {/* Section Header */}
        <button
          className={cn(collapsibleHeaderVariants({ variant }))}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={`collapsible-content-${title}`}
          role="button"
          type="button"
        >
          <span>{title}</span>
          <ChevronIcon expanded={isExpanded} />
        </button>

        {/* Collapsible Content */}
        <div
          id={`collapsible-content-${title}`}
          className={cn(collapsibleContentVariants({ expanded: isExpanded }))}
          role="region"
          aria-labelledby={`collapsible-header-${title}`}
          aria-hidden={!isExpanded}
        >
          {isExpanded && <div className="py-1">{children}</div>}
        </div>
      </div>
    );
  }
);
CollapsibleSection.displayName = 'CollapsibleSection';

export { CollapsibleSection, collapsibleSectionVariants };
