import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import type { Matrix, Source } from '@maxtix/shared';
import { SourceList, type SourceListState, createInitialSourceListState } from './SourceList';
import { MatrixForm, type MatrixFormValues } from './MatrixForm';
import { SourceForm, type SourceFormValues } from './SourceForm';

/**
 * Action button variants using class-variance-authority
 */
const actionButtonVariants = cva(
  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary:
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
        danger:
          'text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  }
);

export interface MatrixViewProps extends VariantProps<typeof actionButtonVariants> {
  /** ID of the matrix to display */
  matrixId: string;
  /** Additional CSS classes for the view container */
  className?: string;
}

/**
 * MatrixView component
 *
 * Sources view for a given matrix. Displays a two-panel layout with:
 * - Left panel: List of Sources in the selected Matrix
 * - Right panel: Details of the selected Source (conditional)
 *
 * Matrix selection is now handled by the tab bar in App.tsx.
 */
const MatrixView: React.FC<MatrixViewProps> = ({ matrixId, className }) => {
  const [matrix, setMatrix] = React.useState<Matrix | null>(null);
  const [sourceListState, setSourceListState] = React.useState<SourceListState>(
    createInitialSourceListState()
  );
  const [selectedSource, setSelectedSource] = React.useState<Source | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [editingMatrix, setEditingMatrix] = React.useState<Matrix | null>(null);
  const [isSourceFormOpen, setIsSourceFormOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  /**
   * Fetch all sources from backend
   */
  const fetchAllSources = React.useCallback(async (): Promise<Source[]> => {
    try {
      const response = await window.api.sendMessage({ type: 'source-list' });
      if (response.success && response.data) {
        const sources = (response.data as { sources: Source[] }).sources || [];
        return sources;
      }
    } catch {
      // Silently fail
    }
    return [];
  }, []);

  /**
   * Fetch the matrix and its sources
   */
  const fetchMatrixData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Fetch the matrix by ID
      const matrixResponse = await window.api.sendMessage({
        type: 'matrix-get',
        data: { id: matrixId },
      });

      if (!matrixResponse.success || !matrixResponse.data) {
        setErrorMessage(matrixResponse.error || 'Failed to load matrix');
        setIsLoading(false);
        return;
      }

      const loadedMatrix = (matrixResponse.data as { matrix: Matrix }).matrix;
      setMatrix(loadedMatrix);

      // Fetch sources for this matrix
      if (loadedMatrix.source_ids && loadedMatrix.source_ids.length > 0) {
        const sources = await fetchAllSources();
        const matrixSources = sources.filter((s) => loadedMatrix.source_ids.includes(s.id));
        setSourceListState({
          ...createInitialSourceListState(loadedMatrix),
          sources: matrixSources,
          matrix: loadedMatrix,
        });
      } else {
        setSourceListState({
          ...createInitialSourceListState(loadedMatrix),
          matrix: loadedMatrix,
        });
      }

      setIsLoading(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load matrix';
      setErrorMessage(errorMsg);
      setIsLoading(false);
    }
  }, [matrixId, fetchAllSources]);

  React.useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  /**
   * Handle source selection
   */
  const handleSourceSelect = React.useCallback((source: Source | null) => {
    setSelectedSource(source);
  }, []);

  /**
   * Handle source list state change
   */
  const handleSourceListStateChange = React.useCallback((newState: SourceListState) => {
    setSourceListState(newState);
  }, []);

  /**
   * Open edit matrix form
   */
  const handleOpenEditForm = React.useCallback(() => {
    if (matrix) {
      setFormMode('edit');
      setEditingMatrix(matrix);
      setIsFormOpen(true);
    }
  }, [matrix]);

  /**
   * Close matrix form
   */
  const handleCloseForm = React.useCallback(() => {
    setIsFormOpen(false);
    setEditingMatrix(null);
  }, []);

  /**
   * Handle form submission - update matrix via IPC
   */
  const handleFormSubmit = React.useCallback(
    async (values: MatrixFormValues) => {
      if (!editingMatrix) throw new Error('No matrix to edit');

      const response = await window.api.sendMessage({
        type: 'matrix-update',
        data: { id: editingMatrix.id, name: values.name },
      });

      if (response.success && response.data) {
        const updatedMatrix = (response.data as { matrix: Matrix }).matrix;
        setMatrix(updatedMatrix);
        setIsFormOpen(false);
        setEditingMatrix(null);
      } else {
        throw new Error(response.error || 'Failed to update matrix');
      }
    },
    [editingMatrix]
  );

  /**
   * Handle add source to matrix
   */
  const handleAddSource = React.useCallback(() => {
    setIsSourceFormOpen(true);
  }, []);

  /**
   * Handle close source form
   */
  const handleCloseSourceForm = React.useCallback(() => {
    setIsSourceFormOpen(false);
  }, []);

  /**
   * Handle source form submit - create source and add to matrix
   */
  const handleSourceFormSubmit = React.useCallback(
    async (values: SourceFormValues) => {
      if (!matrix) throw new Error('No matrix selected');

      // Create the source
      const createResponse = await window.api.sendMessage({
        type: 'source-create',
        data: {
          name: values.name,
          path: values.path,
          url: values.url || undefined,
        },
      });

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || 'Failed to create source');
      }

      const newSource = (createResponse.data as { source: Source }).source;

      // Add the source to the matrix
      const addResponse = await window.api.sendMessage({
        type: 'matrix-add-source',
        data: {
          matrixId: matrix.id,
          sourceId: newSource.id,
        },
      });

      if (!addResponse.success || !addResponse.data) {
        throw new Error(addResponse.error || 'Failed to add source to matrix');
      }

      const updatedMatrix = (addResponse.data as { matrix: Matrix }).matrix;

      setMatrix(updatedMatrix);
      setSourceListState((prev) => ({
        ...prev,
        sources: [...prev.sources, newSource],
        matrix: updatedMatrix,
      }));
      setIsSourceFormOpen(false);
    },
    [matrix]
  );

  /**
   * Handle remove source from matrix
   */
  const handleRemoveSource = React.useCallback(
    async (source: Source) => {
      if (!matrix) return;

      const confirmed = window.confirm(
        `Remove "${source.name}" from this matrix? The source will still exist but won't be part of this matrix.`
      );
      if (!confirmed) return;

      try {
        const response = await window.api.sendMessage({
          type: 'matrix-remove-source',
          data: {
            matrixId: matrix.id,
            sourceId: source.id,
          },
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to remove source from matrix');
        }

        const updatedMatrix = (response.data as { matrix: Matrix }).matrix;

        setMatrix(updatedMatrix);
        setSelectedSource((prev) => (prev?.id === source.id ? null : prev));
        setSourceListState((prev) => ({
          ...prev,
          sources: prev.sources.filter((s) => s.id !== source.id),
          matrix: updatedMatrix,
          selectedSourceId: prev.selectedSourceId === source.id ? null : prev.selectedSourceId,
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to remove source';
        setErrorMessage(errorMsg);
      }
    },
    [matrix]
  );

  /**
   * Close source details panel
   */
  const handleCloseSourceDetails = React.useCallback(() => {
    setSelectedSource(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    );
  }

  if (errorMessage || !matrix) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm text-red-400">{errorMessage || 'Matrix not found'}</p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex h-full gap-4 overflow-hidden', className)}
      role="region"
      aria-label="Matrix View"
    >
      {/* Main panel - Source list with header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Matrix header with actions */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-border-default bg-surface-raised p-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{matrix.name}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {matrix.source_ids.length} source
              {matrix.source_ids.length !== 1 ? 's' : ''} &middot; Created{' '}
              {new Date(matrix.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenEditForm}
              className={cn(actionButtonVariants({ variant: 'secondary' }))}
              aria-label="Edit matrix"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Source list */}
        <SourceList
          initialState={{
            ...sourceListState,
            matrix,
          }}
          onStateChange={handleSourceListStateChange}
          onSourceSelect={handleSourceSelect}
          onAddSource={handleAddSource}
          onRemoveSource={handleRemoveSource}
          className="flex-1"
        />
      </div>

      {/* Right panel - Source details (conditional) */}
      {selectedSource && (
        <SourceDetailsPanel source={selectedSource} onClose={handleCloseSourceDetails} />
      )}

      {/* Matrix edit form modal */}
      {isFormOpen && (
        <FormModal
          mode={formMode}
          matrix={editingMatrix}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
        />
      )}

      {/* Source form modal */}
      {isSourceFormOpen && (
        <SourceFormModal onSubmit={handleSourceFormSubmit} onCancel={handleCloseSourceForm} />
      )}
    </div>
  );
};

/**
 * Source details panel component
 */
interface SourceDetailsPanelProps {
  source: Source;
  onClose: () => void;
}

const SourceDetailsPanel: React.FC<SourceDetailsPanelProps> = ({ source, onClose }) => (
  <div className="flex w-80 flex-shrink-0 flex-col rounded-lg border border-border-default bg-surface-raised">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-border-default p-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-text-primary">{source.name}</h3>
        <p className="text-xs text-text-secondary">Source Details</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-text-muted transition-colors hover:bg-base-600 hover:text-text-primary"
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
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Location
          </h4>
          <div className="space-y-2">
            <DetailRow label="Path" value={source.path} mono />
            {source.url && <DetailRow label="Remote URL" value={source.url} mono />}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
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
    <span className="text-xs text-text-muted">{label}</span>
    <span className={cn('text-sm text-text-primary break-all', mono && 'font-mono text-xs')}>
      {value}
    </span>
  </div>
);

/**
 * Form modal component for edit matrix
 */
interface FormModalProps {
  mode: 'create' | 'edit';
  matrix: Matrix | null;
  onSubmit: (values: MatrixFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const FormModal: React.FC<FormModalProps> = ({ mode, matrix, onSubmit, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    role="dialog"
    aria-modal="true"
    onClick={onCancel}
  >
    <div className="w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
      <MatrixForm mode={mode} matrix={matrix} onSubmit={onSubmit} onCancel={onCancel} />
    </div>
  </div>
);

/**
 * Source form modal component
 */
interface SourceFormModalProps {
  onSubmit: (values: SourceFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const SourceFormModal: React.FC<SourceFormModalProps> = ({ onSubmit, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    role="dialog"
    aria-modal="true"
    onClick={onCancel}
  >
    <div className="w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
      <SourceForm mode="create" onSubmit={onSubmit} onCancel={onCancel} />
    </div>
  </div>
);

MatrixView.displayName = 'MatrixView';

export { MatrixView, actionButtonVariants };
