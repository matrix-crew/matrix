import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import type { AgentConfig, AgentState, CommandCheckResult } from './types';
import { AGENT_CONFIGS } from './types';

interface AgentDetectionStepProps {
  agents: Record<string, AgentState>;
  onAgentsChange: React.Dispatch<React.SetStateAction<Record<string, AgentState>>>;
  onNext: () => void;
  onSkip: () => void;
}

export const AgentDetectionStep: React.FC<AgentDetectionStepProps> = ({
  agents,
  onAgentsChange,
  onNext,
  onSkip,
}) => {
  const [isChecking, setIsChecking] = useState(false);

  const checkAgents = useCallback(async () => {
    setIsChecking(true);

    // Build fresh state from detection results, preserving user-entered data
    const results = await Promise.all(
      AGENT_CONFIGS.map(async (config) => {
        try {
          const result: CommandCheckResult = await window.api.checkCommand(config.command);
          return {
            id: config.id,
            detected: result.exists,
            path: result.path,
            version: result.version,
          };
        } catch {
          return { id: config.id, detected: false };
        }
      })
    );

    // Use functional update to avoid stale closure
    onAgentsChange((prev) => {
      const updated = { ...prev };
      for (const r of results) {
        updated[r.id] = {
          ...updated[r.id],
          detected: r.detected,
          path: r.path,
          version: r.version,
        };
      }
      return updated;
    });

    setIsChecking(false);
  }, [onAgentsChange]);

  useEffect(() => {
    checkAgents();
  }, [checkAgents]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary">Agent Detection</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Checking which AI coding agents are installed on your system
        </p>
      </div>

      {/* Agent cards */}
      <div className="flex flex-col gap-3">
        {AGENT_CONFIGS.map((config) => (
          <AgentCard
            key={config.id}
            config={config}
            state={agents[config.id]}
            isChecking={isChecking}
          />
        ))}
      </div>

      {/* Re-check button */}
      <button
        type="button"
        onClick={checkAgents}
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
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-accent-cyan px-5 py-2.5 text-sm font-medium text-base-900 transition-colors hover:bg-accent-cyan/90"
        >
          Next
        </button>
      </div>
    </div>
  );
};

AgentDetectionStep.displayName = 'AgentDetectionStep';

// ── Agent Card ────────────────────────────────────────────────────────────

interface AgentCardProps {
  config: AgentConfig;
  state: AgentState;
  isChecking: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ config, state, isChecking }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{config.name}</span>
          {state.version && <span className="text-xs text-text-muted">v{state.version}</span>}
        </div>
        <span className="text-xs text-text-muted">{config.description}</span>
        {state.detected && state.path && (
          <span className="font-mono text-xs text-text-muted">{state.path}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isChecking ? (
          <Loader2 className="size-5 animate-spin text-text-muted" />
        ) : state.detected ? (
          <div className="flex items-center gap-1.5 text-accent-lime">
            <CheckCircle2 className="size-4" />
            <span className="text-xs font-medium">Detected</span>
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
