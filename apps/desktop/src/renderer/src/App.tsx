import React, { useState, useEffect, useCallback } from 'react';
import type { Matrix, IPCResponse } from '@maxtix/shared';
import { MatrixTabBar } from '@/components/layout/MatrixTabBar';
import { ContextSidebar, type ContextItemId } from '@/components/layout/ContextSidebar';
import { OnboardingView } from '@/components/layout/OnboardingView';
import { MatrixView } from '@/components/matrix/MatrixView';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { PipelineEditor } from '@/components/workflow/PipelineEditor';
import { ConsoleManager } from '@/components/agent/ConsoleManager';
import { MCPControl } from '@/components/agent/MCPControl';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { MatrixForm, type MatrixFormValues } from '@/components/matrix/MatrixForm';

// Declare window.api for TypeScript
declare global {
  interface Window {
    api: {
      sendMessage: (message: { type: string; data?: unknown }) => Promise<IPCResponse>;
    };
  }
}

/**
 * Main App component for Maxtix desktop application
 *
 * New layout: MatrixTabBar on top, ContextSidebar + main content in flex row.
 * Each matrix is a tab; selecting a tab shows its contextual sidebar.
 */
const App: React.FC = () => {
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [activeMatrixId, setActiveMatrixId] = useState<string | null>(null);
  const [activeContextItem, setActiveContextItem] = useState<ContextItemId>('sources');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch matrices from backend on mount
   */
  const fetchMatrices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await window.api.sendMessage({ type: 'matrix-list' });
      if (response.success && response.data) {
        const loaded = (response.data as { matrices: Matrix[] }).matrices || [];
        setMatrices(loaded);
        // Auto-select first matrix if none selected
        if (loaded.length > 0 && !activeMatrixId) {
          setActiveMatrixId(loaded[0].id);
        }
      }
    } catch {
      // Silently handle - matrices will be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrices();
  }, [fetchMatrices]);

  /**
   * Select a matrix tab
   */
  const handleSelectMatrix = useCallback((id: string) => {
    setActiveMatrixId(id);
  }, []);

  /**
   * Open create matrix form
   */
  const handleOpenCreateForm = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  /**
   * Create a new matrix via IPC
   */
  const handleCreateMatrix = useCallback(async (values: MatrixFormValues) => {
    const response = await window.api.sendMessage({
      type: 'matrix-create',
      data: { name: values.name },
    });

    if (response.success && response.data) {
      const newMatrix = (response.data as { matrix: Matrix }).matrix;
      setMatrices((prev) => [...prev, newMatrix]);
      setActiveMatrixId(newMatrix.id);
      setIsFormOpen(false);
    } else {
      throw new Error(response.error || 'Failed to create matrix');
    }
  }, []);

  /**
   * Close (delete) a matrix tab
   */
  const handleCloseMatrix = useCallback(
    async (id: string) => {
      const matrix = matrices.find((m) => m.id === id);
      if (!matrix) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete "${matrix.name}"? This action cannot be undone.`
      );
      if (!confirmed) return;

      try {
        const response = await window.api.sendMessage({
          type: 'matrix-delete',
          data: { id },
        });

        if (response.success) {
          setMatrices((prev) => {
            const remaining = prev.filter((m) => m.id !== id);
            // If we deleted the active tab, select an adjacent one
            if (activeMatrixId === id) {
              const deletedIndex = prev.findIndex((m) => m.id === id);
              const nextMatrix = remaining[Math.min(deletedIndex, remaining.length - 1)];
              setActiveMatrixId(nextMatrix?.id ?? null);
            }
            return remaining;
          });
        }
      } catch {
        // Silently handle
      }
    },
    [matrices, activeMatrixId]
  );

  /**
   * Render content based on active context item
   */
  const renderContent = () => {
    if (!activeMatrixId) return null;

    switch (activeContextItem) {
      case 'sources':
        return <MatrixView matrixId={activeMatrixId} key={activeMatrixId} />;
      case 'kanban':
        return <KanbanBoard />;
      case 'pipeline':
        return <PipelineEditor />;
      case 'console':
        return <ConsoleManager />;
      case 'mcp':
        return <MCPControl />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <MatrixView matrixId={activeMatrixId} key={activeMatrixId} />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-base-900">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    );
  }

  // No matrices - show onboarding
  if (matrices.length === 0 && !isFormOpen) {
    return (
      <div className="flex h-screen w-full flex-col bg-base-900">
        {/* Empty tab bar with just the + button */}
        <MatrixTabBar
          matrices={[]}
          activeMatrixId={null}
          onSelectMatrix={() => {}}
          onCreateMatrix={handleOpenCreateForm}
          onCloseMatrix={() => {}}
        />
        <OnboardingView onCreateMatrix={handleOpenCreateForm} />

        {isFormOpen && (
          <FormModal onSubmit={handleCreateMatrix} onCancel={() => setIsFormOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-base-900">
      {/* Matrix Tab Bar */}
      <MatrixTabBar
        matrices={matrices}
        activeMatrixId={activeMatrixId}
        onSelectMatrix={handleSelectMatrix}
        onCreateMatrix={handleOpenCreateForm}
        onCloseMatrix={handleCloseMatrix}
      />

      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <ContextSidebar activeItem={activeContextItem} onItemSelect={setActiveContextItem} />

        <main className="flex-1 overflow-auto p-4 animate-fade-in">{renderContent()}</main>
      </div>

      {/* Create matrix form modal */}
      {isFormOpen && (
        <FormModal onSubmit={handleCreateMatrix} onCancel={() => setIsFormOpen(false)} />
      )}
    </div>
  );
};

/**
 * Modal wrapper for the matrix creation form
 */
interface FormModalProps {
  onSubmit: (values: MatrixFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const FormModal: React.FC<FormModalProps> = ({ onSubmit, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    role="dialog"
    aria-modal="true"
    onClick={onCancel}
  >
    <div className="w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
      <MatrixForm mode="create" matrix={null} onSubmit={onSubmit} onCancel={onCancel} />
    </div>
  </div>
);

export default App;
