/**
 * MiniTerminal Component
 *
 * Lightweight embedded terminal for auto-executing a single command.
 * Uses TerminalService + node-pty with a simplified xterm.js wrapper
 * (fixed rows, no FitAddon/ResizeObserver/WebLinksAddon).
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Terminal } from '@xterm/xterm';
import { matrixXtermTheme } from '@shared/theme/xterm-theme';
import { terminalService } from '@/services/TerminalService';

import '@xterm/xterm/css/xterm.css';

export interface MiniTerminalProps {
  /** Command to auto-execute on mount */
  command: string;
  /** Visible rows (default: 3) */
  rows?: number;
  /** Called when the PTY process exits */
  onExit?: (code: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Minimal xterm.js terminal that auto-executes a command.
 * Designed for inline use in setup prompts and wizards.
 */
export const MiniTerminal: React.FC<MiniTerminalProps> = ({
  command,
  rows = 3,
  onExit,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const terminalRef = React.useRef<Terminal | null>(null);
  const sessionIdRef = React.useRef<string | null>(null);
  const initializedRef = React.useRef(false);
  const onExitRef = React.useRef(onExit);
  onExitRef.current = onExit;

  React.useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    let disposed = false;
    let cleanupData: (() => void) | null = null;
    let cleanupExit: (() => void) | null = null;
    let inputDisposable: { dispose: () => void } | null = null;

    const setup = async () => {
      try {
        // Ensure TerminalService listeners are active (idempotent)
        terminalService.initialize();

        // Detect default shell
        const shells = await window.api.detectShells();
        const defaultShell = shells.find((s) => s.isDefault) || shells[0];
        const shellPath = defaultShell?.path || '/bin/zsh';

        if (disposed) return;

        // Create PTY session
        const session = await terminalService.createTerminal({
          name: 'mini-terminal',
          shell: shellPath,
          cols: 80,
          rows,
        });

        if (disposed) {
          terminalService.closeTerminal(session.id);
          return;
        }

        sessionIdRef.current = session.id;

        // Create xterm.js instance with fixed dimensions
        const terminal = new Terminal({
          theme: matrixXtermTheme,
          fontFamily: "'JetBrains Mono Variable', 'SF Mono', Monaco, Consolas, monospace",
          fontSize: 12,
          lineHeight: 1.3,
          rows,
          cols: 80,
          cursorBlink: true,
          cursorStyle: 'block',
          scrollback: 500,
          disableStdin: false,
        });
        terminalRef.current = terminal;

        // Mount to DOM
        terminal.open(containerRef.current!);

        // Wire input: xterm -> PTY
        inputDisposable = terminal.onData((data) => {
          terminalService.writeInput(session.id, data);
        });

        // Wire output: PTY -> xterm
        let commandSent = false;
        cleanupData = terminalService.onTerminalData(session.id, (data) => {
          if (disposed) return;
          terminal.write(data);

          // Auto-execute command on first data (shell is ready)
          if (!commandSent) {
            commandSent = true;
            terminalService.writeInput(session.id, command + '\r');
          }
        });

        // Handle PTY exit
        cleanupExit = terminalService.onTerminalExit(session.id, (exitCode) => {
          if (disposed) return;
          terminal.write(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
          onExitRef.current?.(exitCode);
        });
      } catch (err) {
        console.error('[MiniTerminal] Setup failed:', err);
      }
    };

    setup();

    return () => {
      disposed = true;
      inputDisposable?.dispose();
      cleanupData?.();
      cleanupExit?.();
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
      if (sessionIdRef.current) {
        terminalService.closeTerminal(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [command, rows]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden rounded', className)}
      role="region"
      aria-label={`Terminal: ${command}`}
    />
  );
};

MiniTerminal.displayName = 'MiniTerminal';
