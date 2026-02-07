import * as React from 'react';
import { cn } from '@maxtix/ui';

/**
 * Props for the DebugLogsSection component
 */
export interface DebugLogsSectionProps {
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
 * Toggle switch component for debug settings
 */
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, label, disabled = false }) => (
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
 * Debug setting item component
 */
interface DebugItemProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const DebugItem: React.FC<DebugItemProps> = ({
  title,
  description,
  enabled,
  onChange,
  disabled = false,
}) => (
  <label className="flex items-center justify-between">
    <div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </span>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
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
 * Log level option type
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Log level option configuration
 */
interface LogLevelConfig {
  id: LogLevel;
  label: string;
  description: string;
}

/**
 * Available log level options
 */
const LOG_LEVEL_OPTIONS: LogLevelConfig[] = [
  {
    id: 'error',
    label: 'Error',
    description: 'Only show critical errors',
  },
  {
    id: 'warn',
    label: 'Warning',
    description: 'Show warnings and errors',
  },
  {
    id: 'info',
    label: 'Info',
    description: 'Show general information',
  },
  {
    id: 'debug',
    label: 'Debug',
    description: 'Show detailed debug info',
  },
  {
    id: 'trace',
    label: 'Trace',
    description: 'Show all messages',
  },
];

/**
 * DebugLogsSection component
 *
 * Settings section for configuring debug mode and log level settings in the
 * Matrix application. Provides toggles for debug mode, verbose logging,
 * and other troubleshooting tools as placeholder controls.
 *
 * @example
 * <DebugLogsSection className="max-w-2xl" />
 */
const DebugLogsSection: React.FC<DebugLogsSectionProps> = ({ className }) => {
  // Placeholder state for debug mode (not persisted)
  const [debugMode, setDebugMode] = React.useState(false);
  const [verboseLogging, setVerboseLogging] = React.useState(false);
  const [logToFile, setLogToFile] = React.useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = React.useState(false);
  const [devTools, setDevTools] = React.useState(false);
  const [ipcLogging, setIpcLogging] = React.useState(false);

  // Placeholder state for log level selection (not persisted)
  const [selectedLogLevel, setSelectedLogLevel] = React.useState<LogLevel>('info');

  return (
    <div
      className={cn('space-y-6', className)}
      role="region"
      aria-label="Debug and Logs Settings"
    >
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Debug & Logs
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Troubleshooting tools and logging configuration
        </p>
      </div>

      {/* Debug Mode Settings */}
      <SettingsGroup
        title="Debug Mode"
        description="Enable additional debugging features for troubleshooting"
      >
        <div className="space-y-4">
          <DebugItem
            title="Enable Debug Mode"
            description="Activate developer debugging features"
            enabled={debugMode}
            onChange={setDebugMode}
          />

          <DebugItem
            title="Open DevTools on Start"
            description="Automatically open Chrome DevTools when the app starts"
            enabled={devTools}
            onChange={setDevTools}
          />

          <DebugItem
            title="Show Performance Metrics"
            description="Display FPS counter and memory usage"
            enabled={showPerformanceMetrics}
            onChange={setShowPerformanceMetrics}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Debug mode settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Log Level Settings */}
      <SettingsGroup
        title="Log Level"
        description="Control the verbosity of application logs"
      >
        <div className="space-y-2">
          {LOG_LEVEL_OPTIONS.map((config) => (
            <label
              key={config.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                selectedLogLevel === config.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
              )}
            >
              <input
                type="radio"
                name="logLevel"
                value={config.id}
                checked={selectedLogLevel === config.id}
                onChange={() => setSelectedLogLevel(config.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {config.label}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {config.description}
                </p>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Log level configuration will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Log Output Settings */}
      <SettingsGroup
        title="Log Output"
        description="Configure where logs are written"
      >
        <div className="space-y-4">
          <DebugItem
            title="Verbose Logging"
            description="Include additional context in log messages"
            enabled={verboseLogging}
            onChange={setVerboseLogging}
          />

          <DebugItem
            title="Log to File"
            description="Write logs to a file for later review"
            enabled={logToFile}
            onChange={setLogToFile}
          />

          <DebugItem
            title="IPC Message Logging"
            description="Log all IPC messages between processes"
            enabled={ipcLogging}
            onChange={setIpcLogging}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Log output settings coming in a future release.
        </p>
      </SettingsGroup>

      {/* Log File Location */}
      <SettingsGroup
        title="Log File Location"
        description="Configure where log files are stored"
      >
        <div className="space-y-3">
          <div>
            <label
              htmlFor="log-path"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Log Directory
            </label>
            <div className="flex gap-2">
              <input
                id="log-path"
                type="text"
                placeholder="~/Library/Logs/Matrix"
                disabled
                className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                Browse
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Log File Size
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rotate logs when they exceed this size
              </p>
            </div>
            <select
              disabled
              className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
              aria-label="Maximum log file size"
            >
              <option>10 MB</option>
              <option>25 MB</option>
              <option>50 MB</option>
              <option>100 MB</option>
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Log file configuration coming in a future release.
        </p>
      </SettingsGroup>

      {/* Diagnostic Actions */}
      <SettingsGroup
        title="Diagnostic Actions"
        description="Tools for troubleshooting issues"
      >
        <div className="space-y-3">
          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0v2.43l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                  clipRule="evenodd"
                />
              </svg>
              Restart Application
            </span>
          </button>

          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
              Export Logs
            </span>
          </button>

          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
              Clear Log Files
            </span>
          </button>

          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                  clipRule="evenodd"
                />
              </svg>
              Generate Diagnostic Report
            </span>
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Diagnostic actions will be available in a future update.
        </p>
      </SettingsGroup>
    </div>
  );
};

DebugLogsSection.displayName = 'DebugLogsSection';

export { DebugLogsSection };
