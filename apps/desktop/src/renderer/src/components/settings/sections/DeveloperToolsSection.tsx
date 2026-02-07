import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * IDE option card variants using class-variance-authority
 */
const ideCardVariants = cva(
  'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all cursor-pointer',
  {
    variants: {
      selected: {
        true: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
        false: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

/**
 * Props for the DeveloperToolsSection component
 */
export interface DeveloperToolsSectionProps {
  /** Additional CSS classes for the section container */
  className?: string;
}

/**
 * IDE option type
 */
type IDEOption = 'vscode' | 'cursor' | 'webstorm' | 'neovim' | 'other';

/**
 * IDE option configuration
 */
interface IDEConfig {
  id: IDEOption;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Available IDE options
 */
const IDE_OPTIONS: IDEConfig[] = [
  {
    id: 'vscode',
    label: 'VS Code',
    description: 'Visual Studio Code',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-blue-500"
      >
        <path d="M17.583 6.924 12.97 11.54l-4.613-4.616-.943.942 4.614 4.614-4.614 4.613.943.943 4.613-4.613 4.613 4.613.943-.943-4.613-4.613 4.613-4.613-.943-.943Z" />
        <path
          fillRule="evenodd"
          d="M3.75 4.5a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75v-15Zm1.5.75v13.5h13.5V5.25H5.25Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'cursor',
    label: 'Cursor',
    description: 'AI-first code editor',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-purple-500"
      >
        <path
          fillRule="evenodd"
          d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.636 4.136a.75.75 0 0 1 1.06 0l1.592 1.591a.75.75 0 0 1-1.061 1.06L5.636 5.197a.75.75 0 0 1 0-1.06Zm12.728 0a.75.75 0 0 1 0 1.06l-1.591 1.592a.75.75 0 0 1-1.06-1.061l1.59-1.59a.75.75 0 0 1 1.061 0Zm-6.816 4.496a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.679Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'webstorm',
    label: 'WebStorm',
    description: 'JetBrains IDE',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-cyan-500"
      >
        <path
          fillRule="evenodd"
          d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm4.5 1.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Zm0 4.5a.75.75 0 0 0 0 1.5h5.25a.75.75 0 0 0 0-1.5H7.5Zm0 4.5a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5H7.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'neovim',
    label: 'Neovim',
    description: 'Hyperextensible Vim',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-green-500"
      >
        <path
          fillRule="evenodd"
          d="M2.25 6a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V6Zm3.97.97a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Zm4.28 4.28a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Custom editor',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-gray-500 dark:text-gray-400"
      >
        <path
          fillRule="evenodd"
          d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

/**
 * Terminal option type
 */
type TerminalOption = 'default' | 'iterm' | 'warp' | 'hyper' | 'alacritty';

/**
 * Terminal option configuration
 */
interface TerminalConfig {
  id: TerminalOption;
  label: string;
  description: string;
}

/**
 * Available terminal options
 */
const TERMINAL_OPTIONS: TerminalConfig[] = [
  {
    id: 'default',
    label: 'System Default',
    description: 'Use system terminal',
  },
  {
    id: 'iterm',
    label: 'iTerm2',
    description: 'macOS terminal',
  },
  {
    id: 'warp',
    label: 'Warp',
    description: 'AI-powered terminal',
  },
  {
    id: 'hyper',
    label: 'Hyper',
    description: 'Electron-based terminal',
  },
  {
    id: 'alacritty',
    label: 'Alacritty',
    description: 'GPU-accelerated',
  },
];

/**
 * IDE option card component
 */
interface IDECardProps extends VariantProps<typeof ideCardVariants> {
  config: IDEConfig;
  selected: boolean;
  onClick: () => void;
}

const IDECard: React.FC<IDECardProps> = ({ config, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(ideCardVariants({ selected }), 'min-w-[120px]')}
    aria-pressed={selected}
    role="radio"
    aria-checked={selected}
  >
    {config.icon}
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
      {config.label}
    </span>
    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
      {config.description}
    </span>
  </button>
);

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
 * DeveloperToolsSection component
 *
 * Settings section for configuring developer tools preferences in the Matrix application.
 * Provides IDE selection, terminal configuration, and other development environment
 * settings as placeholder controls.
 *
 * @example
 * <DeveloperToolsSection className="max-w-2xl" />
 */
const DeveloperToolsSection: React.FC<DeveloperToolsSectionProps> = ({ className }) => {
  // Placeholder state for IDE selection (not persisted)
  const [selectedIDE, setSelectedIDE] = React.useState<IDEOption>('vscode');

  // Placeholder state for terminal selection (not persisted)
  const [selectedTerminal, setSelectedTerminal] = React.useState<TerminalOption>('default');

  return (
    <div
      className={cn('space-y-6', className)}
      role="region"
      aria-label="Developer Tools Settings"
    >
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Developer Tools
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure your preferred IDE and terminal settings
        </p>
      </div>

      {/* Default IDE Settings */}
      <SettingsGroup
        title="Default IDE"
        description="Choose which editor to open files in by default"
      >
        <div
          className="flex flex-wrap gap-4"
          role="radiogroup"
          aria-label="IDE selection"
        >
          {IDE_OPTIONS.map((config) => (
            <IDECard
              key={config.id}
              config={config}
              selected={selectedIDE === config.id}
              onClick={() => setSelectedIDE(config.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          IDE preferences will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Terminal Settings */}
      <SettingsGroup
        title="Terminal Application"
        description="Choose your preferred terminal application"
      >
        <div className="space-y-2">
          {TERMINAL_OPTIONS.map((config) => (
            <label
              key={config.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                selectedTerminal === config.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
              )}
            >
              <input
                type="radio"
                name="terminal"
                value={config.id}
                checked={selectedTerminal === config.id}
                onChange={() => setSelectedTerminal(config.id)}
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
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Terminal preferences will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Editor Integration Placeholder */}
      <SettingsGroup
        title="Editor Integration"
        description="Configure how Matrix integrates with your editor"
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Open in New Window
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Always open files in a new editor window
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle open in new window"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reveal in Editor
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically reveal files in editor sidebar
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle reveal in editor"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Focus Editor Window
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bring editor to foreground when opening files
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle focus editor window"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Editor integration settings coming soon.
        </p>
      </SettingsGroup>

      {/* Custom Command Placeholder */}
      <SettingsGroup
        title="Custom Open Command"
        description="Specify a custom command to open files"
      >
        <div className="space-y-3">
          <div>
            <label
              htmlFor="custom-command"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Command Template
            </label>
            <input
              id="custom-command"
              type="text"
              placeholder="code --goto ${file}:${line}:${column}"
              disabled
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Available variables: <code className="text-gray-600 dark:text-gray-300">{'${file}'}</code>, <code className="text-gray-600 dark:text-gray-300">{'${line}'}</code>, <code className="text-gray-600 dark:text-gray-300">{'${column}'}</code>
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Custom command support will be available in a future update.
        </p>
      </SettingsGroup>
    </div>
  );
};

DeveloperToolsSection.displayName = 'DeveloperToolsSection';

export { DeveloperToolsSection, ideCardVariants };
