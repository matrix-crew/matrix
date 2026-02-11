import { useEffect } from 'react';
import type { ShortcutActionId } from '@shared/types/shortcuts';
import { useShortcuts } from '@/contexts/ShortcutProvider';

/**
 * Convenience hook to register a shortcut action handler.
 * Automatically registers on mount and unregisters on unmount.
 *
 * @param actionId - The shortcut action to listen for
 * @param handler - Callback invoked when the shortcut is triggered
 * @param enabled - Whether the shortcut is currently active (default: true)
 */
export function useShortcutAction(
  actionId: ShortcutActionId,
  handler: () => void,
  enabled = true
): void {
  const { registerAction } = useShortcuts();

  useEffect(() => {
    if (!enabled) return;
    return registerAction(actionId, handler);
  }, [actionId, handler, enabled, registerAction]);
}
