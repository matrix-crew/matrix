import { describe, it, expect, vi, afterEach } from 'vitest';
import { getHostPlatform } from './platform';

describe('getHostPlatform', () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
  });

  it('returns "macos" for Mac platforms', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
    expect(getHostPlatform()).toBe('macos');
  });

  it('returns "macos" for MacARM', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacARM', configurable: true });
    expect(getHostPlatform()).toBe('macos');
  });

  it('returns "windows" for Win32', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
    expect(getHostPlatform()).toBe('windows');
  });

  it('returns "linux" for Linux platforms', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Linux x86_64', configurable: true });
    expect(getHostPlatform()).toBe('linux');
  });

  it('returns "linux" as fallback for unknown platforms', () => {
    Object.defineProperty(navigator, 'platform', { value: 'FreeBSD', configurable: true });
    expect(getHostPlatform()).toBe('linux');
  });
});
