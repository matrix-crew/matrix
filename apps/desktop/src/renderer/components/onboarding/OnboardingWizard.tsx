import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { AgentDetection, ToolState, TerminalInfo, IDEInfo } from './types';
import {
  createInitialAgentStates,
  createInitialToolStates,
  TOOL_CONFIGS,
  AGENT_CONFIGS,
} from './types';
import type { AgentAccount } from '../agent/types';
import { WelcomeStep } from './WelcomeStep';
import { ToolCheckStep } from './ToolCheckStep';
import { AgentDetectionStep } from './AgentDetectionStep';
import { AgentAuthStep } from './AgentAuthStep';

/**
 * Onboarding step order:
 *   0 = Welcome
 *   1 = Agent
 *   2 = Agent Authentication
 *   3 = Tools (dev tools + terminal + IDE selection)
 */
const TOTAL_STEPS = 3; // Steps after welcome

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [agents, setAgents] = useState<Record<string, AgentDetection>>(createInitialAgentStates);
  const [accounts, setAccounts] = useState<AgentAccount[]>([]);
  const [tools, setTools] = useState<Record<string, ToolState>>(createInitialToolStates);
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
  const [selectedIDE, setSelectedIDE] = useState<string | null>(null);

  /**
   * Save config and finish onboarding.
   * When skipping, run fresh detection for all tools/agents/terminals/IDEs
   * so that system defaults are always persisted to .matrix.json.
   */
  const finishOnboarding = useCallback(
    async (skipped: boolean) => {
      try {
        const config: Record<string, unknown> = {
          onboarding_completed: true,
          onboarding_skipped: skipped,
          onboarding_completed_at: new Date().toISOString(),
        };

        if (skipped) {
          // Run all detection fresh — steps may not have mounted yet
          const [toolConfig, agentDetections, detectedTerminals, detectedIDEs] = await Promise.all([
            detectAllTools(),
            detectAllAgentDetections(),
            window.api.detectTerminals().catch((): TerminalInfo[] => []),
            window.api.detectIDEs().catch((): IDEInfo[] => []),
          ]);

          config.tools = toolConfig;
          config.agent_detections = agentDetections;
          config.accounts = [];

          const defaultTerminal = detectedTerminals.find((t) => t.isDefault);
          const terminalId = defaultTerminal?.id ?? detectedTerminals[0]?.id;
          if (terminalId) config.default_terminal = terminalId;

          if (detectedIDEs.length > 0) config.default_ide = detectedIDEs[0].id;
        } else {
          // Agent detection info
          const agentDetections: Record<string, unknown> = {};
          for (const [id, det] of Object.entries(agents)) {
            const cliPath = det.customPath || det.path;
            agentDetections[id] = {
              detected: det.detected,
              ...(cliPath ? { cli_path: cliPath } : {}),
            };
          }
          config.agent_detections = agentDetections;

          // Accounts (array order = priority)
          config.accounts = accounts.map((a) => ({
            id: a.id,
            agent_id: a.agentId,
            type: a.type,
            label: a.label,
            ...(a.apiKey ? { api_key: a.apiKey } : {}),
            authenticated: a.authenticated,
          }));

          // Tools
          const toolConfig: Record<string, unknown> = {};
          for (const [id, state] of Object.entries(tools)) {
            const toolPath = state.customPath || state.path;
            toolConfig[id] = {
              installed: state.installed,
              ...(state.version ? { version: state.version } : {}),
              ...(toolPath ? { path: toolPath } : {}),
            };
          }
          config.tools = toolConfig;

          if (selectedTerminal) config.default_terminal = selectedTerminal;
          if (selectedIDE) config.default_ide = selectedIDE;
        }

        await window.api.writeConfig(config);
      } catch {
        // Best-effort save; proceed even on failure
      }

      onComplete();
    },
    [agents, accounts, tools, selectedTerminal, selectedIDE, onComplete]
  );

  const handleSkip = useCallback(() => finishOnboarding(true), [finishOnboarding]);
  const handleComplete = useCallback(() => finishOnboarding(false), [finishOnboarding]);

  return (
    <div className="flex h-screen w-full flex-col bg-base-900">
      {/* macOS drag region */}
      <div className="h-8 flex-shrink-0 drag-region" />

      {/* Step indicator (hidden on welcome) */}
      {step > 0 && (
        <div className="flex items-center justify-center gap-3 pb-4">
          <span className="text-xs text-text-muted">
            Step {step} of {TOTAL_STEPS}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 w-8 rounded-full transition-colors',
                  i < step ? 'bg-accent-cyan' : 'bg-base-600'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex flex-1 justify-center overflow-auto px-6 py-8">
        {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}

        {step === 1 && (
          <AgentDetectionStep
            agents={agents}
            onAgentsChange={setAgents}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
            onSkip={handleSkip}
          />
        )}

        {step === 2 && (
          <AgentAuthStep
            accounts={accounts}
            onAccountsChange={setAccounts}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            onSkip={handleSkip}
          />
        )}

        {step === 3 && (
          <ToolCheckStep
            tools={tools}
            onToolsChange={setTools}
            selectedTerminal={selectedTerminal}
            onTerminalChange={setSelectedTerminal}
            selectedIDE={selectedIDE}
            onIDEChange={setSelectedIDE}
            onNext={handleComplete}
            onBack={() => setStep(2)}
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  );
};

OnboardingWizard.displayName = 'OnboardingWizard';

// ── Detection helpers (used by skip flow) ──────────────────────────────────

async function detectAllTools(): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  await Promise.all(
    TOOL_CONFIGS.map(async (cfg) => {
      try {
        let r = await window.api.checkCommand(cfg.command);
        if (!r.exists && cfg.fallbackCommand) {
          r = await window.api.checkCommand(cfg.fallbackCommand);
        }
        results[cfg.id] = {
          installed: r.exists,
          ...(r.version ? { version: r.version } : {}),
          ...(r.path ? { path: r.path } : {}),
        };
      } catch {
        results[cfg.id] = { installed: false };
      }
    })
  );
  return results;
}

async function detectAllAgentDetections(): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  await Promise.all(
    AGENT_CONFIGS.map(async (cfg) => {
      try {
        const r = await window.api.checkCommand(cfg.command);
        results[cfg.id] = {
          detected: r.exists,
          ...(r.path ? { cli_path: r.path } : {}),
        };
      } catch {
        results[cfg.id] = { detected: false };
      }
    })
  );
  return results;
}
