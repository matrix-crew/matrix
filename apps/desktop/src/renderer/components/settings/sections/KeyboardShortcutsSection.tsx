import * as React from 'react';
import { cn } from '@/lib/utils';
import { useShortcuts } from '@/contexts/ShortcutProvider';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  formatBinding,
  serializeBinding,
  getDefaultShortcut,
} from '@shared/types/shortcut-defaults';
import type { ShortcutActionId, KeyBinding, ModifierKey } from '@shared/types/shortcuts';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

export interface KeyboardShortcutsSectionProps {
  className?: string;
}

// ─── ShortcutRecorder ────────────────────────────────────────────────

interface ShortcutRecorderProps {
  actionId: ShortcutActionId;
  currentBinding: KeyBinding;
  onSave: (binding: KeyBinding) => void;
  onCancel: () => void;
}

const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({
  actionId,
  currentBinding,
  onSave,
  onCancel,
}) => {
  const [recording, setRecording] = React.useState<KeyBinding | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Ignore bare modifier keys
      if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        return;
      }

      const modifiers: ModifierKey[] = [];
      const isMac = navigator.platform.toUpperCase().includes('MAC');

      if (isMac ? e.metaKey : e.ctrlKey) modifiers.push('meta');
      if (isMac ? e.ctrlKey : false) modifiers.push('ctrl');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');

      // Require at least one modifier
      if (modifiers.length === 0) return;

      const binding: KeyBinding = { modifiers, key: e.key.toLowerCase() };
      setRecording(binding);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onCancel]);

  const handleSave = () => {
    if (recording) {
      onSave(recording);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={`Record shortcut for ${actionId}`}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border-default bg-base-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-text-primary">Record Shortcut</h3>
        <p className="mt-1 text-xs text-text-muted">
          Press a key combination (modifier + key). Press Escape to cancel.
        </p>

        <div className="mt-4 flex items-center justify-center rounded-lg border border-border-default bg-base-800 p-4">
          <span className="text-lg font-mono text-text-primary">
            {recording ? formatBinding(recording) : formatBinding(currentBinding)}
          </span>
        </div>

        {recording && (
          <p className="mt-2 text-center text-xs text-accent-cyan">New binding detected</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-base-700 hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!recording}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              recording
                ? 'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30'
                : 'text-text-muted cursor-not-allowed'
            )}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ShortcutRow ─────────────────────────────────────────────────────

interface ShortcutRowProps {
  actionId: ShortcutActionId;
  label: string;
  description: string;
  binding: KeyBinding;
  isCustom: boolean;
  hasConflict: boolean;
  onRecord: () => void;
  onReset: () => void;
}

const ShortcutRow: React.FC<ShortcutRowProps> = ({
  label,
  description,
  binding,
  isCustom,
  hasConflict,
  onRecord,
  onReset,
}) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors',
      hasConflict && 'bg-red-500/5'
    )}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {hasConflict && <AlertTriangle className="size-3.5 text-red-400 flex-shrink-0" />}
      </div>
      <p className="text-xs text-text-muted truncate">{description}</p>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={onRecord}
        className={cn(
          'rounded-md border px-3 py-1 text-xs font-mono font-medium transition-colors',
          isCustom
            ? 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20'
            : 'border-border-default bg-base-800 text-text-secondary hover:bg-base-700 hover:text-text-primary'
        )}
      >
        {formatBinding(binding)}
      </button>

      {isCustom && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center rounded-md p-1 text-text-muted hover:bg-base-700 hover:text-text-primary transition-colors"
          aria-label="Reset to default"
          title="Reset to default"
        >
          <RotateCcw className="size-3.5" />
        </button>
      )}
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────

const KeyboardShortcutsSection: React.FC<KeyboardShortcutsSectionProps> = ({ className }) => {
  const { shortcuts, overrides, setShortcut, resetShortcut, resetAllShortcuts, conflicts } =
    useShortcuts();
  const [recordingAction, setRecordingAction] = React.useState<ShortcutActionId | null>(null);

  const hasOverrides = Object.keys(overrides).length > 0;

  // Collect all conflicting action IDs
  const conflictingActions = React.useMemo(() => {
    const set = new Set<ShortcutActionId>();
    for (const actions of conflicts.values()) {
      for (const a of actions) set.add(a);
    }
    return set;
  }, [conflicts]);

  const handleSave = React.useCallback(
    (binding: KeyBinding) => {
      if (recordingAction) {
        // Check if the binding matches the default — if so, remove override
        const def = getDefaultShortcut(recordingAction);
        if (def && serializeBinding(binding) === serializeBinding(def.defaultBinding)) {
          resetShortcut(recordingAction);
        } else {
          setShortcut(recordingAction, binding);
        }
        setRecordingAction(null);
      }
    },
    [recordingAction, setShortcut, resetShortcut]
  );

  return (
    <div
      className={cn('space-y-6', className)}
      role="region"
      aria-label="Keyboard Shortcuts Settings"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Keyboard Shortcuts</h2>
          <p className="mt-1 text-sm text-text-secondary">View and customize keyboard shortcuts</p>
        </div>
        {hasOverrides && (
          <button
            type="button"
            onClick={resetAllShortcuts}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-base-700 hover:text-text-primary transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Conflict Warning */}
      {conflicts.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="size-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">
            Some shortcuts have conflicting key bindings. Conflicting shortcuts are highlighted
            below.
          </p>
        </div>
      )}

      {/* Categories */}
      {SHORTCUT_CATEGORIES.map((category) => (
        <div
          key={category.id}
          className="rounded-lg border border-border-default bg-surface-raised p-4"
        >
          <div className="mb-3">
            <h3 className="text-sm font-medium text-text-primary">{category.label}</h3>
          </div>
          <div className="space-y-1">
            {category.actions.map((actionId) => {
              const def = DEFAULT_SHORTCUTS.find((s) => s.id === actionId);
              if (!def) return null;
              const binding = shortcuts.get(actionId) ?? def.defaultBinding;
              const isCustom = actionId in overrides;
              const hasConflict = conflictingActions.has(actionId);

              return (
                <ShortcutRow
                  key={actionId}
                  actionId={actionId}
                  label={def.label}
                  description={def.description}
                  binding={binding}
                  isCustom={isCustom}
                  hasConflict={hasConflict}
                  onRecord={() => setRecordingAction(actionId)}
                  onReset={() => resetShortcut(actionId)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Recorder Modal */}
      {recordingAction && (
        <ShortcutRecorder
          actionId={recordingAction}
          currentBinding={shortcuts.get(recordingAction) ?? DEFAULT_SHORTCUTS[0].defaultBinding}
          onSave={handleSave}
          onCancel={() => setRecordingAction(null)}
        />
      )}
    </div>
  );
};

KeyboardShortcutsSection.displayName = 'KeyboardShortcutsSection';

export { KeyboardShortcutsSection };
