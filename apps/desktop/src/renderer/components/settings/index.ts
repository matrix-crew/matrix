/**
 * Settings Page Components
 *
 * Re-exports settings page component and section components for easy importing.
 */

// Export main settings page component with its variants
export { SettingsPage, sidebarItemVariants } from './SettingsPage';

// Export settings page prop types
export type { SettingsPageProps } from './SettingsPage';

// Re-export section components and their variants
export {
  AgentSettingsSection,
  AppearanceSection,
  DebugLogsSection,
  DeveloperToolsSection,
  DisplaySection,
  LanguageSection,
  NotificationsSection,
  PathsSection,
  modelCardVariants,
  ideCardVariants,
  sizeCardVariants,
  languageCardVariants,
} from './sections';

// Re-export section prop types
export type {
  AgentSettingsSectionProps,
  AppearanceSectionProps,
  DebugLogsSectionProps,
  DeveloperToolsSectionProps,
  DisplaySectionProps,
  LanguageSectionProps,
  NotificationsSectionProps,
  PathsSectionProps,
} from './sections';
