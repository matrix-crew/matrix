/**
 * Maxtix UI Components Library
 *
 * Shared UI components built with React, TailwindCSS v4, and shadcn/ui patterns.
 * Designed for use across the Maxtix monorepo.
 */

// Export utilities
export { cn } from './lib/utils';

// Export components
export { Button, buttonVariants } from './components/button';
export type { ButtonProps } from './components/button';

export { SidebarItem, sidebarItemVariants } from './components/sidebar-item';
export type { SidebarItemProps } from './components/sidebar-item';

export { CollapsibleSection, collapsibleSectionVariants } from './components/collapsible-section';
export type { CollapsibleSectionProps } from './components/collapsible-section';

export { SidebarNavigation, DEFAULT_NAVIGATION_SECTIONS } from './components/sidebar-navigation';
export type {
  SidebarNavigationProps,
  NavigationItem,
  NavigationSection,
} from './components/sidebar-navigation';

export { TabNavigation, tabNavigationVariants } from './components/tab-navigation';
export type { Tab, TabNavigationProps } from './components/tab-navigation';

export { TabPanel, tabPanelVariants } from './components/tab-panel';
export type { TabPanelProps } from './components/tab-panel';
