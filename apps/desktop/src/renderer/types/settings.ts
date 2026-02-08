/**
 * Settings Type Definitions
 *
 * Type definitions for the application settings page.
 * Provides structure for settings sections and categories.
 */

import type React from 'react';

/**
 * Settings section group identifiers
 */
export type SettingsGroupId = 'general' | 'development' | 'advanced';

/**
 * Settings section identifiers
 */
export type SettingsSectionId =
  | 'appearance'
  | 'display'
  | 'language'
  | 'developer-tools'
  | 'agent-settings'
  | 'paths'
  | 'notifications'
  | 'debug-logs';

/**
 * Settings section definition
 */
export interface SettingsSection {
  /** Unique identifier for the section */
  id: SettingsSectionId;
  /** Display label for the section */
  label: string;
  /** Description of what the section contains */
  description: string;
  /** Optional icon for the section (React node) */
  icon?: React.ReactNode;
  /** Group this section belongs to */
  group: SettingsGroupId;
}

/**
 * Settings group definition for sidebar organization
 */
export interface SettingsGroup {
  /** Unique identifier for the group */
  id: SettingsGroupId;
  /** Display label for the group */
  label: string;
  /** Sections belonging to this group */
  sections: SettingsSectionId[];
}

/**
 * Pre-defined settings sections organized by category
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  // General
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Customize how Matrix looks',
    group: 'general',
  },
  {
    id: 'display',
    label: 'Display',
    description: 'Adjust the size of UI elements',
    group: 'general',
  },
  {
    id: 'language',
    label: 'Language',
    description: 'Choose preferred language',
    group: 'general',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alert preferences',
    group: 'general',
  },
  // Development
  {
    id: 'developer-tools',
    label: 'Developer Tools',
    description: 'IDE and terminal preferences',
    group: 'development',
  },
  {
    id: 'agent-settings',
    label: 'Agent Settings',
    description: 'Default model and framework',
    group: 'development',
  },
  {
    id: 'paths',
    label: 'Paths',
    description: 'CLI tools and framework paths',
    group: 'development',
  },
  // Advanced
  {
    id: 'debug-logs',
    label: 'Debug & Logs',
    description: 'Troubleshooting tools',
    group: 'advanced',
  },
];

/**
 * Pre-defined settings groups for sidebar organization
 */
export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'general',
    label: 'General',
    sections: ['appearance', 'display', 'language', 'notifications'],
  },
  {
    id: 'development',
    label: 'Development',
    sections: ['developer-tools', 'agent-settings', 'paths'],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    sections: ['debug-logs'],
  },
];

/**
 * Get a settings section by its ID
 *
 * @param id - The section ID to look up
 * @returns The section definition or undefined if not found
 */
export function getSettingsSection(id: SettingsSectionId): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((section) => section.id === id);
}

/**
 * Get all sections belonging to a specific group
 *
 * @param groupId - The group ID to filter by
 * @returns Array of sections in the specified group
 */
export function getSectionsByGroup(groupId: SettingsGroupId): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((section) => section.group === groupId);
}

/**
 * Get the default section ID (first section)
 *
 * @returns The default section ID
 */
export function getDefaultSectionId(): SettingsSectionId {
  return SETTINGS_SECTIONS[0].id;
}
