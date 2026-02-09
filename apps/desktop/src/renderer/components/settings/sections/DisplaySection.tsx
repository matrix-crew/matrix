import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Size option card variants using class-variance-authority
 */
const sizeCardVariants = cva(
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
 * Props for the DisplaySection component
 */
export interface DisplaySectionProps {
  /** Additional CSS classes for the section container */
  className?: string;
}

/**
 * Font size option type
 */
type FontSizeOption = 'small' | 'medium' | 'large' | 'extra-large';

/**
 * Font size option configuration
 */
interface FontSizeConfig {
  id: FontSizeOption;
  label: string;
  description: string;
  previewSize: string;
}

/**
 * Available font size options
 */
const FONT_SIZE_OPTIONS: FontSizeConfig[] = [
  {
    id: 'small',
    label: 'Small',
    description: '12px base',
    previewSize: 'text-xs',
  },
  {
    id: 'medium',
    label: 'Medium',
    description: '14px base',
    previewSize: 'text-sm',
  },
  {
    id: 'large',
    label: 'Large',
    description: '16px base',
    previewSize: 'text-base',
  },
  {
    id: 'extra-large',
    label: 'Extra Large',
    description: '18px base',
    previewSize: 'text-lg',
  },
];

/**
 * Zoom level option type
 */
type ZoomLevelOption = '75' | '100' | '125' | '150';

/**
 * Zoom level option configuration
 */
interface ZoomLevelConfig {
  id: ZoomLevelOption;
  label: string;
  description: string;
}

/**
 * Available zoom level options
 */
const ZOOM_LEVEL_OPTIONS: ZoomLevelConfig[] = [
  {
    id: '75',
    label: '75%',
    description: 'Compact',
  },
  {
    id: '100',
    label: '100%',
    description: 'Default',
  },
  {
    id: '125',
    label: '125%',
    description: 'Large',
  },
  {
    id: '150',
    label: '150%',
    description: 'Extra Large',
  },
];

/**
 * Font size option card component
 */
interface FontSizeCardProps extends VariantProps<typeof sizeCardVariants> {
  config: FontSizeConfig;
  selected: boolean;
  onClick: () => void;
}

const FontSizeCard: React.FC<FontSizeCardProps> = ({ config, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(sizeCardVariants({ selected }), 'min-w-[100px]')}
    aria-pressed={selected}
    role="radio"
    aria-checked={selected}
  >
    <span className={cn('font-medium text-gray-900 dark:text-gray-100', config.previewSize)}>
      Aa
    </span>
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
      {config.description}
    </span>
  </button>
);

/**
 * Zoom level option card component
 */
interface ZoomLevelCardProps extends VariantProps<typeof sizeCardVariants> {
  config: ZoomLevelConfig;
  selected: boolean;
  onClick: () => void;
}

const ZoomLevelCard: React.FC<ZoomLevelCardProps> = ({ config, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(sizeCardVariants({ selected }), 'min-w-[80px]')}
    aria-pressed={selected}
    role="radio"
    aria-checked={selected}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6 text-gray-500 dark:text-gray-400"
    >
      <path
        fillRule="evenodd"
        d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Zm8.25-3.75a.75.75 0 0 1 .75.75v2.25h2.25a.75.75 0 0 1 0 1.5h-2.25v2.25a.75.75 0 0 1-1.5 0v-2.25H7.5a.75.75 0 0 1 0-1.5h2.25V7.5a.75.75 0 0 1 .75-.75Z"
        clipRule="evenodd"
      />
    </svg>
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
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
 * DisplaySection component
 *
 * Settings section for adjusting the size of UI elements in the Matrix application.
 * Provides font size selection, zoom level controls, and other display customization
 * options as placeholder controls.
 *
 * @example
 * <DisplaySection className="max-w-2xl" />
 */
const DisplaySection: React.FC<DisplaySectionProps> = ({ className }) => {
  // Placeholder state for font size selection (not persisted)
  const [selectedFontSize, setSelectedFontSize] = React.useState<FontSizeOption>('medium');

  // Placeholder state for zoom level selection (not persisted)
  const [selectedZoomLevel, setSelectedZoomLevel] = React.useState<ZoomLevelOption>('100');

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="Display Settings">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Display</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Adjust the size of UI elements
        </p>
      </div>

      {/* Font Size Settings */}
      <SettingsGroup title="Font Size" description="Choose the base font size for the interface">
        <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Font size selection">
          {FONT_SIZE_OPTIONS.map((config) => (
            <FontSizeCard
              key={config.id}
              config={config}
              selected={selectedFontSize === config.id}
              onClick={() => setSelectedFontSize(config.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Font size settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Zoom Level Settings */}
      <SettingsGroup title="Zoom Level" description="Scale the entire interface up or down">
        <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Zoom level selection">
          {ZOOM_LEVEL_OPTIONS.map((config) => (
            <ZoomLevelCard
              key={config.id}
              config={config}
              selected={selectedZoomLevel === config.id}
              onClick={() => setSelectedZoomLevel(config.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Zoom level settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Sidebar Width Placeholder */}
      <SettingsGroup title="Sidebar Width" description="Adjust the default width of sidebars">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Narrow</span>
            <input
              type="range"
              min="200"
              max="400"
              defaultValue="280"
              disabled
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed dark:bg-gray-700"
              aria-label="Sidebar width slider"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-20 text-right">Wide</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Current: 280px (default)</p>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Sidebar width customization coming soon.
        </p>
      </SettingsGroup>

      {/* Compact Mode Placeholder */}
      <SettingsGroup title="Density" description="Control the spacing and density of UI elements">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Compact Mode
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reduce padding and margins for more content on screen
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle compact mode"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hide Descriptions
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Show only essential labels and hide helper text
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle hide descriptions"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Density settings will be available in a future release.
        </p>
      </SettingsGroup>
    </div>
  );
};

DisplaySection.displayName = 'DisplaySection';

export { DisplaySection, sizeCardVariants };
