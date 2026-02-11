import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Terminal, Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';

export interface MiniTerminalProps {
  /** Command to execute (e.g., "uv --version") */
  command: string;
  /** Maximum number of output lines to display */
  maxLines?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MiniTerminal - A compact, read-only command runner.
 *
 * Displays a pre-defined command with a "Run" button. On execution,
 * shows the last N lines of output with success/failure indication.
 * Uses child_process via IPC (not PTY) for lightweight execution.
 *
 * @example
 * <MiniTerminal command="uv --version" />
 * <MiniTerminal command="claude auth login" maxLines={5} />
 */
export const MiniTerminal: React.FC<MiniTerminalProps> = ({ command, maxLines = 3, className }) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [output, setOutput] = useState<string[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);

  const execute = useCallback(async () => {
    setStatus('running');
    setOutput([]);
    setExitCode(null);

    try {
      const result = await window.api.execCommand(command);
      setExitCode(result.exitCode);

      const combined = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();

      if (combined) {
        const lines = combined.split('\n').filter((line) => line.trim());
        setOutput(lines.slice(-maxLines));
      } else {
        setOutput([result.success ? 'Done (no output)' : 'Failed with no output']);
      }

      setStatus(result.success ? 'success' : 'error');
    } catch {
      setOutput(['Command execution failed']);
      setStatus('error');
      setExitCode(1);
    }
  }, [command, maxLines]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border-subtle bg-base-800',
        className
      )}
    >
      {/* Command header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Terminal className="size-3.5 flex-shrink-0 text-text-muted" />
          <code className="truncate font-mono text-xs text-text-secondary">{command}</code>
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          {status === 'running' && <Loader2 className="size-3.5 animate-spin text-text-muted" />}
          {status === 'success' && <CheckCircle2 className="size-3.5 text-accent-lime" />}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="size-3.5" />
              {exitCode !== null && <span className="text-xs">exit {exitCode}</span>}
            </span>
          )}

          {/* Run button */}
          <button
            type="button"
            onClick={execute}
            disabled={status === 'running'}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors',
              status === 'running'
                ? 'cursor-not-allowed text-text-muted'
                : 'text-accent-cyan hover:bg-accent-cyan/10'
            )}
          >
            <Play className="size-3" />
            {status === 'running' ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Output area */}
      {output.length > 0 && (
        <div className="border-t border-border-subtle px-3 py-2">
          {output.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                'font-mono text-xs leading-relaxed',
                status === 'error' ? 'text-red-400' : 'text-text-secondary'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

MiniTerminal.displayName = 'MiniTerminal';
