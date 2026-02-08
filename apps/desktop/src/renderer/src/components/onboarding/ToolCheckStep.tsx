import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@maxtix/ui';
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import type { ToolConfig, ToolState, CommandCheckResult } from './types';
import { TOOL_CONFIGS } from './types';

interface ToolCheckStepProps {
  tools: Record<string, ToolState>;
  onToolsChange: React.Dispatch<React.SetStateAction<Record<string, ToolState>>>;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const ToolCheckStep: React.FC<ToolCheckStepProps> = ({
  tools,
  onToolsChange,
  onComplete,
  onBack,
  onSkip,
}) => {
  const [isChecking, setIsChecking] = useState(false);

  const checkTools = useCallback(async () => {
    setIsChecking(true);

    // Build fresh state from detection results, preserving user-entered data
    const results = await Promise.all(
      TOOL_CONFIGS.map(async (config) => {
        try {
          let result: CommandCheckResult = await window.api.checkCommand(config.command);

          // Fallback: try alternative command (e.g., 'python' if 'python3' not found)
          if (!result.exists && config.fallbackCommand) {
            result = await window.api.checkCommand(config.fallbackCommand);
          }

          return {
            id: config.id,
            installed: result.exists,
            version: result.version,
            path: result.path,
          };
        } catch {
          return { id: config.id, installed: false };
        }
      })
    );

    // Use functional update to avoid stale closure
    onToolsChange((prev) => {
      const updated = { ...prev };
      for (const r of results) {
        updated[r.id] = {
          ...updated[r.id],
          installed: r.installed,
          version: r.version,
          path: r.path,
        };
      }
      return updated;
    });

    setIsChecking(false);
  }, [onToolsChange]);

  useEffect(() => {
    checkTools();
  }, [checkTools]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary">Development Tools</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Checking required development tools on your system
        </p>
      </div>

      {/* Tool cards */}
      <div className="flex flex-col gap-3">
        {TOOL_CONFIGS.map((config) => (
          <ToolCard
            key={config.id}
            config={config}
            state={tools[config.id]}
            isChecking={isChecking}
          />
        ))}
      </div>

      {/* Re-check button */}
      <button
        type="button"
        onClick={checkTools}
        disabled={isChecking}
        className="flex items-center gap-2 self-center text-xs text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
      >
        <RefreshCw className={cn('size-3', isChecking && 'animate-spin')} />
        Re-check
      </button>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          Skip for now
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="rounded-lg bg-accent-cyan px-5 py-2.5 text-sm font-medium text-base-900 transition-colors hover:bg-accent-cyan/90"
          >
            Complete Setup
          </button>
        </div>
      </div>
    </div>
  );
};

ToolCheckStep.displayName = 'ToolCheckStep';

// ── Tool Card ─────────────────────────────────────────────────────────────

interface ToolCardProps {
  config: ToolConfig;
  state: ToolState;
  isChecking: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ config, state, isChecking }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{config.name}</span>
          {state.version && <span className="text-xs text-text-muted">v{state.version}</span>}
        </div>
        <span className="text-xs text-text-muted">{config.description}</span>
        {state.installed && state.path && (
          <span className="font-mono text-xs text-text-muted">{state.path}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isChecking ? (
          <Loader2 className="size-5 animate-spin text-text-muted" />
        ) : state.installed ? (
          <div className="flex items-center gap-1.5 text-accent-lime">
            <CheckCircle2 className="size-4" />
            <span className="text-xs font-medium">Installed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-amber-400">
              <XCircle className="size-4" />
              <span className="text-xs font-medium">Not found</span>
            </div>
            <button
              type="button"
              onClick={() => window.api.openExternal(config.installUrl)}
              className="flex items-center gap-1 text-xs text-accent-cyan transition-colors hover:text-accent-cyan/80"
            >
              Install
              <ExternalLink className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
