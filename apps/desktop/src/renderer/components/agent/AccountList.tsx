import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Info, Shield, CheckCircle2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentAccount } from './types';
import { AGENT_META, createAccount } from './types';
import type { AgentConfig } from '../onboarding/types';
import { AGENT_CONFIGS } from '../onboarding/types';
import { AccountCard } from './AccountCard';
import { CommandTerminal } from '../terminal/CommandTerminal';

interface AccountListProps {
  accounts: AgentAccount[];
  onAccountsChange: React.Dispatch<React.SetStateAction<AgentAccount[]>>;
}

export const AccountList: React.FC<AccountListProps> = ({ accounts, onAccountsChange }) => {
  // ── Auto-detect existing CLI auth on mount ──────────────────────────
  const autoDetectedRef = useRef(false);

  useEffect(() => {
    if (autoDetectedRef.current) return;
    autoDetectedRef.current = true;

    AGENT_CONFIGS.forEach((cfg) => {
      if (!cfg.authCommand) return;
      window.api.checkAgentAuth(cfg.id).then(({ authenticated }) => {
        if (!authenticated) return;
        onAccountsChange((prev) => {
          if (prev.some((a) => a.agentId === cfg.id && a.type === 'cli')) return prev;
          return [...prev, createAccount(cfg.id, 'cli', 'Default', { authenticated: true })];
        });
      });
    });
  }, [onAccountsChange]);

  // ── Add flow state ──────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addAgentId, setAddAgentId] = useState(AGENT_CONFIGS[0].id);
  const [addType, setAddType] = useState<'api-key' | 'cli'>(
    AGENT_CONFIGS[0].authCommand ? 'cli' : 'api-key'
  );
  const [addApiKey, setAddApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showCliTerminal, setShowCliTerminal] = useState(false);
  const [cliAuthDone, setCliAuthDone] = useState(false);

  const selectedConfig = AGENT_CONFIGS.find((c) => c.id === addAgentId) as AgentConfig;
  const cliAlreadyExists = accounts.some((a) => a.agentId === addAgentId && a.type === 'cli');
  const hasCli = !!selectedConfig?.authCommand && !cliAlreadyExists;

  const resetAddForm = () => {
    setAddLabel('');
    setAddApiKey('');
    setShowKey(false);
    setShowCliTerminal(false);
    setCliAuthDone(false);
    setAddType(hasCli ? 'cli' : 'api-key');
  };

  const handleRemove = (id: string) => {
    onAccountsChange((prev) => prev.filter((a) => a.id !== id));
  };

  // ── API Key add ─────────────────────────────────────────────────────
  const handleAddApiKey = () => {
    if (!addApiKey.trim()) return;
    const label = addLabel.trim() || 'Default';
    onAccountsChange((prev) => [
      ...prev,
      createAccount(addAgentId, 'api-key', label, {
        apiKey: addApiKey.trim(),
        authenticated: true,
      }),
    ]);
    resetAddForm();
    setShowAdd(false);
  };

  const handleApiKeyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddApiKey();
  };

  // ── CLI auth ────────────────────────────────────────────────────────
  const successPatternRef = useRef<RegExp | null>(null);

  useEffect(() => {
    successPatternRef.current = selectedConfig?.authSuccessPattern
      ? new RegExp(selectedConfig.authSuccessPattern, 'i')
      : null;
  }, [selectedConfig]);

  const markCliAuthenticated = useCallback(() => {
    setCliAuthDone(true);
    setShowCliTerminal(false);
    const label = addLabel.trim() || 'Default';
    onAccountsChange((prev) => [
      ...prev,
      createAccount(addAgentId, 'cli', label, { authenticated: true }),
    ]);
    resetAddForm();
    setShowAdd(false);
  }, [addAgentId, addLabel, onAccountsChange]);

  const handleCliOutput = useCallback(
    (data: string) => {
      if (cliAuthDone || !successPatternRef.current) return;
      if (successPatternRef.current.test(data)) {
        markCliAuthenticated();
      }
    },
    [cliAuthDone, markCliAuthenticated]
  );

  const handleCliExit = (exitCode: number) => {
    if (exitCode === 0 && !cliAuthDone) {
      markCliAuthenticated();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Info Banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 px-3.5 py-3">
        <Info className="mt-0.5 size-4 flex-shrink-0 text-accent-cyan" />
        <p className="text-xs leading-relaxed text-text-secondary">
          Add multiple accounts to seamlessly switch when you hit rate limits. The first account in
          the list is used by default.
        </p>
      </div>

      {/* Secure Storage Notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-base-800 px-3.5 py-3">
        <Shield className="mt-0.5 size-4 flex-shrink-0 text-text-muted" />
        <p className="text-xs leading-relaxed text-text-muted">
          Credentials are stored locally on your machine and never sent to our servers.
        </p>
      </div>

      {/* Account cards (flat list) */}
      {accounts.length > 0 && (
        <div className="flex flex-col gap-2">
          {accounts.map((account, idx) => (
            <AccountCard
              key={account.id}
              account={account}
              isDefault={idx === 0}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Add Account Section */}
      {!showAdd && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border-default py-3 text-sm text-text-muted transition-colors hover:border-accent-cyan/40 hover:bg-accent-cyan/5 hover:text-text-secondary"
        >
          <Plus className="size-4" />
          Add Account
        </button>
      )}

      {showAdd && (
        <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 animate-slide-in">
          <div className="flex flex-col gap-3">
            {/* Row 1: Label + Agent selector */}
            <div className="flex gap-2">
              <input
                type="text"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="e.g., Work, Personal"
                className="flex-1 rounded-lg border border-border-default bg-base-800 px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-cyan/50"
              />
              <div className="relative">
                <select
                  value={addAgentId}
                  onChange={(e) => {
                    setAddAgentId(e.target.value);
                    setShowCliTerminal(false);
                    setCliAuthDone(false);
                    // Default to CLI if available, otherwise api-key
                    const cfg = AGENT_CONFIGS.find((c) => c.id === e.target.value);
                    const alreadyHasCli = accounts.some(
                      (a) => a.agentId === e.target.value && a.type === 'cli'
                    );
                    const cliAvailable = !!cfg?.authCommand && !alreadyHasCli;
                    setAddType(cliAvailable ? 'cli' : 'api-key');
                  }}
                  className="appearance-none rounded-lg border border-border-default bg-base-800 py-2 pl-3 pr-8 text-xs text-text-primary outline-none transition-colors focus:border-accent-cyan/50"
                >
                  {AGENT_CONFIGS.map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
              </div>
            </div>

            {/* Row 2: Auth type toggle (only when both options exist) */}
            {hasCli && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddType('cli')}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-medium transition-colors',
                    addType === 'cli'
                      ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                      : 'border-border-default text-text-muted hover:text-text-secondary'
                  )}
                >
                  CLI Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddType('api-key');
                    setShowCliTerminal(false);
                  }}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-medium transition-colors',
                    addType === 'api-key'
                      ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                      : 'border-border-default text-text-muted hover:text-text-secondary'
                  )}
                >
                  API Key
                </button>
              </div>
            )}

            {/* Row 3: API Key input OR CLI terminal */}
            {addType === 'api-key' ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={addApiKey}
                    onChange={(e) => setAddApiKey(e.target.value)}
                    onKeyDown={handleApiKeyKeyDown}
                    placeholder={AGENT_META[addAgentId]?.envVar ?? 'API Key'}
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
                <button
                  type="button"
                  onClick={handleAddApiKey}
                  disabled={!addApiKey.trim()}
                  className="rounded-lg bg-accent-cyan px-4 py-2 text-xs font-medium text-base-900 transition-colors hover:bg-accent-cyan/90 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {cliAuthDone ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-accent-lime/30 bg-accent-lime/5 py-2.5 text-sm text-accent-lime">
                    <CheckCircle2 className="size-4" />
                    Authenticated via CLI
                  </div>
                ) : !showCliTerminal ? (
                  <button
                    type="button"
                    onClick={() => setShowCliTerminal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-default py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent-cyan/30 hover:bg-accent-cyan/5 hover:text-text-primary"
                  >
                    Start {selectedConfig.name} Login
                  </button>
                ) : (
                  <div className="h-52 overflow-hidden rounded-lg border border-border-subtle">
                    <CommandTerminal
                      initialCommand={selectedConfig.authCommand}
                      onExit={handleCliExit}
                      onOutput={handleCliOutput}
                      className="h-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Cancel */}
            <button
              type="button"
              onClick={() => {
                resetAddForm();
                setShowAdd(false);
              }}
              className="self-end text-xs text-text-muted transition-colors hover:text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-accent-lime/20 bg-accent-lime/5 px-3.5 py-2.5">
          <CheckCircle2 className="size-4 flex-shrink-0 text-accent-lime" />
          <p className="text-xs text-accent-lime">
            {accounts.length} account{accounts.length > 1 ? 's' : ''} configured
          </p>
        </div>
      )}
    </div>
  );
};

AccountList.displayName = 'AccountList';
