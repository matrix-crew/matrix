/**
 * Agent Account Types
 *
 * Shared types for multi-account agent authentication.
 * Used by both onboarding and settings screens.
 */

export interface AgentAccount {
  id: string;
  agentId: string; // 'claude' | 'gemini' | 'codex'
  type: 'cli' | 'api-key';
  label: string; // "Personal", "Work", etc.
  apiKey?: string; // api-key only
  authenticated: boolean;
  // priority = index in the array (0 = highest)
}

let nextId = 1;

export function createAccount(
  agentId: string,
  type: 'cli' | 'api-key',
  label: string,
  opts?: { apiKey?: string; authenticated?: boolean }
): AgentAccount {
  return {
    id: String(nextId++),
    agentId,
    type,
    label,
    apiKey: opts?.apiKey,
    authenticated: opts?.authenticated ?? false,
  };
}

/** Agent display metadata keyed by agentId */
export const AGENT_META: Record<string, { name: string; initial: string; envVar: string }> = {
  claude: { name: 'Claude Code', initial: 'C', envVar: 'ANTHROPIC_API_KEY' },
  gemini: { name: 'Gemini CLI', initial: 'G', envVar: 'GEMINI_API_KEY' },
  codex: { name: 'OpenAI Codex', initial: 'O', envVar: 'OPENAI_API_KEY' },
};
