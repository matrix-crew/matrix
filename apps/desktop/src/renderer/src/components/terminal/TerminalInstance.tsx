/**
 * TerminalInstance Component
 *
 * Renders a single xterm.js terminal instance connected to a PTY session
 * via the TerminalService. Handles:
 * - xterm.js lifecycle (mount, configure, dispose)
 * - Addon loading (FitAddon, WebLinksAddon)
 * - PTY data flow (input → IPC, IPC → output)
 * - Auto-resize on container changes
 * - Custom theme matching the Maxtix design system
 */

import * as React from 'react';
import { cn } from '@maxtix/ui';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { matrixXtermTheme, matrixXtermOptions } from '@maxtix/shared';
import { terminalService } from '@/services/TerminalService';
import { useResizeObserver } from '@/hooks/useResizeObserver';

import '@xterm/xterm/css/xterm.css';

export interface TerminalInstanceProps {
  /** Session ID connecting this instance to a PTY process */
  sessionId: string;
  /** Whether this terminal tab is currently visible */
  isActive: boolean;
  /** Called when the PTY process exits */
  onExit?: (exitCode: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * xterm.js terminal instance connected to a PTY session
 */
const TerminalInstance: React.FC<TerminalInstanceProps> = ({
  sessionId,
  isActive,
  onExit,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const terminalRef = React.useRef<Terminal | null>(null);
  const fitAddonRef = React.useRef<FitAddon | null>(null);
  const initializedRef = React.useRef(false);

  /**
   * Initialize xterm.js and connect to PTY
   */
  React.useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    // Create xterm.js instance
    const terminal = new Terminal({
      ...matrixXtermOptions,
      theme: matrixXtermTheme,
    });
    terminalRef.current = terminal;

    // Load addons
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());

    // Mount to DOM
    terminal.open(containerRef.current);

    // Initial fit
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        // Container may not be visible yet
      }
    });

    // Forward user input to PTY
    const inputDisposable = terminal.onData((data) => {
      terminalService.writeInput(sessionId, data);
    });

    // Receive PTY output and write to xterm.js
    const cleanupData = terminalService.onTerminalData(sessionId, (data) => {
      terminal.write(data);
    });

    // Handle PTY exit
    const cleanupExit = terminalService.onTerminalExit(sessionId, (exitCode) => {
      terminal.write(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
      onExit?.(exitCode);
    });

    return () => {
      inputDisposable.dispose();
      cleanupData();
      cleanupExit();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      initializedRef.current = false;
    };
  }, [sessionId, onExit]);

  /**
   * Fit terminal when it becomes active (tab switch)
   */
  React.useEffect(() => {
    if (isActive && fitAddonRef.current && terminalRef.current) {
      requestAnimationFrame(() => {
        try {
          fitAddonRef.current?.fit();
          terminalRef.current?.focus();
        } catch {
          // May not be visible yet
        }
      });
    }
  }, [isActive]);

  /**
   * Auto-resize terminal when container changes size
   */
  useResizeObserver(containerRef, () => {
    if (!fitAddonRef.current || !terminalRef.current) return;
    try {
      fitAddonRef.current.fit();
      const { cols, rows } = terminalRef.current;
      terminalService.resizeTerminal(sessionId, cols, rows);
    } catch {
      // Terminal may be disposing
    }
  });

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full', className)}
      role="region"
      aria-label="Terminal"
    />
  );
};

TerminalInstance.displayName = 'TerminalInstance';

export { TerminalInstance };
