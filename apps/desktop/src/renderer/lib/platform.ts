/**
 * Platform detection utilities for the renderer process.
 */

export type HostPlatform = 'macos' | 'windows' | 'linux';

/**
 * Detect the host operating system from the renderer process.
 * Uses `navigator.platform` (same approach as KeyboardShortcutsSection).
 */
export function getHostPlatform(): HostPlatform {
  const platform = navigator.platform.toUpperCase();
  if (platform.includes('MAC')) return 'macos';
  if (platform.includes('WIN')) return 'windows';
  return 'linux';
}
