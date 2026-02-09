import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Matrix, Source } from '@shared/types/matrix';
import { MatrixCard } from './MatrixCard';
import { CreateMatrixCard } from './CreateMatrixCard';

export interface HomeViewProps {
  matrices: Matrix[];
  onSelectMatrix: (id: string) => void;
  onCreateMatrix: () => void;
  className?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  matrices,
  onSelectMatrix,
  onCreateMatrix,
  className,
}) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await window.api.sendMessage({ type: 'source-list' });
      if (response.success && response.data) {
        const loaded = (response.data as { sources: Source[] }).sources || [];
        setSources(loaded);
      }
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const matrixSourcesMap = useMemo(() => {
    const map = new Map<string, Source[]>();
    for (const matrix of matrices) {
      map.set(
        matrix.id,
        sources.filter((s) => matrix.source_ids.includes(s.id))
      );
    }
    return map;
  }, [matrices, sources]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className={cn('h-full overflow-auto p-8', className)}
      onClick={() => setSelectedMatrixId(null)}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Your Matrices</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {matrices.length} matri{matrices.length === 1 ? 'x' : 'ces'}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {matrices.map((matrix) => (
            <MatrixCard
              key={matrix.id}
              matrix={matrix}
              sources={matrixSourcesMap.get(matrix.id) || []}
              isSelected={selectedMatrixId === matrix.id}
              onClick={() => setSelectedMatrixId(matrix.id)}
              onDoubleClick={() => onSelectMatrix(matrix.id)}
            />
          ))}
          <CreateMatrixCard
            onClick={() => {
              setSelectedMatrixId(null);
              onCreateMatrix();
            }}
          />
        </div>
      </div>
    </div>
  );
};

HomeView.displayName = 'HomeView';
