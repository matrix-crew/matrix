import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the PathsSection component
 */
export interface PathsSectionProps {
  /** Additional CSS classes for the section container */
  className?: string;
}

/**
 * CLI tool path configuration
 */
interface PathConfig {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  defaultValue: string;
  icon: React.ReactNode;
}

/**
 * Available CLI tool paths
 */
const CLI_PATHS: PathConfig[] = [
  {
    id: 'python',
    label: 'Python',
    description: 'Path to Python interpreter',
    placeholder: '/usr/bin/python3',
    defaultValue: '',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-yellow-500"
      >
        <path
          fillRule="evenodd"
          d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'node',
    label: 'Node.js',
    description: 'Path to Node.js runtime',
    placeholder: '/usr/local/bin/node',
    defaultValue: '',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-green-500"
      >
        <path
          fillRule="evenodd"
          d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'uv',
    label: 'uv',
    description: 'Path to uv package manager',
    placeholder: '/usr/local/bin/uv',
    defaultValue: '',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-purple-500"
      >
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'npm',
    label: 'npm',
    description: 'Path to npm package manager',
    placeholder: '/usr/local/bin/npm',
    defaultValue: '',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-red-500"
      >
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.53 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v5.69a.75.75 0 0 0 1.5 0v-5.69l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'pnpm',
    label: 'pnpm',
    description: 'Path to pnpm package manager',
    placeholder: '/usr/local/bin/pnpm',
    defaultValue: '',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-orange-500"
      >
        <path
          fillRule="evenodd"
          d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm4.5 1.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Zm0 4.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Zm0 4.5a.75.75 0 0 0 0 1.5h5.25a.75.75 0 0 0 0-1.5H7.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'git',
    label: 'Git',
    description: 'Path to Git version control',
    placeholder: '/usr/bin/git',
    defaultValue: '',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 text-orange-600"
      >
        <path
          fillRule="evenodd"
          d="M6.72 5.66 11.28 10.22l-1.06 1.06-4.56-4.56 1.06-1.06Zm11.62 11.62-4.56-4.56 1.06-1.06 4.56 4.56-1.06 1.06Zm-5.03-5.03a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0Zm-3.56 3.56a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0ZM3.75 12a8.25 8.25 0 1 1 16.5 0 8.25 8.25 0 0 1-16.5 0ZM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

/**
 * Framework path configuration
 */
interface FrameworkPathConfig {
  id: string;
  label: string;
  description: string;
  placeholder: string;
}

/**
 * Available framework paths
 */
const FRAMEWORK_PATHS: FrameworkPathConfig[] = [
  {
    id: 'venv',
    label: 'Virtual Environment',
    description: 'Default path for Python virtual environments',
    placeholder: '~/.venv',
  },
  {
    id: 'node-modules',
    label: 'Global Node Modules',
    description: 'Path to global Node.js modules',
    placeholder: '/usr/local/lib/node_modules',
  },
  {
    id: 'cargo',
    label: 'Cargo Home',
    description: 'Path to Rust Cargo home directory',
    placeholder: '~/.cargo',
  },
];

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
 * Path input component with browse button
 */
interface PathInputProps {
  config: PathConfig | FrameworkPathConfig;
  icon?: React.ReactNode;
}

const PathInput: React.FC<PathInputProps> = ({ config, icon }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-850">
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`path-${config.id}`}
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {config.label}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{config.description}</p>
        <div className="flex gap-2">
          <input
            id={`path-${config.id}`}
            type="text"
            placeholder={config.placeholder}
            disabled
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 placeholder-gray-400 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-500"
          />
          <button
            type="button"
            disabled
            className="flex-shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
            aria-label={`Browse for ${config.label} path`}
          >
            Browse
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * PathsSection component
 *
 * Settings section for configuring CLI tools and framework paths in the Matrix application.
 * Provides path input fields for various development tools like Python, Node.js, uv, npm,
 * pnpm, and Git, as well as framework-specific directory paths.
 *
 * @example
 * <PathsSection className="max-w-2xl" />
 */
const PathsSection: React.FC<PathsSectionProps> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="Paths Settings">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Paths</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure paths to CLI tools and framework directories
        </p>
      </div>

      {/* CLI Tools Paths */}
      <SettingsGroup title="CLI Tools" description="Specify custom paths for command-line tools">
        <div className="space-y-3">
          {CLI_PATHS.map((config) => (
            <PathInput key={config.id} config={config} icon={config.icon} />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Leave empty to use the system default path. Custom paths will be available in a future
          update.
        </p>
      </SettingsGroup>

      {/* Framework Directories */}
      <SettingsGroup
        title="Framework Directories"
        description="Configure default directories for frameworks and packages"
      >
        <div className="space-y-3">
          {FRAMEWORK_PATHS.map((config) => (
            <PathInput key={config.id} config={config} />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Framework directory settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Auto-Detection Settings */}
      <SettingsGroup
        title="Path Detection"
        description="Configure automatic path detection behavior"
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-detect Paths
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically detect tool paths from system PATH
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle auto-detect paths"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verify Paths on Startup
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Check that configured paths are valid when the app starts
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle verify paths on startup"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use Project-local Tools
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Prefer project-local tool installations (e.g., node_modules/.bin)
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle use project-local tools"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Path detection settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Environment Variables */}
      <SettingsGroup
        title="Environment Variables"
        description="Additional PATH and environment configuration"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="additional-path"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Additional PATH Entries
            </label>
            <textarea
              id="additional-path"
              placeholder="/custom/bin&#10;/another/path"
              disabled
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 cursor-not-allowed resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter one path per line. These will be prepended to the system PATH.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Environment variable configuration will be available in a future update.
        </p>
      </SettingsGroup>
    </div>
  );
};

PathsSection.displayName = 'PathsSection';

export { PathsSection };
