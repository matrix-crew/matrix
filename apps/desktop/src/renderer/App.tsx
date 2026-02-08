import React, { useState, useEffect, useCallback } from 'react';
import type { Matrix } from '@maxtix/shared';
import { MatrixTabBar } from '@/components/layout/MatrixTabBar';
import { ContextSidebar, type ContextItemId } from '@/components/layout/ContextSidebar';
import { OnboardingView } from '@/components/layout/OnboardingView';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { HomeView } from '@/components/home/HomeView';
import { MatrixView } from '@/components/matrix/MatrixView';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { PipelineEditor } from '@/components/workflow/PipelineEditor';
import { TerminalManager } from '@/components/terminal/TerminalManager';
import { MCPControl } from '@/components/agent/MCPControl';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { MatrixForm, type MatrixFormValues } from '@/components/matrix/MatrixForm';

/**
 * Main App component for Maxtix desktop application
 *
 * New layout: MatrixTabBar on top, ContextSidebar + main content in flex row.
 * Each matrix is a tab; selecting a tab shows its contextual sidebar.
 */
const App: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [activeMatrixId, setActiveMatrixId] = useState<string | null>(null);
  const [isHomeActive, setIsHomeActive] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [activeContextItem, setActiveContextItem] = useState<ContextItemId>('sources');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch matrices from backend and optionally navigate to Home
   */
  const fetchMatrices = useCallback(async (navigateToHome = false) => {
    try {
      setIsLoading(true);
      const response = await window.api.sendMessage({ type: 'matrix-list' });
      if (response.success && response.data) {
        const loaded = (response.data as { matrices: Matrix[] }).matrices || [];
        setMatrices(loaded);
        if (navigateToHome && loaded.length > 0) {
          setIsHomeActive(true);
        }
      }
    } catch {
      // Silently handle - matrices will be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize app: check onboarding status, then fetch matrices
   */
  useEffect(() => {
    const init = async () => {
      try {
        const config = await window.api.readConfig().catch(() => ({ onboarding_completed: false }));
        const needsOnboarding = !config.onboarding_completed;
        setShowOnboarding(needsOnboarding);

        if (!needsOnboarding) {
          fetchMatrices(true);
        }
      } catch {
        // If config check fails, skip onboarding and go to app
        setShowOnboarding(false);
        fetchMatrices(true);
      }
    };
    init();
  }, [fetchMatrices]);

  /**
   * Handle onboarding completion
   */
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    fetchMatrices(true);
  }, [fetchMatrices]);

  /**
   * Select the Home tab
   */
  const handleSelectHome = useCallback(() => {
    setActiveMatrixId(null);
    setIsHomeActive(true);
    setShowGlobalSettings(false);
  }, []);

  /**
   * Select a matrix tab
   */
  const handleSelectMatrix = useCallback((id: string) => {
    setActiveMatrixId(id);
    setIsHomeActive(false);
    setShowGlobalSettings(false);
  }, []);

  /**
   * Open global settings (accessible from any view)
   */
  const handleOpenSettings = useCallback(() => {
    setShowGlobalSettings(true);
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
      setIsHomeActive(false);
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
            // If we deleted the active tab, go to Home
            if (activeMatrixId === id) {
              setActiveMatrixId(null);
              setIsHomeActive(remaining.length > 0);
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
    // Global settings (accessible from any view)
    if (showGlobalSettings) {
      return <SettingsPage initialSection="appearance" />;
    }

    // Home view: full-width grid, no sidebar
    if (isHomeActive && !activeMatrixId) {
      return (
        <HomeView
          matrices={matrices}
          onSelectMatrix={handleSelectMatrix}
          onCreateMatrix={handleOpenCreateForm}
        />
      );
    }

    if (!activeMatrixId) return null;

    switch (activeContextItem) {
      case 'sources':
        return <MatrixView matrixId={activeMatrixId} key={activeMatrixId} />;
      case 'kanban':
        return <KanbanBoard />;
      case 'pipeline':
        return <PipelineEditor />;
      case 'console':
        return <TerminalManager />;
      case 'mcp':
        return <MCPControl />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <MatrixView matrixId={activeMatrixId} key={activeMatrixId} />;
    }
  };

  // Show loading while checking onboarding status
  if (showOnboarding === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-base-900">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    );
  }

  // Show onboarding wizard
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Show loading while fetching matrices
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
        {/* Empty tab bar with just the Home + button */}
        <MatrixTabBar
          matrices={[]}
          activeMatrixId={null}
          isHomeActive={isHomeActive}
          isSettingsActive={showGlobalSettings}
          onSelectMatrix={() => {}}
          onSelectHome={handleSelectHome}
          onCreateMatrix={handleOpenCreateForm}
          onCloseMatrix={() => {}}
          onOpenSettings={handleOpenSettings}
        />
        <OnboardingView onCreateMatrix={handleOpenCreateForm} />

        {isFormOpen && (
          <FormModal onSubmit={handleCreateMatrix} onCancel={() => setIsFormOpen(false)} />
        )}
      </div>
    );
  }

  const showSidebar = activeMatrixId !== null && !isHomeActive && !showGlobalSettings;

  return (
    <div className="flex h-screen w-full flex-col bg-base-900">
      {/* Matrix Tab Bar */}
      <MatrixTabBar
        matrices={matrices}
        activeMatrixId={activeMatrixId}
        isHomeActive={isHomeActive && !showGlobalSettings}
        isSettingsActive={showGlobalSettings}
        onSelectMatrix={handleSelectMatrix}
        onSelectHome={handleSelectHome}
        onCreateMatrix={handleOpenCreateForm}
        onCloseMatrix={handleCloseMatrix}
        onOpenSettings={handleOpenSettings}
      />

      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <ContextSidebar activeItem={activeContextItem} onItemSelect={setActiveContextItem} />
        )}

        <main className={`flex-1 overflow-auto animate-fade-in${showSidebar ? ' p-4' : ''}`}>
          {renderContent()}
        </main>
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
