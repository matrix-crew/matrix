/**
 * CommandTerminal Component
 *
 * Self-managing terminal wrapper that creates its own PTY session,
 * optionally runs an initial command, and cleans up on unmount.
 * Designed for inline interactive CLI flows (e.g. `claude /login`).
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { terminalService } from '@/services/TerminalService';
import { EmbedTerminal } from './EmbedTerminal';

export interface CommandTerminalProps {
  /** Initial command to execute after session is ready */
  initialCommand?: string;
  /** Shell path override (defaults to system shell) */
  shell?: string;
  /** Called when the PTY process exits */
  onExit?: (exitCode: number) => void;
  /** Called with each chunk of PTY output data */
  onOutput?: (data: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Creates a PTY session on mount, renders EmbedTerminal once ready,
 * sends an optional initial command, and tears down on unmount.
 */
export const CommandTerminal: React.FC<CommandTerminalProps> = ({
  initialCommand,
  shell,
  onExit,
  onOutput,
  className,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const onExitRef = useRef(onExit);
  const onOutputRef = useRef(onOutput);
  onExitRef.current = onExit;
  onOutputRef.current = onOutput;

  // Create session on mount, clean up on unmount
  useEffect(() => {
    let cancelled = false;

    // Ensure global IPC listeners are registered (idempotent)
    terminalService.initialize();

    const create = async () => {
      try {
        const session = await terminalService.createTerminal({
          name: 'command-terminal',
          shell: shell || '',
          cols: 80,
          rows: 24,
        });

        if (cancelled) {
          terminalService.closeTerminal(session.id);
          return;
        }

        sessionIdRef.current = session.id;
        setSessionId(session.id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to create terminal');
        }
      }
    };

    create();

    return () => {
      cancelled = true;
      if (sessionIdRef.current) {
        terminalService.closeTerminal(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [shell]);

  // Subscribe to PTY output for onOutput callback
  useEffect(() => {
    if (!sessionId) return;

    const cleanup = terminalService.onTerminalData(sessionId, (data) => {
      onOutputRef.current?.(data);
    });

    return cleanup;
  }, [sessionId]);

  // Send initial command once session is ready
  useEffect(() => {
    if (!sessionId || !initialCommand) return;

    requestAnimationFrame(() => {
      terminalService.writeInput(sessionId, initialCommand + '\r');
    });
  }, [sessionId, initialCommand]);

  const handleExit = (exitCode: number) => {
    onExitRef.current?.(exitCode);
  };

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-red-500/30 bg-base-800 p-4 text-xs text-red-400',
          className
        )}
      >
        {error}
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border-subtle bg-base-800 p-4 text-xs text-text-muted',
          className
        )}
      >
        Starting terminal...
      </div>
    );
  }

  return (
    <EmbedTerminal
      sessionId={sessionId}
      isActive={true}
      onExit={handleExit}
      className={className}
    />
  );
};

CommandTerminal.displayName = 'CommandTerminal';
