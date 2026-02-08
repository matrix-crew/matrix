/**
 * xterm.js Theme for Maxtix
 *
 * Custom terminal theme matching the Maxtix design system.
 * Colors are derived from the TailwindCSS v4 design tokens
 * defined in apps/desktop/src/renderer/src/index.css.
 */

/**
 * xterm.js theme configuration
 *
 * Maps to the Maxtix design system:
 * - Background: base-900 (#0a0a0f)
 * - Foreground: text-primary (#e2e8f0)
 * - Cursor: accent-lime (#a3e635)
 * - Selection: base-500 with alpha
 * - ANSI colors: Tuned to complement the dark palette
 */
export const matrixXtermTheme = {
  background: '#0a0a0f',
  foreground: '#e2e8f0',
  cursor: '#a3e635',
  cursorAccent: '#0a0a0f',
  selectionBackground: '#22223a80',
  selectionForeground: '#e2e8f0',
  selectionInactiveBackground: '#22223a40',

  // Standard ANSI colors
  black: '#0e0e16',
  red: '#ef4444',
  green: '#a3e635',
  yellow: '#fbbf24',
  blue: '#22d3ee',
  magenta: '#a855f7',
  cyan: '#22d3ee',
  white: '#e2e8f0',

  // Bright ANSI colors
  brightBlack: '#64748b',
  brightRed: '#f87171',
  brightGreen: '#bef264',
  brightYellow: '#fcd34d',
  brightBlue: '#67e8f9',
  brightMagenta: '#c084fc',
  brightCyan: '#67e8f9',
  brightWhite: '#f1f5f9',
};

/**
 * xterm.js terminal options for Maxtix
 *
 * Font configuration uses JetBrains Mono Variable for consistency
 * with the app's monospace font.
 */
export const matrixXtermOptions = {
  fontFamily: "'JetBrains Mono Variable', 'SF Mono', Monaco, Consolas, monospace",
  fontSize: 14,
  lineHeight: 1.4,
  letterSpacing: 0,
  cursorBlink: true,
  cursorStyle: 'block' as const,
  cursorInactiveStyle: 'outline' as const,
  scrollback: 10000,
  allowTransparency: false,
  drawBoldTextInBrightColors: true,
  fastScrollModifier: 'alt' as const,
  fastScrollSensitivity: 5,
  scrollSensitivity: 3,
};
