import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type {
  SourceType,
  LocalSourceCreateData,
  RemoteSourceCreateData,
} from '@shared/types/matrix';

/**
 * Form button variants using class-variance-authority
 */
const wizardButtonVariants = cva(
  'rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary:
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      disabled: false,
    },
  }
);

/**
 * Form input variants
 */
const wizardInputVariants = cva(
  'w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2',
  {
    variants: {
      error: {
        true: 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600',
        false: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600',
      },
    },
    defaultVariants: {
      error: false,
    },
  }
);

type WizardStep = 'select-type' | 'fill-details';

interface WizardState {
  step: WizardStep;
  sourceType: SourceType | null;
  name: string;
  path: string;
  url: string;
  isSubmitting: boolean;
  error: string | null;
  errors: Partial<Record<'name' | 'path' | 'url', string>>;
}

export interface SourceFormWizardProps {
  onSubmit: (data: LocalSourceCreateData | RemoteSourceCreateData) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

/**
 * Extract directory name from path.
 */
function extractNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

/**
 * Extract repo name from git URL.
 */
function extractNameFromUrl(url: string): string {
  const match = url.match(/[/:]([^/:]+?)(?:\.git)?(?:\/)?$/);
  return match?.[1] || '';
}

/**
 * SourceFormWizard component
 *
 * A two-step wizard for adding sources to a matrix:
 * 1. Select source type (Local Directory or Remote Git Repository)
 * 2. Fill in type-specific details with auto-fill support
 */
const SourceFormWizard: React.FC<SourceFormWizardProps> = ({ onSubmit, onCancel, className }) => {
  const [state, setState] = React.useState<WizardState>({
    step: 'select-type',
    sourceType: null,
    name: '',
    path: '',
    url: '',
    isSubmitting: false,
    error: null,
    errors: {},
  });

  // Track if user has manually edited the name
  const nameManuallyEdited = React.useRef(false);

  const handleTypeSelect = React.useCallback((type: SourceType) => {
    setState((prev) => ({
      ...prev,
      sourceType: type,
      step: 'fill-details',
      name: '',
      path: '',
      url: '',
      error: null,
      errors: {},
    }));
    nameManuallyEdited.current = false;
  }, []);

  const handleBack = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'select-type',
      sourceType: null,
      error: null,
      errors: {},
    }));
    nameManuallyEdited.current = false;
  }, []);

  const handleNameChange = React.useCallback((value: string) => {
    nameManuallyEdited.current = true;
    setState((prev) => ({
      ...prev,
      name: value,
      errors: { ...prev.errors, name: undefined },
      error: null,
    }));
  }, []);

  const handlePathChange = React.useCallback((value: string) => {
    setState((prev) => {
      const autoName =
        !nameManuallyEdited.current && value ? extractNameFromPath(value) : prev.name;
      return {
        ...prev,
        path: value,
        name: autoName,
        errors: { ...prev.errors, path: undefined },
        error: null,
      };
    });
  }, []);

  const handleUrlChange = React.useCallback((value: string) => {
    setState((prev) => {
      const autoName = !nameManuallyEdited.current && value ? extractNameFromUrl(value) : prev.name;
      return {
        ...prev,
        url: value,
        name: autoName,
        errors: { ...prev.errors, url: undefined },
        error: null,
      };
    });
  }, []);

  const handleSelectDirectory = React.useCallback(async () => {
    try {
      const path = await window.api.selectDirectory();
      if (!path) return;

      setState((prev) => {
        const autoName = !nameManuallyEdited.current ? extractNameFromPath(path) : prev.name;
        return {
          ...prev,
          path,
          name: autoName,
          errors: { ...prev.errors, path: undefined },
          error: null,
        };
      });
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Failed to open directory picker',
      }));
    }
  }, []);

  const validate = React.useCallback((): boolean => {
    const errors: WizardState['errors'] = {};

    if (!state.name.trim()) {
      errors.name = 'Name is required';
    } else if (state.name.trim().length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    if (state.sourceType === 'local') {
      if (!state.path.trim()) {
        errors.path = 'Directory path is required';
      }
    } else {
      if (!state.url.trim()) {
        errors.url = 'Git URL is required';
      } else if (!state.url.trim().match(/^(https?:\/\/|git@|ssh:\/\/)/)) {
        errors.url = 'URL should start with http://, https://, git@, or ssh://';
      }
    }

    if (Object.keys(errors).length > 0) {
      setState((prev) => ({ ...prev, errors }));
      return false;
    }
    return true;
  }, [state.name, state.path, state.url, state.sourceType]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        if (state.sourceType === 'local') {
          await onSubmit({
            name: state.name.trim(),
            path: state.path.trim(),
            source_type: 'local',
            url: state.url.trim() || undefined,
          });
        } else {
          await onSubmit({
            name: state.name.trim(),
            url: state.url.trim(),
            source_type: 'remote',
          });
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        }));
      }
    },
    [state.sourceType, state.name, state.path, state.url, validate, onSubmit]
  );

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {state.step === 'select-type' && (
        <TypeSelectionStep onSelect={handleTypeSelect} onCancel={onCancel} />
      )}

      {state.step === 'fill-details' && state.sourceType === 'local' && (
        <form onSubmit={handleSubmit} role="form" aria-label="Add Local Source">
          <LocalDetailsStep
            name={state.name}
            path={state.path}
            url={state.url}
            errors={state.errors}
            isSubmitting={state.isSubmitting}
            error={state.error}
            onNameChange={handleNameChange}
            onPathChange={handlePathChange}
            onUrlChange={(value) =>
              setState((prev) => ({
                ...prev,
                url: value,
                errors: { ...prev.errors, url: undefined },
              }))
            }
            onSelectDirectory={handleSelectDirectory}
            onBack={handleBack}
            onCancel={onCancel}
          />
        </form>
      )}

      {state.step === 'fill-details' && state.sourceType === 'remote' && (
        <form onSubmit={handleSubmit} role="form" aria-label="Clone Remote Repository">
          <RemoteDetailsStep
            name={state.name}
            url={state.url}
            errors={state.errors}
            isSubmitting={state.isSubmitting}
            error={state.error}
            onNameChange={handleNameChange}
            onUrlChange={handleUrlChange}
            onBack={handleBack}
            onCancel={onCancel}
          />
        </form>
      )}
    </div>
  );
};

// ============================================================================
// Step 1: Type Selection
// ============================================================================

interface TypeSelectionStepProps {
  onSelect: (type: SourceType) => void;
  onCancel: () => void;
}

const TypeSelectionStep: React.FC<TypeSelectionStepProps> = ({ onSelect, onCancel }) => (
  <>
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Source</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Choose the type of source to add to this matrix.
      </p>
    </div>

    <div className="mb-6 space-y-3">
      <button
        type="button"
        onClick={() => onSelect('local')}
        className="flex w-full items-start gap-4 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
      >
        <div className="mt-0.5 flex-shrink-0 text-blue-500">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Local Directory</h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Add an existing directory from your filesystem
          </p>
        </div>
        <div className="mt-0.5 flex-shrink-0 text-gray-400">&rarr;</div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('remote')}
        className="flex w-full items-start gap-4 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
      >
        <div className="mt-0.5 flex-shrink-0 text-blue-500">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Remote Git Repository</h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Clone a repository from a remote URL
          </p>
        </div>
        <div className="mt-0.5 flex-shrink-0 text-gray-400">&rarr;</div>
      </button>
    </div>

    <div className="flex justify-end">
      <button
        type="button"
        onClick={onCancel}
        className={cn(wizardButtonVariants({ variant: 'secondary' }))}
      >
        Cancel
      </button>
    </div>
  </>
);

// ============================================================================
// Step 2: Local Source Details
// ============================================================================

interface LocalDetailsStepProps {
  name: string;
  path: string;
  url: string;
  errors: WizardState['errors'];
  isSubmitting: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onPathChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onSelectDirectory: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const LocalDetailsStep: React.FC<LocalDetailsStepProps> = ({
  name,
  path,
  url,
  errors,
  isSubmitting,
  error,
  onNameChange,
  onPathChange,
  onUrlChange,
  onSelectDirectory,
  onBack,
  onCancel,
}) => (
  <>
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Add Local Directory
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Select a directory from your filesystem to add as a source.
      </p>
    </div>

    {error && <ErrorBanner message={error} />}

    {/* Path field with Browse button */}
    <div className="mb-4">
      <label
        htmlFor="local-path"
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Directory Path
        <span className="ml-1 text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <input
          id="local-path"
          type="text"
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          placeholder="Click Browse or enter path..."
          disabled={isSubmitting}
          className={cn(
            wizardInputVariants({ error: !!errors.path }),
            'flex-1 bg-white font-mono text-xs text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
            isSubmitting && 'cursor-not-allowed opacity-50'
          )}
          aria-required="true"
          aria-invalid={!!errors.path}
          aria-describedby={errors.path ? 'local-path-error' : undefined}
        />
        <button
          type="button"
          onClick={onSelectDirectory}
          disabled={isSubmitting}
          className={cn(
            wizardButtonVariants({ variant: 'secondary', disabled: isSubmitting }),
            'whitespace-nowrap'
          )}
        >
          Browse...
        </button>
      </div>
      {errors.path && (
        <p
          id="local-path-error"
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {errors.path}
        </p>
      )}
    </div>

    {/* Name field */}
    <div className="mb-4">
      <label
        htmlFor="local-name"
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Name
        <span className="ml-1 text-red-500">*</span>
      </label>
      <input
        id="local-name"
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Auto-filled from directory name"
        disabled={isSubmitting}
        className={cn(
          wizardInputVariants({ error: !!errors.name }),
          'bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
          isSubmitting && 'cursor-not-allowed opacity-50'
        )}
        aria-required="true"
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? 'local-name-error' : undefined}
      />
      {errors.name && (
        <p
          id="local-name-error"
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {errors.name}
        </p>
      )}
    </div>

    {/* Optional URL field */}
    <div className="mb-6">
      <label
        htmlFor="local-url"
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Git Remote URL
        <span className="ml-1 text-gray-400">(optional)</span>
      </label>
      <input
        id="local-url"
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://github.com/user/repo"
        disabled={isSubmitting}
        className={cn(
          wizardInputVariants({ error: !!errors.url }),
          'bg-white font-mono text-xs text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
          isSubmitting && 'cursor-not-allowed opacity-50'
        )}
        aria-describedby={errors.url ? 'local-url-error' : undefined}
      />
      {errors.url && (
        <p
          id="local-url-error"
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {errors.url}
        </p>
      )}
    </div>

    <WizardActions
      submitLabel="Add Source"
      isSubmitting={isSubmitting}
      onBack={onBack}
      onCancel={onCancel}
    />
  </>
);

// ============================================================================
// Step 2: Remote Source Details
// ============================================================================

interface RemoteDetailsStepProps {
  name: string;
  url: string;
  errors: WizardState['errors'];
  isSubmitting: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onBack: () => void;
  onCancel: () => void;
}

const RemoteDetailsStep: React.FC<RemoteDetailsStepProps> = ({
  name,
  url,
  errors,
  isSubmitting,
  error,
  onNameChange,
  onUrlChange,
  onBack,
  onCancel,
}) => (
  <>
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Clone Git Repository
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Clone a repository from a remote URL. This may take a few minutes for large repos.
      </p>
    </div>

    {error && <ErrorBanner message={error} />}

    {/* URL field */}
    <div className="mb-4">
      <label
        htmlFor="remote-url"
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Git URL
        <span className="ml-1 text-red-500">*</span>
      </label>
      <input
        id="remote-url"
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://github.com/user/repo.git"
        disabled={isSubmitting}
        className={cn(
          wizardInputVariants({ error: !!errors.url }),
          'bg-white font-mono text-xs text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
          isSubmitting && 'cursor-not-allowed opacity-50'
        )}
        aria-required="true"
        aria-invalid={!!errors.url}
        aria-describedby={errors.url ? 'remote-url-error' : undefined}
        autoFocus
      />
      {errors.url && (
        <p
          id="remote-url-error"
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {errors.url}
        </p>
      )}
    </div>

    {/* Name field */}
    <div className="mb-6">
      <label
        htmlFor="remote-name"
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Name
        <span className="ml-1 text-red-500">*</span>
      </label>
      <input
        id="remote-name"
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Auto-filled from URL"
        disabled={isSubmitting}
        className={cn(
          wizardInputVariants({ error: !!errors.name }),
          'bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
          isSubmitting && 'cursor-not-allowed opacity-50'
        )}
        aria-required="true"
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? 'remote-name-error' : undefined}
      />
      {errors.name && (
        <p
          id="remote-name-error"
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {errors.name}
        </p>
      )}
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        Repository will be cloned to ~/.matrix/repositories/{name || '...'}
      </p>
    </div>

    <WizardActions
      submitLabel="Clone & Add"
      submittingLabel="Cloning..."
      isSubmitting={isSubmitting}
      onBack={onBack}
      onCancel={onCancel}
    />
  </>
);

// ============================================================================
// Shared components
// ============================================================================

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 w-4 flex-shrink-0 text-red-500"
      >
        <path
          fillRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  </div>
);

interface WizardActionsProps {
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting: boolean;
  onBack: () => void;
  onCancel: () => void;
}

const WizardActions: React.FC<WizardActionsProps> = ({
  submitLabel,
  submittingLabel,
  isSubmitting,
  onBack,
  onCancel,
}) => (
  <div className="flex items-center justify-between">
    <button
      type="button"
      onClick={onBack}
      disabled={isSubmitting}
      className="text-sm text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-100"
    >
      &larr; Back
    </button>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className={cn(wizardButtonVariants({ variant: 'secondary', disabled: isSubmitting }))}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          wizardButtonVariants({ variant: 'primary', disabled: isSubmitting }),
          'min-w-[120px]'
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{submittingLabel || 'Saving...'}</span>
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  </div>
);

SourceFormWizard.displayName = 'SourceFormWizard';

export { SourceFormWizard, extractNameFromPath, extractNameFromUrl };
