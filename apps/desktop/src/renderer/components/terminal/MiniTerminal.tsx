import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Terminal, Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';

export interface MiniTerminalProps {
  /** Command to execute (e.g., "uv --version") */
  command: string;
  /** Maximum number of output lines to display */
  maxLines?: number;
  /** Called when command completes successfully (exit code 0) */
  onSuccess?: () => void;
  /** Additional CSS classes */
  className?: string;
}

let streamCounter = 0;

/**
 * MiniTerminal - A compact, read-only command runner with real-time output.
 *
 * Displays a pre-defined command with a "Run" button. On execution,
 * streams output line-by-line as it arrives, keeping the last N lines visible.
 *
 * @example
 * <MiniTerminal command="uv --version" />
 * <MiniTerminal command="npm i -g @google/gemini-cli" maxLines={5} />
 */
export const MiniTerminal: React.FC<MiniTerminalProps> = ({
  command,
  maxLines = 5,
  onSuccess,
  className,
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [lines, setLines] = useState<string[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const sessionRef = useRef<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        window.api.execStream.kill(sessionRef.current);
      }
    };
  }, []);

  const execute = useCallback(async () => {
    // Kill previous run if any
    if (sessionRef.current) {
      window.api.execStream.kill(sessionRef.current);
    }

    const sessionId = `mini-${++streamCounter}-${Date.now()}`;
    sessionRef.current = sessionId;
    setStatus('running');
    setLines([]);
    setExitCode(null);

    // Subscribe to streaming events
    const cleanupData = window.api.execStream.onData((sid, data) => {
      if (sid !== sessionId) return;
      setLines((prev) => {
        const newLines = data.split('\n').filter((l) => l.trim());
        const merged = [...prev, ...newLines];
        return merged.slice(-maxLines);
      });
    });

    const cleanupExit = window.api.execStream.onExit((sid, code) => {
      if (sid !== sessionId) return;
      setExitCode(code);
      setStatus(code === 0 ? 'success' : 'error');
      sessionRef.current = null;
      cleanupData();
      cleanupExit();
      if (code === 0) onSuccessRef.current?.();
    });

    try {
      const { started } = await window.api.execStream.start(sessionId, command);
      if (!started) {
        setLines(['Command not allowed']);
        setStatus('error');
        setExitCode(1);
        sessionRef.current = null;
        cleanupData();
        cleanupExit();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start command';
      setLines([msg]);
      setStatus('error');
      setExitCode(1);
      sessionRef.current = null;
      cleanupData();
      cleanupExit();
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
          {status === 'running' && <Loader2 className="size-3.5 animate-spin text-text-muted" />}
          {status === 'success' && <CheckCircle2 className="size-3.5 text-accent-lime" />}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="size-3.5" />
              {exitCode !== null && <span className="text-xs">exit {exitCode}</span>}
            </span>
          )}

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

      {/* Output area — real-time streaming (fixed height to prevent layout shift) */}
      {status !== 'idle' && (
        <div
          ref={outputRef}
          className="h-20 overflow-y-auto border-t border-border-subtle px-3 py-2"
        >
          {lines.map((line, idx) => (
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
