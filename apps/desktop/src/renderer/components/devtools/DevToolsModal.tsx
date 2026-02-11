import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, ToggleLeft, ToggleRight, Trash2, RotateCcw, Copy, Check } from 'lucide-react';
import type { Matrix } from '@shared/types/matrix';

interface AppPaths {
  configPath: string;
  dbPath: string;
  workspacePath: string;
}

interface DevToolsModalProps {
  onClose: () => void;
  onDataReset?: () => void;
  onOnboardingToggle?: (completed: boolean) => void;
}

export const DevToolsModal: React.FC<DevToolsModalProps> = ({
  onClose,
  onDataReset,
  onOnboardingToggle,
}) => {
  const [paths, setPaths] = useState<AppPaths | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [matrixCount, setMatrixCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [pathsResult, config, matricesResponse] = await Promise.all([
        window.api.getPaths(),
        window.api.readConfig(),
        window.api.sendMessage({ type: 'matrix-list' }),
      ]);
      setPaths(pathsResult);
      setOnboardingCompleted(config.onboarding_completed === true);
      if (matricesResponse.success && matricesResponse.data) {
        const matrices = (matricesResponse.data as { matrices: Matrix[] }).matrices || [];
        setMatrixCount(matrices.length);
      }
    } catch {
      // Best-effort load
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showStatus = useCallback((message: string) => {
    setActionStatus(message);
    setTimeout(() => setActionStatus(null), 2000);
  }, []);

  const handleToggleOnboarding = useCallback(async () => {
    const newValue = !onboardingCompleted;
    await window.api.writeConfig({ onboarding_completed: newValue });
    setOnboardingCompleted(newValue);
    onOnboardingToggle?.(newValue);
    showStatus(newValue ? 'Onboarding marked as completed' : 'Onboarding flag cleared');
  }, [onboardingCompleted, showStatus, onOnboardingToggle]);

  const handleDeleteAllMatrices = useCallback(async () => {
    if (
      !window.confirm('Delete ALL matrices from the database? Workspace folders will be preserved.')
    ) {
      return;
    }

    try {
      const response = await window.api.sendMessage({ type: 'matrix-list' });
      if (response.success && response.data) {
        const matrices = (response.data as { matrices: Matrix[] }).matrices || [];
        for (const matrix of matrices) {
          await window.api.sendMessage({ type: 'matrix-delete', data: { id: matrix.id } });
        }
        setMatrixCount(0);
        showStatus(`Deleted ${matrices.length} matrices`);
        onDataReset?.();
      }
    } catch {
      showStatus('Failed to delete matrices');
    }
  }, [showStatus, onDataReset]);

  const handleResetConfig = useCallback(async () => {
    if (
      !window.confirm(
        'Reset config to defaults? This will clear onboarding, agent settings, and preferences.'
      )
    ) {
      return;
    }

    try {
      await window.api.resetConfig();
      setOnboardingCompleted(false);
      onOnboardingToggle?.(false);
      showStatus('Config reset to defaults');
    } catch {
      showStatus('Failed to reset config');
    }
  }, [showStatus, onOnboardingToggle]);

  const handleCopyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 1500);
    } catch {
      // Clipboard not available
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">DevTools</h2>
          <p className="text-sm text-text-muted">Development utilities (dev mode only)</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-base-700 hover:text-text-primary"
          aria-label="Close DevTools"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-6">
          {/* Status toast */}
          {actionStatus && (
            <div className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-2.5 text-sm text-accent-cyan">
              {actionStatus}
            </div>
          )}

          {/* Onboarding Flag */}
          <ToolSection
            title="Onboarding Flag"
            description="Toggle whether onboarding has been completed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    onboardingCompleted
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-yellow-500/15 text-yellow-400'
                  )}
                >
                  {onboardingCompleted ? 'Completed' : 'Not completed'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleOnboarding}
                className="flex items-center gap-2 rounded-lg border border-border-default bg-base-800 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-base-700 hover:text-text-primary"
              >
                {onboardingCompleted ? (
                  <ToggleRight className="size-4 text-green-400" />
                ) : (
                  <ToggleLeft className="size-4 text-text-muted" />
                )}
                Toggle
              </button>
            </div>
          </ToolSection>

          {/* Danger Zone */}
          <ToolSection
            title="Danger Zone"
            description="Destructive actions for resetting app state"
            variant="danger"
          >
            <div className="space-y-3">
              <DangerAction
                label="Delete All Matrices"
                description={`Remove all ${matrixCount} matrices from the database (workspace folders preserved)`}
                buttonLabel={`Delete ${matrixCount} Matrices`}
                disabled={matrixCount === 0}
                icon={<Trash2 className="size-4" />}
                onClick={handleDeleteAllMatrices}
              />
              <div className="border-t border-red-500/20" />
              <DangerAction
                label="Reset Config"
                description="Clear all settings including onboarding, agents, and preferences"
                buttonLabel="Reset Config"
                icon={<RotateCcw className="size-4" />}
                onClick={handleResetConfig}
              />
            </div>
          </ToolSection>

          {/* Application Paths */}
          {paths && (
            <ToolSection
              title="Application Paths"
              description="File system locations used by the app"
            >
              <div className="space-y-3">
                <PathItem
                  label="Config"
                  path={paths.configPath}
                  copied={copiedPath === paths.configPath}
                  onCopy={() => handleCopyPath(paths.configPath)}
                />
                <PathItem
                  label="Database"
                  path={paths.dbPath}
                  copied={copiedPath === paths.dbPath}
                  onCopy={() => handleCopyPath(paths.dbPath)}
                />
                <PathItem
                  label="Workspace"
                  path={paths.workspacePath}
                  copied={copiedPath === paths.workspacePath}
                  onCopy={() => handleCopyPath(paths.workspacePath)}
                />
              </div>
            </ToolSection>
          )}
        </div>
      </div>
    </div>
  );
};

DevToolsModal.displayName = 'DevToolsModal';

// ── Sub-components ────────────────────────────────────────────────────

interface ToolSectionProps {
  title: string;
  description: string;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
}

const ToolSection: React.FC<ToolSectionProps> = ({
  title,
  description,
  variant = 'default',
  children,
}) => (
  <div
    className={cn(
      'rounded-lg border p-4',
      variant === 'danger' ? 'border-red-500/30 bg-red-500/5' : 'border-border-default bg-base-800'
    )}
  >
    <div className="mb-3">
      <h3
        className={cn(
          'text-sm font-medium',
          variant === 'danger' ? 'text-red-400' : 'text-text-primary'
        )}
      >
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-text-muted">{description}</p>
    </div>
    {children}
  </div>
);

interface DangerActionProps {
  label: string;
  description: string;
  buttonLabel: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

const DangerAction: React.FC<DangerActionProps> = ({
  label,
  description,
  buttonLabel,
  disabled = false,
  icon,
  onClick,
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <p className="text-xs text-text-muted">{description}</p>
    </div>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
        disabled
          ? 'cursor-not-allowed border-border-default bg-base-800 text-text-muted'
          : 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
      )}
    >
      {icon}
      {buttonLabel}
    </button>
  </div>
);

interface PathItemProps {
  label: string;
  path: string;
  copied: boolean;
  onCopy: () => void;
}

const PathItem: React.FC<PathItemProps> = ({ label, path, copied, onCopy }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0 flex-1">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <p className="truncate font-mono text-xs text-text-secondary">{path}</p>
    </div>
    <button
      type="button"
      onClick={onCopy}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-base-600 hover:text-text-primary"
      aria-label={`Copy ${label} path`}
    >
      {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
    </button>
  </div>
);
