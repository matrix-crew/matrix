/**
 * Platform detection utilities.
 * Works in both main process (process.platform) and renderer (navigator.platform).
 */

export type HostPlatform = 'macos' | 'windows' | 'linux';

export function getHostPlatform(): HostPlatform {
  // Browser / Electron renderer process (checked first so tests can mock navigator.platform)
  const nav = (globalThis as any).navigator as { platform?: string } | undefined;
  if (nav?.platform) {
    const p = nav.platform.toUpperCase();
    if (p.includes('MAC')) return 'macos';
    if (p.includes('WIN')) return 'windows';
    return 'linux';
  }
  // Node.js / Electron main process
  if (typeof process !== 'undefined' && process.platform) {
    if (process.platform === 'darwin') return 'macos';
    if (process.platform === 'win32') return 'windows';
    return 'linux';
  }
  return 'linux';
}
