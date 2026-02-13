import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type { AgentAccount } from './types';
import { AGENT_META } from './types';

interface AccountCardProps {
  account: AgentAccount;
  isDefault: boolean;
  onRemove: (id: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, isDefault, onRemove }) => {
  const meta = AGENT_META[account.agentId];
  const initial = meta?.initial ?? account.agentId[0].toUpperCase();
  const agentName = meta?.name ?? account.agentId;

  const maskedKey =
    account.apiKey && account.apiKey.length > 8
      ? `${account.apiKey.slice(0, 4)}..${account.apiKey.slice(-4)}`
      : account.apiKey;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3">
      {/* Agent initial avatar */}
      <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-base-700 text-sm font-semibold text-text-primary">
        {initial}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{account.label}</span>
          <span className="rounded bg-base-700 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
            {agentName}
          </span>
          {isDefault && (
            <span className="rounded bg-accent-cyan/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-cyan">
              Default
            </span>
          )}
          {account.authenticated && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-accent-lime">
              <CheckCircle2 className="size-3" />
              Authenticated
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {account.type === 'api-key' ? (
            <code className="font-mono">{maskedKey}</code>
          ) : (
            'CLI Login'
          )}
        </span>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(account.id)}
        className="flex-shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-base-700 hover:text-text-secondary"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
};

AccountCard.displayName = 'AccountCard';
