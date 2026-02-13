import { describe, it, expect, afterEach } from 'vitest';
import { getHostPlatform } from './platform';

// Access navigator via globalThis to avoid DOM type dependency in shared/
const nav = globalThis as unknown as { navigator: { platform: string } };

describe('getHostPlatform', () => {
  const originalPlatform = nav.navigator.platform;

  afterEach(() => {
    Object.defineProperty(nav.navigator, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
  });

  it('returns "macos" for Mac platforms', () => {
    Object.defineProperty(nav.navigator, 'platform', { value: 'MacIntel', configurable: true });
    expect(getHostPlatform()).toBe('macos');
  });

  it('returns "macos" for MacARM', () => {
    Object.defineProperty(nav.navigator, 'platform', { value: 'MacARM', configurable: true });
    expect(getHostPlatform()).toBe('macos');
  });

  it('returns "windows" for Win32', () => {
    Object.defineProperty(nav.navigator, 'platform', { value: 'Win32', configurable: true });
    expect(getHostPlatform()).toBe('windows');
  });

  it('returns "linux" for Linux platforms', () => {
    Object.defineProperty(nav.navigator, 'platform', {
      value: 'Linux x86_64',
      configurable: true,
    });
    expect(getHostPlatform()).toBe('linux');
  });

  it('returns "linux" as fallback for unknown platforms', () => {
    Object.defineProperty(nav.navigator, 'platform', { value: 'FreeBSD', configurable: true });
    expect(getHostPlatform()).toBe('linux');
  });
});
