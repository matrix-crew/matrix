import React from 'react';
import type { AgentAccount } from '../agent/types';
import { AccountList } from '../agent/AccountList';

interface AgentAuthStepProps {
  accounts: AgentAccount[];
  onAccountsChange: React.Dispatch<React.SetStateAction<AgentAccount[]>>;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const AgentAuthStep: React.FC<AgentAuthStepProps> = ({
  accounts,
  onAccountsChange,
  onNext,
  onBack,
  onSkip,
}) => {
  return (
    <div className="my-auto flex w-full max-w-xl flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary">Authentication</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Add accounts for your AI agents — API keys or CLI login
        </p>
      </div>

      {/* Account list (shared component) */}
      <AccountList accounts={accounts} onAccountsChange={onAccountsChange} />

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
