import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { AgentState, ToolState } from './types';
import { createInitialAgentStates, createInitialToolStates } from './types';
import { WelcomeStep } from './WelcomeStep';
import { ToolCheckStep } from './ToolCheckStep';
import { AgentDetectionStep } from './AgentDetectionStep';
import { AgentAuthStep } from './AgentAuthStep';

/**
 * Onboarding step order:
 *   0 = Welcome
 *   1 = Tools (dev tools + terminal + IDE selection)
 *   2 = Agent Detection
 *   3 = Agent Authentication
 */
const TOTAL_STEPS = 3; // Steps after welcome

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [agents, setAgents] = useState<Record<string, AgentState>>(createInitialAgentStates);
  const [tools, setTools] = useState<Record<string, ToolState>>(createInitialToolStates);
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
  const [selectedIDE, setSelectedIDE] = useState<string | null>(null);

  /**
   * Save config and finish onboarding
   */
  const finishOnboarding = useCallback(
    async (skipped: boolean) => {
      try {
        const config: Record<string, unknown> = {
          onboarding_completed: true,
          onboarding_skipped: skipped,
          onboarding_completed_at: new Date().toISOString(),
        };

        if (!skipped) {
          // Save agent config
          const agentConfig: Record<string, unknown> = {};
          for (const [id, state] of Object.entries(agents)) {
            agentConfig[id] = {
              detected: state.detected,
              auth_method: state.authMethod,
              ...(state.apiKey ? { api_key: state.apiKey } : {}),
              ...(state.path ? { cli_path: state.path } : {}),
            };
          }
          config.agents = agentConfig;

          // Save tool info
          const toolConfig: Record<string, unknown> = {};
          for (const [id, state] of Object.entries(tools)) {
            toolConfig[id] = {
              installed: state.installed,
              ...(state.version ? { version: state.version } : {}),
            };
          }
          config.tools = toolConfig;

          // Save terminal and IDE preferences
          if (selectedTerminal) {
            config.default_terminal = selectedTerminal;
          }
          if (selectedIDE) {
            config.default_ide = selectedIDE;
          }
        }

        await window.api.writeConfig(config);
      } catch {
        // Best-effort save; proceed even on failure
      }

      onComplete();
    },
    [agents, tools, selectedTerminal, selectedIDE, onComplete]
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
      <div className="flex flex-1 items-center justify-center overflow-auto px-6 pb-8">
        {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}

        {step === 1 && (
          <ToolCheckStep
            tools={tools}
            onToolsChange={setTools}
            selectedTerminal={selectedTerminal}
            onTerminalChange={setSelectedTerminal}
            selectedIDE={selectedIDE}
            onIDEChange={setSelectedIDE}
            onNext={() => setStep(2)}
            onSkip={handleSkip}
          />
        )}

        {step === 2 && (
          <AgentDetectionStep
            agents={agents}
            onAgentsChange={setAgents}
            onNext={() => setStep(3)}
            onSkip={handleSkip}
          />
        )}

        {step === 3 && (
          <AgentAuthStep
            agents={agents}
            onAgentsChange={setAgents}
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
