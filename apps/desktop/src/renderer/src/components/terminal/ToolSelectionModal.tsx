/**
 * ToolSelectionModal Component
 *
 * Modal dialog for selecting a shell when creating a new terminal session.
 * Loads detected shells from the app config and allows the user to pick one.
 */

import * as React from 'react';
import { cn } from '@maxtix/ui';
import { Terminal, X } from 'lucide-react';
import type { DetectedShell } from '@maxtix/shared';

export interface ToolSelectionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when user cancels */
  onClose: () => void;
  /** Called when user confirms selection */
  onConfirm: (selection: { shell: string; name: string; cwd?: string }) => void;
}

/**
 * Shell selection modal for creating new terminal sessions
 */
const ToolSelectionModal: React.FC<ToolSelectionModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [shells, setShells] = React.useState<DetectedShell[]>([]);
  const [selectedShell, setSelectedShell] = React.useState<DetectedShell | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  /**
   * Load detected terminals from config on mount
   */
  React.useEffect(() => {
    if (!isOpen) return;

    async function loadShells() {
      setIsLoading(true);
      try {
        // First try to get from config (onboarding results)
        const config = await window.api.readConfig();
        const configShells = config.detected_terminals as DetectedShell[] | undefined;

        if (configShells && configShells.length > 0) {
          setShells(configShells);
          setSelectedShell(configShells.find((s) => s.isDefault) || configShells[0]);
        } else {
          // Fallback: detect terminals now
          const detected = await window.api.detectTerminals();
          const mapped: DetectedShell[] = detected.map((t) => ({
            id: t.id,
            name: t.name,
            path: t.path,
            isDefault: t.isDefault,
          }));

          if (mapped.length > 0) {
            setShells(mapped);
            setSelectedShell(mapped.find((s) => s.isDefault) || mapped[0]);
          } else {
            // Ultimate fallback: provide basic shell options
            const fallbackShells: DetectedShell[] = [
              { id: 'default', name: 'Default Shell', path: '', isDefault: true },
            ];
            setShells(fallbackShells);
            setSelectedShell(fallbackShells[0]);
          }
        }
      } catch {
        // Provide fallback if detection fails
        const fallbackShells: DetectedShell[] = [
          { id: 'default', name: 'Default Shell', path: '', isDefault: true },
        ];
        setShells(fallbackShells);
        setSelectedShell(fallbackShells[0]);
      } finally {
        setIsLoading(false);
      }
    }

    loadShells();
  }, [isOpen]);

  /**
   * Handle keyboard events
   */
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && selectedShell) {
        onConfirm({
          shell: selectedShell.path,
          name: selectedShell.name,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, selectedShell]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Select terminal shell"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-in rounded-lg border border-border-default bg-base-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-accent-lime" />
            <h2 className="text-sm font-semibold text-text-primary">New Terminal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:bg-base-700 hover:text-text-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-sm text-text-muted">Detecting shells...</span>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-text-secondary">
                Select a shell for the terminal session:
              </p>
              <div className="space-y-1">
                {shells.map((shell) => (
                  <button
                    key={shell.id}
                    type="button"
                    onClick={() => setSelectedShell(shell)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      selectedShell?.id === shell.id
                        ? 'bg-accent-lime/10 text-accent-lime'
                        : 'text-text-secondary hover:bg-base-700 hover:text-text-primary'
                    )}
                  >
                    <Terminal className="size-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{shell.name}</div>
                      {shell.path && (
                        <div className="truncate text-xs text-text-muted">{shell.path}</div>
                      )}
                    </div>
                    {shell.isDefault && (
                      <span className="flex-shrink-0 rounded-full bg-accent-lime/20 px-2 py-0.5 text-[10px] font-medium text-accent-lime">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border-default px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-base-700 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedShell) {
                onConfirm({
                  shell: selectedShell.path,
                  name: selectedShell.name,
                });
              }
            }}
            disabled={!selectedShell || isLoading}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              selectedShell && !isLoading
                ? 'bg-accent-lime text-base-900 hover:bg-accent-lime/90'
                : 'cursor-not-allowed bg-base-600 text-text-muted'
            )}
          >
            Create Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

ToolSelectionModal.displayName = 'ToolSelectionModal';

export { ToolSelectionModal };
