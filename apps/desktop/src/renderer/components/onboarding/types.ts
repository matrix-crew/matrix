/**
 * Onboarding Type Definitions and Configuration
 *
 * Shared types and constants for the onboarding wizard.
 */

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  id: string;
  name: string;
  command: string;
  description: string;
  installUrl: string;
  envVar: string;
  authCommand: string;
}

export interface AgentState {
  detected: boolean;
  path?: string;
  version?: string;
  authMethod: 'cli' | 'api-key' | null;
  apiKey: string;
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    description: "Anthropic's AI coding assistant",
    installUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    envVar: 'ANTHROPIC_API_KEY',
    authCommand: 'claude auth login',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    description: "Google's Gemini AI assistant",
    installUrl: 'https://github.com/google-gemini/gemini-cli',
    envVar: 'GEMINI_API_KEY',
    authCommand: 'gemini auth login',
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    command: 'codex',
    description: "OpenAI's coding agent",
    installUrl: 'https://github.com/openai/codex',
    envVar: 'OPENAI_API_KEY',
    authCommand: 'codex auth',
  },
];

// ============================================================================
// Tool Configuration
// ============================================================================

export interface ToolConfig {
  id: string;
  name: string;
  command: string;
  fallbackCommand?: string;
  description: string;
  installUrl: string;
}

export interface ToolState {
  installed: boolean;
  version?: string;
  path?: string;
}

export const TOOL_CONFIGS: ToolConfig[] = [
  {
    id: 'git',
    name: 'Git',
    command: 'git',
    description: 'Version control system',
    installUrl: 'https://git-scm.com/downloads',
  },
  {
    id: 'python',
    name: 'Python',
    command: 'python3',
    fallbackCommand: 'python',
    description: 'Python programming language',
    installUrl: 'https://www.python.org/downloads/',
  },
  {
    id: 'node',
    name: 'Node.js',
    command: 'node',
    description: 'JavaScript runtime',
    installUrl: 'https://nodejs.org/',
  },
];

// ============================================================================
// Terminal Configuration
// ============================================================================

export interface TerminalInfo {
  id: string;
  name: string;
  path: string;
  isDefault: boolean;
}

// ============================================================================
// IDE Configuration
// ============================================================================

export interface IDEInfo {
  id: string;
  name: string;
  path: string;
}

// ============================================================================
// System Check Types
// ============================================================================

export interface CommandCheckResult {
  exists: boolean;
  path?: string;
  version?: string;
}

// ============================================================================
// Initial State Helpers
// ============================================================================

export function createInitialAgentStates(): Record<string, AgentState> {
  const states: Record<string, AgentState> = {};
  for (const agent of AGENT_CONFIGS) {
    states[agent.id] = { detected: false, authMethod: null, apiKey: '' };
  }
  return states;
}

export function createInitialToolStates(): Record<string, ToolState> {
  const states: Record<string, ToolState> = {};
  for (const tool of TOOL_CONFIGS) {
    states[tool.id] = { installed: false };
  }
  return states;
}
