import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Language option card variants using class-variance-authority
 */
const languageCardVariants = cva(
  'flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer w-full text-left',
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
 * Props for the LanguageSection component
 */
export interface LanguageSectionProps {
  /** Additional CSS classes for the section container */
  className?: string;
}

/**
 * Language option type
 */
type LanguageOption = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko' | 'pt';

/**
 * Language option configuration
 */
interface LanguageConfig {
  id: LanguageOption;
  label: string;
  nativeLabel: string;
  region: string;
}

/**
 * Available language options
 */
const LANGUAGE_OPTIONS: LanguageConfig[] = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    region: 'United States',
  },
  {
    id: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    region: 'Spain',
  },
  {
    id: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    region: 'France',
  },
  {
    id: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    region: 'Germany',
  },
  {
    id: 'ja',
    label: 'Japanese',
    nativeLabel: '日本語',
    region: 'Japan',
  },
  {
    id: 'zh',
    label: 'Chinese',
    nativeLabel: '中文',
    region: 'China',
  },
  {
    id: 'ko',
    label: 'Korean',
    nativeLabel: '한국어',
    region: 'South Korea',
  },
  {
    id: 'pt',
    label: 'Portuguese',
    nativeLabel: 'Português',
    region: 'Brazil',
  },
];

/**
 * Date format option type
 */
type DateFormatOption = 'mdy' | 'dmy' | 'ymd';

/**
 * Date format option configuration
 */
interface DateFormatConfig {
  id: DateFormatOption;
  label: string;
  example: string;
}

/**
 * Available date format options
 */
const DATE_FORMAT_OPTIONS: DateFormatConfig[] = [
  {
    id: 'mdy',
    label: 'MM/DD/YYYY',
    example: '02/07/2026',
  },
  {
    id: 'dmy',
    label: 'DD/MM/YYYY',
    example: '07/02/2026',
  },
  {
    id: 'ymd',
    label: 'YYYY-MM-DD',
    example: '2026-02-07',
  },
];

/**
 * Time format option type
 */
type TimeFormatOption = '12h' | '24h';

/**
 * Time format option configuration
 */
interface TimeFormatConfig {
  id: TimeFormatOption;
  label: string;
  example: string;
}

/**
 * Available time format options
 */
const TIME_FORMAT_OPTIONS: TimeFormatConfig[] = [
  {
    id: '12h',
    label: '12-hour',
    example: '2:30 PM',
  },
  {
    id: '24h',
    label: '24-hour',
    example: '14:30',
  },
];

/**
 * Language option card component
 */
interface LanguageCardProps extends VariantProps<typeof languageCardVariants> {
  config: LanguageConfig;
  selected: boolean;
  onClick: () => void;
}

const LanguageCard: React.FC<LanguageCardProps> = ({ config, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(languageCardVariants({ selected }))}
    aria-pressed={selected}
    role="radio"
    aria-checked={selected}
  >
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
      {config.id.toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {config.label}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({config.nativeLabel})
        </span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {config.region}
      </span>
    </div>
    {selected && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 flex-shrink-0 text-blue-500"
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
          clipRule="evenodd"
        />
      </svg>
    )}
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
 * Format option button component
 */
interface FormatOptionProps {
  label: string;
  example: string;
  selected: boolean;
  onClick: () => void;
}

const FormatOption: React.FC<FormatOptionProps> = ({ label, example, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-1 rounded-lg border px-4 py-3 transition-all',
      selected
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
    )}
    aria-pressed={selected}
    role="radio"
    aria-checked={selected}
  >
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
      {label}
    </span>
    <span className="text-xs text-gray-500 dark:text-gray-400">
      {example}
    </span>
  </button>
);

/**
 * LanguageSection component
 *
 * Settings section for choosing the preferred language and locale settings
 * in the Matrix application. Provides language selection dropdown placeholder
 * and date/time format options.
 *
 * @example
 * <LanguageSection className="max-w-2xl" />
 */
const LanguageSection: React.FC<LanguageSectionProps> = ({ className }) => {
  // Placeholder state for language selection (not persisted)
  const [selectedLanguage, setSelectedLanguage] = React.useState<LanguageOption>('en');

  // Placeholder state for date format selection (not persisted)
  const [selectedDateFormat, setSelectedDateFormat] = React.useState<DateFormatOption>('mdy');

  // Placeholder state for time format selection (not persisted)
  const [selectedTimeFormat, setSelectedTimeFormat] = React.useState<TimeFormatOption>('12h');

  return (
    <div
      className={cn('space-y-6', className)}
      role="region"
      aria-label="Language Settings"
    >
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Language
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose your preferred language and regional format settings
        </p>
      </div>

      {/* Language Selection */}
      <SettingsGroup
        title="Display Language"
        description="Choose the language for the Matrix interface"
      >
        <div
          className="grid gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Language selection"
        >
          {LANGUAGE_OPTIONS.map((config) => (
            <LanguageCard
              key={config.id}
              config={config}
              selected={selectedLanguage === config.id}
              onClick={() => setSelectedLanguage(config.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Language settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Date Format Settings */}
      <SettingsGroup
        title="Date Format"
        description="Choose how dates are displayed throughout the application"
      >
        <div
          className="flex flex-wrap gap-3"
          role="radiogroup"
          aria-label="Date format selection"
        >
          {DATE_FORMAT_OPTIONS.map((config) => (
            <FormatOption
              key={config.id}
              label={config.label}
              example={config.example}
              selected={selectedDateFormat === config.id}
              onClick={() => setSelectedDateFormat(config.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Date format settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Time Format Settings */}
      <SettingsGroup
        title="Time Format"
        description="Choose between 12-hour and 24-hour time display"
      >
        <div
          className="flex flex-wrap gap-3"
          role="radiogroup"
          aria-label="Time format selection"
        >
          {TIME_FORMAT_OPTIONS.map((config) => (
            <FormatOption
              key={config.id}
              label={config.label}
              example={config.example}
              selected={selectedTimeFormat === config.id}
              onClick={() => setSelectedTimeFormat(config.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Time format settings will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Spell Check Placeholder */}
      <SettingsGroup
        title="Spell Check"
        description="Configure spell checking behavior"
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Spell Check
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Highlight spelling errors in text inputs
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors"
              role="switch"
              aria-checked="true"
              aria-label="Toggle spell check"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-Correct
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically fix common spelling mistakes
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle auto-correct"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Spell check settings are platform-dependent and coming soon.
        </p>
      </SettingsGroup>
    </div>
  );
};

LanguageSection.displayName = 'LanguageSection';

export { LanguageSection, languageCardVariants };
