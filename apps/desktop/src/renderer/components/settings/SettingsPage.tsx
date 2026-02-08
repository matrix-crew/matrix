import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import {
  type SettingsSectionId,
  SETTINGS_SECTIONS,
  SETTINGS_GROUPS,
  getSettingsSection,
  getDefaultSectionId,
} from '@/types/settings';
import {
  AppearanceSection,
  DisplaySection,
  LanguageSection,
  NotificationsSection,
  DeveloperToolsSection,
  AgentSettingsSection,
  PathsSection,
  DebugLogsSection,
} from './sections';

/**
 * Sidebar item variants using class-variance-authority
 */
const sidebarItemVariants = cva(
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all cursor-pointer w-full text-left',
  {
    variants: {
      active: {
        true: 'bg-accent-cyan/10 text-accent-cyan',
        false: 'text-text-secondary hover:bg-base-700 hover:text-text-primary',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

/**
 * Props for the SettingsPage component
 */
export interface SettingsPageProps {
  initialSection?: SettingsSectionId;
  onSectionChange?: (sectionId: SettingsSectionId) => void;
  className?: string;
}

/**
 * Props for SidebarItem component
 */
interface SidebarItemProps extends VariantProps<typeof sidebarItemVariants> {
  sectionId: SettingsSectionId;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Sidebar navigation item component
 */
const SidebarItem: React.FC<SidebarItemProps> = ({
  sectionId,
  label,
  description,
  active,
  onClick,
  onKeyDown,
}) => (
  <button
    type="button"
    onClick={onClick}
    onKeyDown={onKeyDown}
    className={cn(sidebarItemVariants({ active }))}
    role="tab"
    aria-selected={active}
    aria-controls={`settings-panel-${sectionId}`}
    id={`settings-tab-${sectionId}`}
    tabIndex={active ? 0 : -1}
  >
    <div className="flex flex-col items-start">
      <span className="font-medium">{label}</span>
      <span className="text-xs text-text-muted">{description}</span>
    </div>
  </button>
);

/**
 * Props for SidebarGroup component
 */
interface SidebarGroupProps {
  label: string;
  sectionIds: SettingsSectionId[];
  activeSection: SettingsSectionId;
  onSectionClick: (sectionId: SettingsSectionId) => void;
  onKeyDown: (event: React.KeyboardEvent, sectionId: SettingsSectionId) => void;
}

/**
 * Sidebar group component containing multiple section items
 */
const SidebarGroup: React.FC<SidebarGroupProps> = ({
  label,
  sectionIds,
  activeSection,
  onSectionClick,
  onKeyDown,
}) => (
  <div className="space-y-1">
    <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
      {label}
    </h3>
    <div className="space-y-1">
      {sectionIds.map((sectionId) => {
        const section = getSettingsSection(sectionId);
        if (!section) return null;
        return (
          <SidebarItem
            key={sectionId}
            sectionId={sectionId}
            label={section.label}
            description={section.description}
            active={activeSection === sectionId}
            onClick={() => onSectionClick(sectionId)}
            onKeyDown={(e) => onKeyDown(e, sectionId)}
          />
        );
      })}
    </div>
  </div>
);

/**
 * Get the section component for a given section ID
 */
const getSectionComponent = (sectionId: SettingsSectionId): React.ReactNode => {
  switch (sectionId) {
    case 'appearance':
      return <AppearanceSection />;
    case 'display':
      return <DisplaySection />;
    case 'language':
      return <LanguageSection />;
    case 'notifications':
      return <NotificationsSection />;
    case 'developer-tools':
      return <DeveloperToolsSection />;
    case 'agent-settings':
      return <AgentSettingsSection />;
    case 'paths':
      return <PathsSection />;
    case 'debug-logs':
      return <DebugLogsSection />;
    default:
      return null;
  }
};

const SettingsPage: React.FC<SettingsPageProps> = ({
  initialSection,
  onSectionChange,
  className,
}) => {
  const [activeSection, setActiveSection] = React.useState<SettingsSectionId>(
    () => initialSection ?? getDefaultSectionId()
  );

  const handleSectionChange = React.useCallback(
    (sectionId: SettingsSectionId) => {
      setActiveSection(sectionId);
      onSectionChange?.(sectionId);
    },
    [onSectionChange]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent, currentSectionId: SettingsSectionId) => {
      const allSectionIds = SETTINGS_SECTIONS.map((s) => s.id);
      const currentIndex = allSectionIds.indexOf(currentSectionId);

      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = currentIndex < allSectionIds.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : allSectionIds.length - 1;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = allSectionIds.length - 1;
          break;
      }

      if (nextIndex !== null) {
        const nextSectionId = allSectionIds[nextIndex];
        handleSectionChange(nextSectionId);
        const nextElement = document.getElementById(`settings-tab-${nextSectionId}`);
        nextElement?.focus();
      }
    },
    [handleSectionChange]
  );

  return (
    <div
      className={cn('flex h-full overflow-hidden', className)}
      role="region"
      aria-label="Settings"
    >
      {/* Sidebar Navigation */}
      <nav
        className="flex w-64 flex-shrink-0 flex-col border-r border-border-default bg-base-800"
        role="tablist"
        aria-orientation="vertical"
        aria-label="Settings sections"
      >
        {/* Settings Header */}
        <div className="border-b border-border-default p-4">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <p className="mt-1 text-xs text-text-muted">Configure Matrix preferences</p>
        </div>

        {/* Sidebar Sections */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-4">
            {SETTINGS_GROUPS.map((group) => (
              <SidebarGroup
                key={group.id}
                label={group.label}
                sectionIds={group.sections}
                activeSection={activeSection}
                onSectionClick={handleSectionChange}
                onKeyDown={handleKeyDown}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main
        className="flex-1 overflow-y-auto bg-base-900 p-6"
        role="tabpanel"
        id={`settings-panel-${activeSection}`}
        aria-labelledby={`settings-tab-${activeSection}`}
        tabIndex={0}
      >
        <div className="mx-auto max-w-2xl">{getSectionComponent(activeSection)}</div>
      </main>
    </div>
  );
};

SettingsPage.displayName = 'SettingsPage';

export { SettingsPage, sidebarItemVariants };
