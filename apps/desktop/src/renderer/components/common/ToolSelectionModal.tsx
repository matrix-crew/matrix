/**
 * ToolSelectionModal Component
 *
 * Generic selection modal for choosing from a list of tool options.
 * Used for terminal shell selection, IDE selection, etc.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, type LucideIcon } from 'lucide-react';

export interface SelectionItem {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface ToolSelectionModalProps<T extends SelectionItem> {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when user cancels */
  onClose: () => void;
  /** Called when user confirms selection */
  onConfirm: (item: T) => void;
  /** Items to choose from */
  items: T[];
  /** Whether items are still loading */
  isLoading?: boolean;
  /** Modal title */
  title: string;
  /** Icon displayed next to the title */
  icon: LucideIcon;
  /** Description text above the list */
  description?: string;
  /** Loading state text */
  loadingText?: string;
  /** Confirm button label */
  confirmLabel?: string;
}

/**
 * Generic tool/item selection modal
 */
function ToolSelectionModalInner<T extends SelectionItem>(
  {
    isOpen,
    onClose,
    onConfirm,
    items,
    isLoading = false,
    title,
    icon: Icon,
    description,
    loadingText = 'Loading...',
    confirmLabel = 'Confirm',
  }: ToolSelectionModalProps<T>,
  _ref: React.Ref<unknown>
) {
  const [selected, setSelected] = React.useState<T | null>(null);

  // Auto-select default item when items change
  React.useEffect(() => {
    if (items.length === 0) {
      setSelected(null);
      return;
    }
    setSelected(items.find((i) => i.isDefault) ?? items[0]);
  }, [items]);

  // Keyboard handling
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && selected) {
        onConfirm(selected);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, selected]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-in rounded-lg border border-border-default bg-base-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-accent-lime" />
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:bg-base-700 hover:text-text-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-sm text-text-muted">{loadingText}</span>
            </div>
          ) : (
            <>
              {description && <p className="mb-3 text-xs text-text-secondary">{description}</p>}
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      selected?.id === item.id
                        ? 'bg-accent-lime/10 text-accent-lime'
                        : 'text-text-secondary hover:bg-base-700 hover:text-text-primary'
                    )}
                  >
                    <Icon className="size-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      {item.description && (
                        <div className="truncate text-xs text-text-muted">{item.description}</div>
                      )}
                    </div>
                    {item.isDefault && (
                      <span className="flex-shrink-0 rounded-full bg-accent-lime/20 px-2 py-0.5 text-[10px] font-medium text-accent-lime">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border-default px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-base-700 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (selected) onConfirm(selected);
            }}
            disabled={!selected || isLoading}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              selected && !isLoading
                ? 'bg-accent-lime text-base-900 hover:bg-accent-lime/90'
                : 'cursor-not-allowed bg-base-600 text-text-muted'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const ToolSelectionModal = React.forwardRef(ToolSelectionModalInner) as <T extends SelectionItem>(
  props: ToolSelectionModalProps<T> & { ref?: React.Ref<unknown> }
) => React.ReactElement | null;

export { ToolSelectionModal };
