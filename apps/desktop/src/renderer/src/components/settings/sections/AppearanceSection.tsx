import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';

/**
 * Theme option card variants using class-variance-authority
 */
const themeCardVariants = cva(
  'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all cursor-pointer',
  {
    variants: {
      selected: {
        true: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
        false:
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

/**
 * Props for the AppearanceSection component
 */
export interface AppearanceSectionProps {
  /** Additional CSS classes for the section container */
  className?: string;
}

/**
 * Theme option type
 */
type ThemeOption = 'light' | 'dark' | 'system';

/**
 * Theme option configuration
 */
interface ThemeConfig {
  id: ThemeOption;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Available theme options
 */
const THEME_OPTIONS: ThemeConfig[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Light background with dark text',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-yellow-500"
      >
        <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.591 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Dark background with light text',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-indigo-400"
      >
        <path
          fillRule="evenodd"
          d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'system',
    label: 'System',
    description: 'Follows your system preference',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-gray-500 dark:text-gray-400"
      >
        <path
          fillRule="evenodd"
          d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

/**
 * Theme option card component
 */
interface ThemeCardProps extends VariantProps<typeof themeCardVariants> {
  theme: ThemeConfig;
  selected: boolean;
  onClick: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(themeCardVariants({ selected }), 'min-w-[120px]')}
    aria-pressed={selected}
    role="radio"
    aria-checked={selected}
  >
    {theme.icon}
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{theme.label}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
      {theme.description}
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
 * AppearanceSection component
 *
 * Settings section for customizing the visual appearance of the Matrix application.
 * Provides theme selection (light/dark/system) and placeholder controls for
 * additional appearance customization options.
 *
 * @example
 * <AppearanceSection className="max-w-2xl" />
 */
const AppearanceSection: React.FC<AppearanceSectionProps> = ({ className }) => {
  // Placeholder state for theme selection (not persisted)
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeOption>('system');

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="Appearance Settings">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize how Matrix looks and feels
        </p>
      </div>

      {/* Theme Settings */}
      <SettingsGroup title="Theme" description="Choose how Matrix appears on your screen">
        <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Theme selection">
          {THEME_OPTIONS.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={selectedTheme === theme.id}
              onClick={() => setSelectedTheme(theme.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Theme settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Accent Color Placeholder */}
      <SettingsGroup
        title="Accent Color"
        description="Choose the primary accent color for the interface"
      >
        <div className="flex flex-wrap gap-2">
          {['blue', 'purple', 'green', 'orange', 'pink'].map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-all',
                color === 'blue'
                  ? 'border-blue-500 bg-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                  : 'border-transparent hover:scale-110',
                color === 'purple' && 'bg-purple-500',
                color === 'green' && 'bg-green-500',
                color === 'orange' && 'bg-orange-500',
                color === 'pink' && 'bg-pink-500'
              )}
              aria-label={`Select ${color} accent color`}
              disabled
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Accent color customization coming soon.
        </p>
      </SettingsGroup>

      {/* Window Effects Placeholder */}
      <SettingsGroup title="Window Effects" description="Visual effects for the application window">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Transparency
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enable window transparency effects
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle transparency"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Blur Effect
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Apply blur to window backgrounds
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle blur effect"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Window effects are platform-dependent and coming in a future release.
        </p>
      </SettingsGroup>
    </div>
  );
};

AppearanceSection.displayName = 'AppearanceSection';

export { AppearanceSection, themeCardVariants };
