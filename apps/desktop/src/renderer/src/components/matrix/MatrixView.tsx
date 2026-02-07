import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { Matrix, Source } from '@maxtix/shared';
import {
  MatrixList,
  type MatrixListState,
  createInitialMatrixListState,
} from './MatrixList';
import {
  SourceList,
  type SourceListState,
  createInitialSourceListState,
} from './SourceList';
import { MatrixForm, type MatrixFormValues } from './MatrixForm';

/**
 * Matrix view state
 */
export interface MatrixViewState {
  /** Matrix list state */
  matrixListState: MatrixListState;
  /** Source list state for the selected matrix */
  sourceListState: SourceListState;
  /** Currently selected matrix */
  selectedMatrix: Matrix | null;
  /** Currently selected source */
  selectedSource: Source | null;
  /** Whether the create/edit form is open */
  isFormOpen: boolean;
  /** Form mode: create or edit */
  formMode: 'create' | 'edit';
  /** Matrix being edited (null for create mode) */
  editingMatrix: Matrix | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  errorMessage: string | null;
}

/**
 * Create initial matrix view state
 *
 * @returns Initial MatrixViewState
 */
export function createInitialMatrixViewState(): MatrixViewState {
  return {
    matrixListState: createInitialMatrixListState(),
    sourceListState: createInitialSourceListState(),
    selectedMatrix: null,
    selectedSource: null,
    isFormOpen: false,
    formMode: 'create',
    editingMatrix: null,
    isLoading: false,
    errorMessage: null,
  };
}

/**
 * Action button variants using class-variance-authority
 */
const actionButtonVariants = cva(
  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
        danger: 'text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  }
);

export interface MatrixViewProps extends VariantProps<typeof actionButtonVariants> {
  /** Initial state for the matrix view */
  initialState?: MatrixViewState;
  /** Callback when state changes */
  onStateChange?: (state: MatrixViewState) => void;
  /** Additional CSS classes for the view container */
  className?: string;
}

/**
 * MatrixView component
 *
 * Main view for managing Matrix objects. Displays a three-panel layout with:
 * - Left panel: List of all Matrices
 * - Center panel: List of Sources in the selected Matrix
 * - Right panel: Details of the selected Source (conditional)
 *
 * Follows the BranchesView component pattern for consistency.
 *
 * @example
 * <MatrixView
 *   onStateChange={(state) => saveToBackend(state)}
 * />
 */
const MatrixView: React.FC<MatrixViewProps> = ({
  initialState,
  onStateChange,
  className,
}) => {
  const [state, setState] = React.useState<MatrixViewState>(() => {
    return initialState ?? createInitialMatrixViewState();
  });

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: MatrixViewState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * Handle matrix selection
   */
  const handleMatrixSelect = React.useCallback(
    (matrix: Matrix | null) => {
      updateState({
        ...state,
        selectedMatrix: matrix,
        selectedSource: null,
        sourceListState: {
          ...createInitialSourceListState(matrix),
          // In a real app, you'd fetch sources for this matrix here
          sources: [],
        },
      });
    },
    [state, updateState]
  );

  /**
   * Handle source selection
   */
  const handleSourceSelect = React.useCallback(
    (source: Source | null) => {
      updateState({
        ...state,
        selectedSource: source,
      });
    },
    [state, updateState]
  );

  /**
   * Handle matrix list state change
   */
  const handleMatrixListStateChange = React.useCallback(
    (matrixListState: MatrixListState) => {
      updateState({
        ...state,
        matrixListState,
      });
    },
    [state, updateState]
  );

  /**
   * Handle source list state change
   */
  const handleSourceListStateChange = React.useCallback(
    (sourceListState: SourceListState) => {
      updateState({
        ...state,
        sourceListState,
      });
    },
    [state, updateState]
  );

  /**
   * Open create matrix form
   */
  const handleOpenCreateForm = React.useCallback(() => {
    updateState({
      ...state,
      isFormOpen: true,
      formMode: 'create',
      editingMatrix: null,
    });
  }, [state, updateState]);

  /**
   * Open edit matrix form
   */
  const handleOpenEditForm = React.useCallback(() => {
    if (state.selectedMatrix) {
      updateState({
        ...state,
        isFormOpen: true,
        formMode: 'edit',
        editingMatrix: state.selectedMatrix,
      });
    }
  }, [state, updateState]);

  /**
   * Close matrix form
   */
  const handleCloseForm = React.useCallback(() => {
    updateState({
      ...state,
      isFormOpen: false,
      editingMatrix: null,
    });
  }, [state, updateState]);

  /**
   * Handle form submission
   */
  const handleFormSubmit = React.useCallback(
    async (values: MatrixFormValues) => {
      // In a real app, this would call the IPC to create/update the matrix
      // For now, we just close the form
      handleCloseForm();
    },
    [handleCloseForm]
  );

  /**
   * Handle delete matrix
   */
  const handleDeleteMatrix = React.useCallback(() => {
    if (state.selectedMatrix) {
      // In a real app, this would call the IPC to delete the matrix
      // For now, we just clear the selection
      updateState({
        ...state,
        selectedMatrix: null,
        selectedSource: null,
      });
    }
  }, [state, updateState]);

  /**
   * Handle add source to matrix
   */
  const handleAddSource = React.useCallback(() => {
    // In a real app, this would open a dialog to add a source
  }, []);

  /**
   * Handle remove source from matrix
   */
  const handleRemoveSource = React.useCallback(
    (source: Source) => {
      // In a real app, this would call the IPC to remove the source from the matrix
    },
    []
  );

  /**
   * Close source details panel
   */
  const handleCloseSourceDetails = React.useCallback(() => {
    updateState({
      ...state,
      selectedSource: null,
    });
  }, [state, updateState]);

  return (
    <div
      className={cn('flex h-full gap-4 overflow-hidden', className)}
      role="region"
      aria-label="Matrix View"
    >
      {/* Left panel - Matrix list */}
      <div className="w-64 flex-shrink-0">
        <MatrixList
          initialState={state.matrixListState}
          onStateChange={handleMatrixListStateChange}
          onMatrixSelect={handleMatrixSelect}
          onCreateMatrix={handleOpenCreateForm}
          className="h-full"
        />
      </div>

      {/* Center panel - Source list or empty state */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {state.selectedMatrix ? (
          <>
            {/* Matrix header with actions */}
            <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {state.selectedMatrix.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {state.selectedMatrix.source_ids.length} source
                  {state.selectedMatrix.source_ids.length !== 1 ? 's' : ''} •
                  Created{' '}
                  {new Date(state.selectedMatrix.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenEditForm}
                  className={cn(actionButtonVariants({ variant: 'secondary' }))}
                  aria-label="Edit matrix"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="mr-1 inline-block h-3 w-3"
                  >
                    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                    <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMatrix}
                  className={cn(actionButtonVariants({ variant: 'danger' }))}
                  aria-label="Delete matrix"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="mr-1 inline-block h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Source list */}
            <SourceList
              initialState={{
                ...state.sourceListState,
                matrix: state.selectedMatrix,
              }}
              onStateChange={handleSourceListStateChange}
              onSourceSelect={handleSourceSelect}
              onAddSource={handleAddSource}
              onRemoveSource={handleRemoveSource}
              className="flex-1"
            />
          </>
        ) : (
          <EmptyStatePanel onCreateMatrix={handleOpenCreateForm} />
        )}
      </div>

      {/* Right panel - Source details (conditional) */}
      {state.selectedSource && (
        <SourceDetailsPanel
          source={state.selectedSource}
          onClose={handleCloseSourceDetails}
        />
      )}

      {/* Matrix form modal */}
      {state.isFormOpen && (
        <FormModal
          mode={state.formMode}
          matrix={state.editingMatrix}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

/**
 * Empty state panel when no matrix is selected
 */
interface EmptyStatePanelProps {
  onCreateMatrix: () => void;
}

const EmptyStatePanel: React.FC<EmptyStatePanelProps> = ({ onCreateMatrix }) => (
  <div className="flex h-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
    >
      <path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657ZM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6ZM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 0 1 6.75 6h10.5a3 3 0 0 1 2.683 1.657A4.505 4.505 0 0 0 18.75 7.5H5.25Z" />
    </svg>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      No Matrix Selected
    </h3>
    <p className="mt-2 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
      Select a matrix from the list to view its sources, or create a new matrix to get started.
    </p>
    <button
      type="button"
      onClick={onCreateMatrix}
      className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="mr-2 inline-block h-4 w-4"
      >
        <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
      </svg>
      Create New Matrix
    </button>
  </div>
);

/**
 * Source details panel component
 */
interface SourceDetailsPanelProps {
  source: Source;
  onClose: () => void;
}

const SourceDetailsPanel: React.FC<SourceDetailsPanelProps> = ({ source, onClose }) => (
  <div className="flex w-80 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {source.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Source Details</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        aria-label="Close source details"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
        </svg>
      </button>
    </div>

    {/* Details */}
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Path section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Location
          </h4>
          <div className="space-y-2">
            <DetailRow label="Path" value={source.path} mono />
            {source.url && <DetailRow label="Remote URL" value={source.url} mono />}
          </div>
        </div>

        {/* Metadata section */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Metadata
          </h4>
          <div className="space-y-2">
            <DetailRow label="ID" value={source.id} mono />
            <DetailRow
              label="Created"
              value={new Date(source.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
      <div className="space-y-2">
        <button
          type="button"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Open in Finder
        </button>
        <button
          type="button"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Open in Terminal
        </button>
      </div>
    </div>
  </div>
);

/**
 * Detail row component
 */
interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, mono }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span
      className={cn(
        'text-sm text-gray-900 dark:text-gray-100 break-all',
        mono && 'font-mono text-xs'
      )}
    >
      {value}
    </span>
  </div>
);

/**
 * Form modal component for create/edit matrix
 */
interface FormModalProps {
  mode: 'create' | 'edit';
  matrix: Matrix | null;
  onSubmit: (values: MatrixFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const FormModal: React.FC<FormModalProps> = ({ mode, matrix, onSubmit, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="form-modal-title"
    onClick={onCancel}
  >
    <div
      className="w-full max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      <MatrixForm
        mode={mode}
        matrix={matrix}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  </div>
);

MatrixView.displayName = 'MatrixView';

export { MatrixView, actionButtonVariants };
