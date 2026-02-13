import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import type { AgentConfig, AgentDetection, CommandCheckResult, Platform } from './types';
import { AGENT_CONFIGS } from './types';
import { PathInput } from './PathInput';
import { InlineTabs } from '../common/InlineTabs';
import { RunTerminal } from '../terminal/RunTerminal';

interface AgentDetectionStepProps {
  agents: Record<string, AgentDetection>;
  onAgentsChange: React.Dispatch<React.SetStateAction<Record<string, AgentDetection>>>;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const AgentDetectionStep: React.FC<AgentDetectionStepProps> = ({
  agents,
  onAgentsChange,
  onNext,
  onBack,
  onSkip,
}) => {
  const [isChecking, setIsChecking] = useState(false);

  const checkSingleAgent = useCallback(
    async (agentId: string) => {
      const config = AGENT_CONFIGS.find((c) => c.id === agentId);
      if (!config) return;

      try {
        const result: CommandCheckResult = await window.api.checkCommand(config.command);
        onAgentsChange((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            detected: result.exists,
            path: result.path,
            version: result.version,
          },
        }));
      } catch {
        // Ignore — keep current state
      }
    },
    [onAgentsChange]
  );

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

  // ── Agent Path Editing ──────────────────────────────────────────────

  const handleAgentPathChange = useCallback(
    (agentId: string, path: string | undefined) => {
      onAgentsChange((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          customPath: path,
          validationError: undefined,
        },
      }));
    },
    [onAgentsChange]
  );

  const validationCounterRef = useRef<Record<string, number>>({});

  const handleAgentValidate = useCallback(
    async (agentId: string, path: string) => {
      const counter = (validationCounterRef.current[agentId] ?? 0) + 1;
      validationCounterRef.current[agentId] = counter;

      onAgentsChange((prev) => ({
        ...prev,
        [agentId]: { ...prev[agentId], validating: true, validationError: undefined },
      }));

      try {
        const result = await window.api.validateExecutable(path);
        // Ignore stale results
        if (validationCounterRef.current[agentId] !== counter) return;

        onAgentsChange((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            validating: false,
            ...(result.valid
              ? { customPath: path, validationError: undefined }
              : { validationError: result.error ?? 'Invalid path' }),
            ...(result.valid && result.version ? { version: result.version } : {}),
          },
        }));
      } catch {
        if (validationCounterRef.current[agentId] !== counter) return;
        onAgentsChange((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            validating: false,
            validationError: 'Validation failed',
          },
        }));
      }
    },
    [onAgentsChange]
  );

  useEffect(() => {
    checkAgents();
  }, [checkAgents]);

  return (
    <div className="my-auto flex w-full max-w-xl flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary">Agent</h2>
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
            onPathChange={handleAgentPathChange}
            onValidate={handleAgentValidate}
            onInstallSuccess={() => checkSingleAgent(config.id)}
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
            onClick={onNext}
            className="rounded-lg bg-accent-cyan px-5 py-2.5 text-sm font-medium text-base-900 transition-colors hover:bg-accent-cyan/90"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

AgentDetectionStep.displayName = 'AgentDetectionStep';

// ── Platform Detection ────────────────────────────────────────────────────

function detectPlatform(): Platform {
  const p = navigator.platform.toLowerCase();
  if (p.startsWith('mac')) return 'mac';
  if (p.startsWith('win')) return 'windows';
  return 'linux';
}

// ── Agent Card ────────────────────────────────────────────────────────────

interface AgentCardProps {
  config: AgentConfig;
  state: AgentDetection;
  isChecking: boolean;
  onPathChange: (agentId: string, path: string | undefined) => void;
  onValidate: (agentId: string, path: string) => void;
  onInstallSuccess: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  config,
  state,
  isChecking,
  onPathChange,
  onValidate,
  onInstallSuccess,
}) => {
  const [showPathInput, setShowPathInput] = useState(false);
  const platform = useMemo(detectPlatform, []);

  // Reset manual path input toggle when agent becomes detected
  useEffect(() => {
    if (state.detected) setShowPathInput(false);
  }, [state.detected]);

  const installTabs = useMemo(
    () =>
      config.installMethods
        .filter((m) => m.platform.includes(platform))
        .map((m) => ({
          label: m.label,
          content: <RunTerminal command={m.command} maxLines={5} onSuccess={onInstallSuccess} />,
        })),
    [config.installMethods, platform, onInstallSuccess]
  );

  const notFound = !isChecking && !state.detected;
  const showInstall = notFound && installTabs.length > 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{config.name}</span>
          {state.version && <span className="text-xs text-text-muted">v{state.version}</span>}
        </div>

        <div className="flex items-center gap-3">
          {isChecking ? (
            <Loader2 className="size-5 animate-spin text-text-muted" />
          ) : state.detected ? (
            <div className="flex items-center gap-1.5 text-accent-lime">
              <CheckCircle2 className="size-4" />
              <span className="text-xs font-medium">Installed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400">
              <XCircle className="size-4" />
              <span className="text-xs font-medium">Not found</span>
            </div>
          )}
        </div>
      </div>

      {showInstall && <InlineTabs tabs={installTabs} className="mt-3" />}

      {notFound && !showPathInput && (
        <button
          type="button"
          onClick={() => setShowPathInput(true)}
          className="mt-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          Already installed?
        </button>
      )}

      {(state.detected || showPathInput) && (
        <PathInput
          detectedPath={state.path}
          customPath={state.customPath}
          validating={state.validating}
          validationError={state.validationError}
          onPathChange={(path) => onPathChange(config.id, path)}
          onValidate={(path) => onValidate(config.id, path)}
        />
      )}
    </div>
  );
};
