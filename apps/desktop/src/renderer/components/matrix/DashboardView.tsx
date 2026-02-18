import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import type {
  Matrix,
  Source,
  ReconcileReport,
  LocalSourceCreateData,
  RemoteSourceCreateData,
} from '@shared/types/matrix';
import { SourceFormWizard } from './SourceFormWizard';
import { DashboardSourceCard } from './DashboardSourceCard';
import { useGitHubData } from '@/hooks/useGitHubData';
import { GitHubSetupPrompt } from '@/components/workspace/GitHubSetupPrompt';

export interface DashboardViewProps {
  matrixId: string;
  className?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ matrixId, className }) => {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSourceFormOpen, setIsSourceFormOpen] = useState(false);

  // GitHub data — stabilise the array reference so useGitHubData hooks
  // don't re-trigger on every render while matrix is still null.
  const sourceIds = useMemo(() => matrix?.source_ids ?? [], [matrix?.source_ids]);
  const {
    status: ghStatus,
    isCheckingStatus,
    hasCheckedOnce,
    pullRequests,
    issues,
    refetchAll,
  } = useGitHubData({ sourceIds, enabled: sourceIds.length > 0 });

  const ghConnected = ghStatus.installed && ghStatus.authenticated;
  const currentUser = ghStatus.user ?? '';

  // ---- Fetch sources ----
  const fetchAllSources = useCallback(async (): Promise<Source[]> => {
    try {
      const response = await window.api.sendMessage({ type: 'source-list' });
      if (response.success && response.data) {
        return (response.data as { sources: Source[] }).sources || [];
      }
    } catch {
      // Silently fail
    }
    return [];
  }, []);

  // ---- Fetch matrix + sources ----
  const fetchMatrixData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

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

      if (loadedMatrix.source_ids && loadedMatrix.source_ids.length > 0) {
        const allSources = await fetchAllSources();
        setSources(allSources.filter((s) => loadedMatrix.source_ids.includes(s.id)));
      } else {
        setSources([]);
      }

      setIsLoading(false);

      // Background reconcile
      window.api
        .sendMessage({ type: 'matrix-reconcile', data: { id: matrixId } })
        .then((reconcileResponse) => {
          if (reconcileResponse.success && reconcileResponse.data) {
            const report = (reconcileResponse.data as { report: ReconcileReport }).report;
            if (report.has_repairs) {
              fetchAllSources().then((allSources) => {
                setSources(allSources.filter((s) => loadedMatrix.source_ids.includes(s.id)));
              });
            }
          }
        })
        .catch(() => {});
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load matrix');
      setIsLoading(false);
    }
  }, [matrixId, fetchAllSources]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  // ---- Add source ----
  const handleSourceFormSubmit = useCallback(
    async (data: LocalSourceCreateData | RemoteSourceCreateData) => {
      if (!matrix) throw new Error('No matrix selected');

      const messageType =
        data.source_type === 'local' ? 'source-create-local' : 'source-create-remote';

      const createResponse = await window.api.sendMessage({ type: messageType, data });
      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || 'Failed to create source');
      }

      const newSource = (createResponse.data as { source: Source }).source;

      const addResponse = await window.api.sendMessage({
        type: 'matrix-add-source',
        data: { matrixId: matrix.id, sourceId: newSource.id },
      });

      if (!addResponse.success || !addResponse.data) {
        throw new Error(addResponse.error || 'Failed to add source to matrix');
      }

      const updatedMatrix = (addResponse.data as { matrix: Matrix }).matrix;
      setMatrix(updatedMatrix);
      setSources((prev) => [...prev, newSource]);
      setIsSourceFormOpen(false);
    },
    [matrix]
  );

  // ---- Remove source ----
  const handleRemoveSource = useCallback(
    async (source: Source) => {
      if (!matrix) return;

      const confirmed = window.confirm(
        `Remove "${source.name}" from this matrix? The source will still exist but won't be part of this matrix.`
      );
      if (!confirmed) return;

      try {
        const response = await window.api.sendMessage({
          type: 'matrix-remove-source',
          data: { matrixId: matrix.id, sourceId: source.id },
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to remove source from matrix');
        }

        const updatedMatrix = (response.data as { matrix: Matrix }).matrix;
        setMatrix(updatedMatrix);
        setSources((prev) => prev.filter((s) => s.id !== source.id));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to remove source');
      }
    },
    [matrix]
  );

  // ---- Loading / Error states ----
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

  // gh CLI not set up — show setup prompt
  if (sourceIds.length > 0 && !ghConnected && hasCheckedOnce) {
    // still render dashboard but GitHubSetupPrompt is shown inline below
  }

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {/* GitHub setup prompt (inline, not full-page) */}
      {sourceIds.length > 0 && (!ghConnected || !hasCheckedOnce) && (
        <div className="mb-4">
          <GitHubSetupPrompt
            status={ghStatus}
            isCheckingStatus={isCheckingStatus}
            hasCheckedOnce={hasCheckedOnce}
            onRetry={refetchAll}
          />
        </div>
      )}

      {/* Card grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => {
            const myPRs = pullRequests.filter(
              (pr) =>
                pr.author === currentUser && pr.repository.id === source.id && pr.state === 'open'
            );
            const myIssues = issues.filter(
              (i) =>
                i.assignees.includes(currentUser) &&
                i.repository.id === source.id &&
                i.state === 'open'
            );

            return (
              <DashboardSourceCard
                key={source.id}
                source={source}
                myPRs={myPRs}
                myIssues={myIssues}
                ghConnected={ghConnected}
                onRemove={handleRemoveSource}
              />
            );
          })}

          {/* Add source card */}
          <button
            type="button"
            onClick={() => setIsSourceFormOpen(true)}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-subtle p-4 text-text-muted transition-colors hover:border-accent-lime/40 hover:text-accent-lime"
          >
            <Plus className="size-6" />
            <span className="text-sm font-medium">Add Source</span>
          </button>
        </div>
      </div>

      {/* Source form modal */}
      {isSourceFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsSourceFormOpen(false)}
        >
          <div className="w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <SourceFormWizard
              onSubmit={handleSourceFormSubmit}
              onCancel={() => setIsSourceFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

DashboardView.displayName = 'DashboardView';
