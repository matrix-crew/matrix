import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Monitor,
  Code2,
  ChevronDown,
} from 'lucide-react';
import type { ToolConfig, ToolState, TerminalInfo, IDEInfo, CommandCheckResult } from './types';
import { TOOL_CONFIGS } from './types';
import { PathInput } from './PathInput';

interface ToolCheckStepProps {
  tools: Record<string, ToolState>;
  onToolsChange: React.Dispatch<React.SetStateAction<Record<string, ToolState>>>;
  selectedTerminal: string | null;
  onTerminalChange: (terminalId: string) => void;
  selectedIDE: string | null;
  onIDEChange: (ide: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const ToolCheckStep: React.FC<ToolCheckStepProps> = ({
  tools,
  onToolsChange,
  selectedTerminal,
  onTerminalChange,
  selectedIDE,
  onIDEChange,
  onNext,
  onSkip,
}) => {
  const [isCheckingTools, setIsCheckingTools] = useState(false);
  const [terminals, setTerminals] = useState<TerminalInfo[]>([]);
  const [isDetectingTerminals, setIsDetectingTerminals] = useState(false);
  const [ides, setIDEs] = useState<IDEInfo[]>([]);
  const [isDetectingIDEs, setIsDetectingIDEs] = useState(false);

  // ── Tool Detection ──────────────────────────────────────────────────

  const checkTools = useCallback(async () => {
    setIsCheckingTools(true);

    const results = await Promise.all(
      TOOL_CONFIGS.map(async (config) => {
        try {
          let result: CommandCheckResult = await window.api.checkCommand(config.command);

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

    setIsCheckingTools(false);
  }, [onToolsChange]);

  // ── Terminal Detection ──────────────────────────────────────────────

  // Use ref to avoid re-triggering the effect when selectedTerminal changes
  const selectedTerminalRef = useRef(selectedTerminal);
  selectedTerminalRef.current = selectedTerminal;

  const detectTerminals = useCallback(async () => {
    setIsDetectingTerminals(true);
    try {
      const detected: TerminalInfo[] = await window.api.detectTerminals();
      setTerminals(detected);

      // Auto-select the system default terminal if none selected
      if (!selectedTerminalRef.current && detected.length > 0) {
        const defaultTerminal = detected.find((t) => t.isDefault);
        onTerminalChange(defaultTerminal?.id ?? detected[0].id);
      }
    } catch {
      setTerminals([]);
    }
    setIsDetectingTerminals(false);
  }, [onTerminalChange]);

  // ── IDE Detection ──────────────────────────────────────────────────

  const selectedIDERef = useRef(selectedIDE);
  selectedIDERef.current = selectedIDE;

  const detectIDEs = useCallback(async () => {
    setIsDetectingIDEs(true);
    try {
      const detected: IDEInfo[] = await window.api.detectIDEs();
      setIDEs(detected);

      // Auto-select the first detected IDE if none selected
      if (!selectedIDERef.current && detected.length > 0) {
        onIDEChange(detected[0].id);
      }
    } catch {
      setIDEs([]);
    }
    setIsDetectingIDEs(false);
  }, [onIDEChange]);

  // ── Tool Path Editing ──────────────────────────────────────────────

  const handleToolPathChange = useCallback(
    (toolId: string, path: string | undefined) => {
      onToolsChange((prev) => ({
        ...prev,
        [toolId]: {
          ...prev[toolId],
          customPath: path,
          validationError: undefined,
        },
      }));
    },
    [onToolsChange]
  );

  const validationCounterRef = useRef<Record<string, number>>({});

  const handleToolValidate = useCallback(
    async (toolId: string, path: string) => {
      const counter = (validationCounterRef.current[toolId] ?? 0) + 1;
      validationCounterRef.current[toolId] = counter;

      onToolsChange((prev) => ({
        ...prev,
        [toolId]: { ...prev[toolId], validating: true, validationError: undefined },
      }));

      try {
        const result = await window.api.validateExecutable(path);
        // Ignore stale results
        if (validationCounterRef.current[toolId] !== counter) return;

        onToolsChange((prev) => ({
          ...prev,
          [toolId]: {
            ...prev[toolId],
            validating: false,
            ...(result.valid
              ? { customPath: path, validationError: undefined }
              : { validationError: result.error ?? 'Invalid path' }),
            ...(result.valid && result.version ? { version: result.version } : {}),
          },
        }));
      } catch {
        if (validationCounterRef.current[toolId] !== counter) return;
        onToolsChange((prev) => ({
          ...prev,
          [toolId]: {
            ...prev[toolId],
            validating: false,
            validationError: 'Validation failed',
          },
        }));
      }
    },
    [onToolsChange]
  );

  useEffect(() => {
    checkTools();
    detectTerminals();
    detectIDEs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary">Development Tools</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Configure your development environment and preferences
        </p>
      </div>

      {/* ── Tool Detection Section ────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-secondary">Required Tools</h3>
          <button
            type="button"
            onClick={checkTools}
            disabled={isCheckingTools}
            className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
          >
            <RefreshCw className={cn('size-3', isCheckingTools && 'animate-spin')} />
            Re-check
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {TOOL_CONFIGS.map((config) => (
            <ToolCard
              key={config.id}
              config={config}
              state={tools[config.id]}
              isChecking={isCheckingTools}
              onPathChange={handleToolPathChange}
              onValidate={handleToolValidate}
            />
          ))}
        </div>
      </section>

      {/* ── Terminal Selection Section ─────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-text-secondary">Default Terminal</h3>
        {isDetectingTerminals ? (
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4">
            <Loader2 className="size-4 animate-spin text-text-muted" />
            <span className="text-sm text-text-muted">Detecting installed terminals...</span>
          </div>
        ) : terminals.length > 0 ? (
          <DropdownSelector
            items={terminals.map((t) => ({
              id: t.id,
              name: t.name,
              badge: t.isDefault ? 'System Default' : undefined,
            }))}
            selectedId={selectedTerminal}
            onChange={onTerminalChange}
            placeholder="Select a terminal"
            icon={<Monitor className="size-4 text-text-muted" />}
          />
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 text-sm text-text-muted">
            No terminal emulators detected. You can configure this later in Settings.
          </div>
        )}
      </section>

      {/* ── IDE Selection Section ──────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-text-secondary">Code Editor</h3>
        {isDetectingIDEs ? (
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4">
            <Loader2 className="size-4 animate-spin text-text-muted" />
            <span className="text-sm text-text-muted">Detecting installed editors...</span>
          </div>
        ) : ides.length > 0 ? (
          <DropdownSelector
            items={ides.map((ide) => ({ id: ide.id, name: ide.name }))}
            selectedId={selectedIDE}
            onChange={onIDEChange}
            placeholder="Select an editor"
            icon={<Code2 className="size-4 text-text-muted" />}
          />
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 text-sm text-text-muted">
            No code editors detected. You can configure this later in Settings.
          </div>
        )}
      </section>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
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

ToolCheckStep.displayName = 'ToolCheckStep';

// ── Tool Card ─────────────────────────────────────────────────────────────

interface ToolCardProps {
  config: ToolConfig;
  state: ToolState;
  isChecking: boolean;
  onPathChange: (toolId: string, path: string | undefined) => void;
  onValidate: (toolId: string, path: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
  config,
  state,
  isChecking,
  onPathChange,
  onValidate,
}) => {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{config.name}</span>
            {state.version && <span className="text-xs text-text-muted">v{state.version}</span>}
          </div>
          <span className="text-xs text-text-muted">{config.description}</span>
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

      <PathInput
        detectedPath={state.path}
        customPath={state.customPath}
        validating={state.validating}
        validationError={state.validationError}
        onPathChange={(path) => onPathChange(config.id, path)}
        onValidate={(path) => onValidate(config.id, path)}
      />
    </div>
  );
};

// ── Dropdown Selector ─────────────────────────────────────────────────────

interface DropdownItem {
  id: string;
  name: string;
  badge?: string;
}

interface DropdownSelectorProps {
  items: DropdownItem[];
  selectedId: string | null;
  onChange: (id: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  items,
  selectedId,
  onChange,
  placeholder,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = items.find((item) => item.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 text-left transition-colors hover:border-border-default"
      >
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <span className="text-sm font-medium text-text-primary">
              {selected?.name ?? placeholder}
            </span>
            {selected?.badge && (
              <span className="ml-2 text-xs text-accent-cyan">{selected.badge}</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn('size-4 text-text-muted transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-border-subtle bg-surface-raised shadow-lg">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item.id);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl',
                item.id === selectedId ? 'bg-accent-cyan/10' : 'hover:bg-base-700'
              )}
            >
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <span className="text-sm font-medium text-text-primary">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 text-xs text-accent-cyan">{item.badge}</span>
                  )}
                </div>
              </div>
              {item.id === selectedId && <CheckCircle2 className="size-4 text-accent-cyan" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
