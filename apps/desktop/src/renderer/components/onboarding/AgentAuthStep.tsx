import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentConfig, AgentState } from './types';
import { AGENT_CONFIGS } from './types';

interface AgentAuthStepProps {
  agents: Record<string, AgentState>;
  onAgentsChange: (agents: Record<string, AgentState>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const AgentAuthStep: React.FC<AgentAuthStepProps> = ({
  agents,
  onAgentsChange,
  onNext,
  onBack,
  onSkip,
}) => {
  const handleApiKeyChange = (agentId: string, apiKey: string) => {
    onAgentsChange({
      ...agents,
      [agentId]: {
        ...agents[agentId],
        apiKey,
        authMethod: apiKey ? 'api-key' : null,
      },
    });
  };

  const handleAuthMethodChange = (agentId: string, method: 'cli' | 'api-key') => {
    onAgentsChange({
      ...agents,
      [agentId]: {
        ...agents[agentId],
        authMethod: method,
      },
    });
  };

  return (
    <div className="my-auto flex w-full max-w-xl flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary">Authentication</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Configure API keys or use CLI authentication for your agents
        </p>
      </div>

      {/* Agent auth cards */}
      <div className="flex flex-col gap-4">
        {AGENT_CONFIGS.map((config) => (
          <AgentAuthCard
            key={config.id}
            config={config}
            state={agents[config.id]}
            onApiKeyChange={(key) => handleApiKeyChange(config.id, key)}
            onAuthMethodChange={(method) => handleAuthMethodChange(config.id, method)}
          />
        ))}
      </div>

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

AgentAuthStep.displayName = 'AgentAuthStep';

// ── Agent Auth Card ───────────────────────────────────────────────────────

interface AgentAuthCardProps {
  config: AgentConfig;
  state: AgentState;
  onApiKeyChange: (key: string) => void;
  onAuthMethodChange: (method: 'cli' | 'api-key') => void;
}

const AgentAuthCard: React.FC<AgentAuthCardProps> = ({
  config,
  state,
  onApiKeyChange,
  onAuthMethodChange,
}) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
      {/* Agent header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{config.name}</span>
        <span className={cn('text-xs', state.detected ? 'text-accent-lime' : 'text-text-muted')}>
          {state.detected ? 'CLI installed' : 'CLI not installed'}
        </span>
      </div>

      {/* API Key input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary">API Key</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={state.apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              onFocus={() => onAuthMethodChange('api-key')}
              placeholder={config.envVar}
              className="w-full rounded-lg border border-border-default bg-base-800 px-3 py-2 pr-9 font-mono text-xs text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-cyan/50"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
            >
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-text-muted">
          Environment variable:{' '}
          <code className="font-mono text-text-secondary">{config.envVar}</code>
        </p>
      </div>

      {/* TODO: Add inline PTY terminal for interactive CLI auth (e.g. claude auth login) */}
    </div>
  );
};
