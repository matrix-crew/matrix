import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the NotificationsSection component
 */
export interface NotificationsSectionProps {
  /** Additional CSS classes for the section container */
  className?: string;
}

/**
 * Settings group container component
 */
interface SettingsGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, description, children }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    {children}
  </div>
);

/**
 * Toggle switch component for notification settings
 */
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
  label,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={cn(
      'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
    )}
    role="switch"
    aria-checked={enabled}
    aria-label={label}
  >
    <span
      className={cn(
        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        enabled ? 'translate-x-5' : 'translate-x-0'
      )}
    />
  </button>
);

/**
 * Notification setting item component
 */
interface NotificationItemProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  description,
  enabled,
  onChange,
  disabled = false,
}) => (
  <label className="flex items-center justify-between">
    <div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <ToggleSwitch
      enabled={enabled}
      onChange={onChange}
      label={`Toggle ${title.toLowerCase()}`}
      disabled={disabled}
    />
  </label>
);

/**
 * NotificationsSection component
 *
 * Settings section for managing notification and alert preferences in the
 * Matrix application. Provides toggles for various notification types
 * including system alerts, task completion, and sound settings.
 *
 * @example
 * <NotificationsSection className="max-w-2xl" />
 */
const NotificationsSection: React.FC<NotificationsSectionProps> = ({ className }) => {
  // Placeholder state for notification settings (not persisted)
  const [desktopNotifications, setDesktopNotifications] = React.useState(true);
  const [taskCompletion, setTaskCompletion] = React.useState(true);
  const [errorAlerts, setErrorAlerts] = React.useState(true);
  const [updateNotifications, setUpdateNotifications] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(false);
  const [badgeCount, setBadgeCount] = React.useState(true);
  const [agentActivity, setAgentActivity] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState(true);

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="Notification Settings">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure how and when you receive alerts and notifications
        </p>
      </div>

      {/* General Notifications */}
      <SettingsGroup
        title="General Notifications"
        description="Control how notifications appear on your system"
      >
        <div className="space-y-4">
          <NotificationItem
            title="Desktop Notifications"
            description="Show system notifications for important events"
            enabled={desktopNotifications}
            onChange={setDesktopNotifications}
          />

          <NotificationItem
            title="Sound Alerts"
            description="Play sounds for notifications"
            enabled={soundEnabled}
            onChange={setSoundEnabled}
          />

          <NotificationItem
            title="Badge Count"
            description="Show unread count on the app icon"
            enabled={badgeCount}
            onChange={setBadgeCount}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Notification settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Task Notifications */}
      <SettingsGroup
        title="Task Notifications"
        description="Get notified about task and workflow events"
      >
        <div className="space-y-4">
          <NotificationItem
            title="Task Completion"
            description="Notify when a task or workflow completes"
            enabled={taskCompletion}
            onChange={setTaskCompletion}
          />

          <NotificationItem
            title="Error Alerts"
            description="Alert when errors occur during execution"
            enabled={errorAlerts}
            onChange={setErrorAlerts}
          />

          <NotificationItem
            title="Agent Activity"
            description="Show notifications for agent actions and progress"
            enabled={agentActivity}
            onChange={setAgentActivity}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Task notification settings coming in a future release.
        </p>
      </SettingsGroup>

      {/* System Notifications */}
      <SettingsGroup
        title="System Notifications"
        description="Notifications about application status and updates"
      >
        <div className="space-y-4">
          <NotificationItem
            title="Update Notifications"
            description="Notify when application updates are available"
            enabled={updateNotifications}
            onChange={setUpdateNotifications}
          />

          <NotificationItem
            title="Connection Status"
            description="Alert when connection to backend changes"
            enabled={connectionStatus}
            onChange={setConnectionStatus}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          System notification settings coming soon.
        </p>
      </SettingsGroup>

      {/* Do Not Disturb */}
      <SettingsGroup title="Do Not Disturb" description="Temporarily silence all notifications">
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Do Not Disturb
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Silence all notifications until turned off
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle do not disturb"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Schedule:</span>
            <select
              disabled
              className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
              aria-label="Do not disturb schedule"
            >
              <option>Never</option>
              <option>Custom schedule...</option>
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Do Not Disturb scheduling will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Notification History */}
      <SettingsGroup
        title="Notification History"
        description="Manage notification history settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Keep History For
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                How long to keep notification history
              </p>
            </div>
            <select
              disabled
              className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
              aria-label="Notification history duration"
            >
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
              <option>Forever</option>
            </select>
          </div>

          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            Clear Notification History
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Notification history management coming in a future release.
        </p>
      </SettingsGroup>
    </div>
  );
};

NotificationsSection.displayName = 'NotificationsSection';

export { NotificationsSection };
