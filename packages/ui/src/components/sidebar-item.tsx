import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * SidebarItem variants using class-variance-authority
 *
 * Defines visual styles for sidebar navigation items with active state.
 * Uses Tailwind CSS classes with proper dark mode support.
 */
const sidebarItemVariants = cva(
  'flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  {
    variants: {
      variant: {
        default:
          'text-gray-300 hover:bg-gray-800 hover:text-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50',
        active:
          'bg-lime-500/10 text-lime-400 hover:bg-lime-500/20 dark:bg-lime-500/10 dark:text-lime-400 dark:hover:bg-lime-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SidebarItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarItemVariants> {
  /** Icon element or component to display on the left */
  icon?: React.ReactNode;
  /** Label text for the menu item */
  label: string;
  /** Keyboard shortcut indicator (e.g., "⌘K", "Ctrl+K") */
  shortcut?: string;
  /** Whether this item is currently active/selected */
  active?: boolean;
}

/**
 * SidebarItem component
 *
 * A navigation item for the sidebar with icon, label, and optional keyboard shortcut indicator.
 * Supports active state highlighting for the currently selected item.
 *
 * @example
 * <SidebarItem icon={<KanbanIcon />} label="Kanban Board" shortcut="⌘K" />
 * <SidebarItem icon={<PipelineIcon />} label="Pipeline" shortcut="⌘P" active />
 */
const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, variant, icon, label, shortcut, active, ...props }, ref) => {
    const computedVariant = active ? 'active' : variant;

    return (
      <button
        className={cn(sidebarItemVariants({ variant: computedVariant, className }))}
        ref={ref}
        role="menuitem"
        aria-current={active ? 'page' : undefined}
        title={label}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <span className="flex-shrink-0 [&_svg]:size-5 [&_svg]:pointer-events-none" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Label */}
        <span className="flex-1 truncate text-left">{label}</span>

        {/* Keyboard Shortcut */}
        {shortcut && (
          <span
            className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-mono bg-gray-800/50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-400"
            aria-label={`Keyboard shortcut: ${shortcut}`}
          >
            {shortcut}
          </span>
        )}
      </button>
    );
  }
);
SidebarItem.displayName = 'SidebarItem';

export { SidebarItem, sidebarItemVariants };
