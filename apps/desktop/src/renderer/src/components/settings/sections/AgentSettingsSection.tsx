import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';

/**
 * Model option card variants using class-variance-authority
 */
const modelCardVariants = cva(
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
 * Props for the AgentSettingsSection component
 */
export interface AgentSettingsSectionProps {
  /** Additional CSS classes for the section container */
  className?: string;
}

/**
 * AI model provider option type
 */
type ModelProvider = 'anthropic' | 'openai' | 'google' | 'local' | 'custom';

/**
 * Model provider configuration
 */
interface ModelProviderConfig {
  id: ModelProvider;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Available model providers
 */
const MODEL_PROVIDERS: ModelProviderConfig[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Claude models',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-orange-500"
      >
        <path
          fillRule="evenodd"
          d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT models',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-green-500"
      >
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.902 7.098a3.75 3.75 0 0 1 3.903-.884.75.75 0 1 0 .498-1.415A5.25 5.25 0 0 0 8.005 9.75H7.5a.75.75 0 0 0 0 1.5h.054a5.281 5.281 0 0 0 0 1.5H7.5a.75.75 0 0 0 0 1.5h.505a5.25 5.25 0 0 0 6.494 2.701.75.75 0 0 0-.498-1.415 3.75 3.75 0 0 1-4.252-1.286h3.001a.75.75 0 0 0 0-1.5H9.075a3.77 3.77 0 0 1 0-1.5h3.675a.75.75 0 0 0 0-1.5h-3a3.75 3.75 0 0 1 1.348-1.252Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'google',
    label: 'Google',
    description: 'Gemini models',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-blue-500"
      >
        <path
          fillRule="evenodd"
          d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 7.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 6h-9Zm5.03 6.53a.75.75 0 0 0-1.06-1.06l-3 3a.75.75 0 1 0 1.06 1.06l3-3Zm2.22-2.22a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'local',
    label: 'Local',
    description: 'Ollama / LM Studio',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-purple-500"
      >
        <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'OpenAI-compatible',
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
 * Framework option type
 */
type FrameworkOption = 'react' | 'vue' | 'angular' | 'svelte' | 'nextjs' | 'auto';

/**
 * Framework option configuration
 */
interface FrameworkConfig {
  id: FrameworkOption;
  label: string;
  description: string;
}

/**
 * Available framework options
 */
const FRAMEWORK_OPTIONS: FrameworkConfig[] = [
  {
    id: 'auto',
    label: 'Auto-detect',
    description: 'Detect from project',
  },
  {
    id: 'react',
    label: 'React',
    description: 'React with TypeScript',
  },
  {
    id: 'vue',
    label: 'Vue.js',
    description: 'Vue 3 Composition API',
  },
  {
    id: 'angular',
    label: 'Angular',
    description: 'Angular framework',
  },
  {
    id: 'svelte',
    label: 'Svelte',
    description: 'Svelte/SvelteKit',
  },
  {
    id: 'nextjs',
    label: 'Next.js',
    description: 'React + Next.js',
  },
];

/**
 * Model provider card component
 */
interface ModelProviderCardProps extends VariantProps<typeof modelCardVariants> {
  config: ModelProviderConfig;
  selected: boolean;
  onClick: () => void;
}

const ModelProviderCard: React.FC<ModelProviderCardProps> = ({ config, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(modelCardVariants({ selected }), 'min-w-[120px]')}
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
 * AgentSettingsSection component
 *
 * Settings section for configuring AI agent preferences in the Matrix application.
 * Provides model provider selection, framework preferences, and other agent-related
 * settings as placeholder controls.
 *
 * @example
 * <AgentSettingsSection className="max-w-2xl" />
 */
const AgentSettingsSection: React.FC<AgentSettingsSectionProps> = ({ className }) => {
  // Placeholder state for model provider selection (not persisted)
  const [selectedProvider, setSelectedProvider] = React.useState<ModelProvider>('anthropic');

  // Placeholder state for framework selection (not persisted)
  const [selectedFramework, setSelectedFramework] = React.useState<FrameworkOption>('auto');

  return (
    <div
      className={cn('space-y-6', className)}
      role="region"
      aria-label="Agent Settings"
    >
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Agent Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure AI model and framework preferences for the agent
        </p>
      </div>

      {/* Model Provider Settings */}
      <SettingsGroup
        title="Default Model Provider"
        description="Choose your preferred AI model provider"
      >
        <div
          className="flex flex-wrap gap-4"
          role="radiogroup"
          aria-label="Model provider selection"
        >
          {MODEL_PROVIDERS.map((config) => (
            <ModelProviderCard
              key={config.id}
              config={config}
              selected={selectedProvider === config.id}
              onClick={() => setSelectedProvider(config.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Model provider preferences will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Framework Preference Settings */}
      <SettingsGroup
        title="Default Framework"
        description="Set the default framework for code generation"
      >
        <div className="space-y-2">
          {FRAMEWORK_OPTIONS.map((config) => (
            <label
              key={config.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                selectedFramework === config.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
              )}
            >
              <input
                type="radio"
                name="framework"
                value={config.id}
                checked={selectedFramework === config.id}
                onChange={() => setSelectedFramework(config.id)}
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
          Framework preferences will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Agent Behavior Settings */}
      <SettingsGroup
        title="Agent Behavior"
        description="Configure how the AI agent operates"
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-suggest Completions
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically suggest code completions as you type
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle auto-suggest completions"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Stream Responses
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Show responses as they are generated
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle stream responses"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include Context
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically include project context in prompts
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-blue-600 transition-colors dark:bg-blue-500"
              role="switch"
              aria-checked="true"
              aria-label="Toggle include context"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Safe Mode
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Require confirmation before executing commands
              </p>
            </div>
            <button
              type="button"
              disabled
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200 transition-colors dark:bg-gray-700"
              role="switch"
              aria-checked="false"
              aria-label="Toggle safe mode"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Agent behavior settings coming soon.
        </p>
      </SettingsGroup>

      {/* API Configuration Placeholder */}
      <SettingsGroup
        title="API Configuration"
        description="Configure API endpoints and keys"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="api-key"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              placeholder="sk-..."
              disabled
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your API key is stored securely and never shared
            </p>
          </div>

          <div>
            <label
              htmlFor="api-endpoint"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Custom Endpoint (Optional)
            </label>
            <input
              id="api-endpoint"
              type="text"
              placeholder="https://api.example.com/v1"
              disabled
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Override the default API endpoint for self-hosted models
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          API configuration will be available in a future update.
        </p>
      </SettingsGroup>

      {/* Model Parameters Placeholder */}
      <SettingsGroup
        title="Model Parameters"
        description="Fine-tune model behavior parameters"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="temperature"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Temperature
            </label>
            <div className="flex items-center gap-3">
              <input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                defaultValue="0.7"
                disabled
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed dark:bg-gray-700"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                0.7
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Controls randomness: 0 is deterministic, 2 is very creative
            </p>
          </div>

          <div>
            <label
              htmlFor="max-tokens"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Max Tokens
            </label>
            <input
              id="max-tokens"
              type="number"
              placeholder="4096"
              disabled
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Maximum number of tokens in the response
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Model parameters will be available in a future update.
        </p>
      </SettingsGroup>
    </div>
  );
};

AgentSettingsSection.displayName = 'AgentSettingsSection';

export { AgentSettingsSection, modelCardVariants };
