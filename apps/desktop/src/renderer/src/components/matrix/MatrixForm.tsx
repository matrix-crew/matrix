import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import type { Matrix } from '@maxtix/shared';

/**
 * Form button variants using class-variance-authority
 */
const formButtonVariants = cva(
  'rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
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
 * Form input variants using class-variance-authority
 */
const formInputVariants = cva(
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

/**
 * Form mode: create new or edit existing
 */
export type MatrixFormMode = 'create' | 'edit';

/**
 * Form field values
 */
export interface MatrixFormValues {
  /** Matrix name */
  name: string;
}

/**
 * Form state
 */
export interface MatrixFormState {
  /** Form field values */
  values: MatrixFormValues;
  /** Field-level error messages */
  errors: Partial<Record<keyof MatrixFormValues, string>>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** General error message */
  errorMessage: string | null;
}

/**
 * Create initial form state
 *
 * @param matrix - Optional matrix for edit mode
 * @returns Initial MatrixFormState
 */
export function createInitialFormState(matrix?: Matrix | null): MatrixFormState {
  return {
    values: {
      name: matrix?.name ?? '',
    },
    errors: {},
    isSubmitting: false,
    errorMessage: null,
  };
}

/**
 * Validate form values
 *
 * @param values - Form values to validate
 * @returns Object with field-level errors (empty if valid)
 */
export function validateFormValues(values: MatrixFormValues): Partial<Record<keyof MatrixFormValues, string>> {
  const errors: Partial<Record<keyof MatrixFormValues, string>> = {};

  // Name is required and must be non-empty
  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = 'Matrix name is required';
  } else if (trimmedName.length > 100) {
    errors.name = 'Matrix name must be 100 characters or less';
  }

  return errors;
}

export interface MatrixFormProps extends VariantProps<typeof formButtonVariants> {
  /** Form mode: create or edit */
  mode: MatrixFormMode;
  /** Matrix to edit (required in edit mode) */
  matrix?: Matrix | null;
  /** Callback when form is submitted with valid values */
  onSubmit?: (values: MatrixFormValues) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Additional CSS classes for the form container */
  className?: string;
}

/**
 * MatrixForm component
 *
 * A form component for creating or editing Matrix objects.
 * Handles validation, submission, and error states.
 *
 * @example
 * // Create mode
 * <MatrixForm
 *   mode="create"
 *   onSubmit={(values) => createMatrix(values.name)}
 *   onCancel={() => closeDialog()}
 * />
 *
 * @example
 * // Edit mode
 * <MatrixForm
 *   mode="edit"
 *   matrix={selectedMatrix}
 *   onSubmit={(values) => updateMatrix(matrix.id, values.name)}
 *   onCancel={() => closeDialog()}
 * />
 */
const MatrixForm: React.FC<MatrixFormProps> = ({
  mode,
  matrix,
  onSubmit,
  onCancel,
  className,
}) => {
  const [state, setState] = React.useState<MatrixFormState>(() => {
    return createInitialFormState(matrix);
  });

  /**
   * Handle input value change
   */
  const handleInputChange = React.useCallback(
    (field: keyof MatrixFormValues, value: string) => {
      setState((prevState) => ({
        ...prevState,
        values: {
          ...prevState.values,
          [field]: value,
        },
        // Clear field error when user starts typing
        errors: {
          ...prevState.errors,
          [field]: undefined,
        },
        errorMessage: null,
      }));
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      const errors = validateFormValues(state.values);
      if (Object.keys(errors).length > 0) {
        setState((prevState) => ({
          ...prevState,
          errors,
        }));
        return;
      }

      // Start submitting
      setState((prevState) => ({
        ...prevState,
        isSubmitting: true,
        errorMessage: null,
      }));

      try {
        await onSubmit?.(state.values);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState((prevState) => ({
          ...prevState,
          isSubmitting: false,
          errorMessage,
        }));
      }
    },
    [state.values, onSubmit]
  );

  /**
   * Handle form cancellation
   */
  const handleCancel = React.useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const isEditMode = mode === 'edit';
  const formTitle = isEditMode ? 'Edit Matrix' : 'Create Matrix';
  const submitLabel = isEditMode ? 'Save Changes' : 'Create Matrix';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      role="form"
      aria-label={formTitle}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formTitle}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditMode
            ? 'Update the matrix name below.'
            : 'Enter a name for your new matrix.'}
        </p>
      </div>

      {/* Error message */}
      {state.errorMessage && (
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
            <p className="text-sm text-red-700 dark:text-red-400">
              {state.errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Name field */}
      <div className="mb-6">
        <label
          htmlFor="matrix-name"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
          <span className="ml-1 text-red-500">*</span>
        </label>
        <input
          id="matrix-name"
          type="text"
          value={state.values.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter matrix name..."
          disabled={state.isSubmitting}
          className={cn(
            formInputVariants({ error: !!state.errors.name }),
            'bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500',
            state.isSubmitting && 'cursor-not-allowed opacity-50'
          )}
          aria-required="true"
          aria-invalid={!!state.errors.name}
          aria-describedby={state.errors.name ? 'name-error' : undefined}
          autoFocus
        />
        {state.errors.name && (
          <p
            id="name-error"
            className="mt-1.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {state.errors.name}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={state.isSubmitting}
          className={cn(
            formButtonVariants({ variant: 'secondary', disabled: state.isSubmitting })
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={state.isSubmitting}
          className={cn(
            formButtonVariants({ variant: 'primary', disabled: state.isSubmitting }),
            'min-w-[120px]'
          )}
        >
          {state.isSubmitting ? (
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
              <span>Saving...</span>
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

MatrixForm.displayName = 'MatrixForm';

export { MatrixForm, formButtonVariants, formInputVariants };
