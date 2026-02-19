/**
 * Matrix Page Components
 *
 * Re-exports matrix page components and their variants for easy importing.
 */

// Export DashboardView component
export { DashboardView } from './DashboardView';
export type { DashboardViewProps } from './DashboardView';

// Export DashboardSourceCard component
export { DashboardSourceCard } from './DashboardSourceCard';
export type { DashboardSourceCardProps } from './DashboardSourceCard';

// Export MatrixList component with its variants
export { MatrixList, matrixItemVariants } from './MatrixList';

// Export MatrixList prop types
export type { MatrixListProps, MatrixListState, MatrixFilter } from './MatrixList';

// Export MatrixList utility functions
export {
  createInitialMatrixListState,
  filterMatrices,
  getMatrixSourceCount,
  formatMatrixDate,
} from './MatrixList';

// Export MatrixForm component with its variants
export { MatrixForm, formButtonVariants, formInputVariants } from './MatrixForm';

// Export MatrixForm prop types
export type {
  MatrixFormProps,
  MatrixFormMode,
  MatrixFormValues,
  MatrixFormState,
} from './MatrixForm';

// Export MatrixForm utility functions
export { createInitialFormState, validateFormValues } from './MatrixForm';

// Export SourceList component with its variants
export { SourceList, sourceItemVariants } from './SourceList';

// Export SourceList prop types
export type { SourceListProps, SourceListState, SourceFilter } from './SourceList';

// Export SourceList utility functions
export {
  createInitialSourceListState,
  filterSources,
  formatSourceDate,
  truncatePath,
} from './SourceList';

// Export SourceForm component with its variants
export { SourceForm, sourceFormButtonVariants, sourceFormInputVariants } from './SourceForm';

// Export SourceForm prop types
export type {
  SourceFormProps,
  SourceFormMode,
  SourceFormValues,
  SourceFormState,
} from './SourceForm';

// Export SourceForm utility functions
export { createInitialSourceFormState, validateSourceFormValues } from './SourceForm';
