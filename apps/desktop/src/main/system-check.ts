/**
 * System Check & Config Management
 *
 * Handles system-level operations for the onboarding wizard:
 * - CLI command detection (which + --version)
 * - Terminal emulator detection (cross-platform)
 * - Application config read/write (~/.matrix/config.json)
 * - External URL opening
 *
 * Runs in the Electron main process only.
 */

import { ipcMain, shell } from 'electron';
import { exec } from 'child_process';
import { readFile, writeFile, mkdir, readdir, access } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

const CONFIG_DIR = join(homedir(), '.matrix');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

/** Commands allowed for detection (security whitelist) */
const ALLOWED_COMMANDS = new Set([
  'claude',
  'gemini',
  'codex',
  'git',
  'python',
  'python3',
  'node',
  'uv',
  'pnpm',
  'npm',
]);

/**
 * Get the appropriate shell for command execution based on platform
 */
function getShell(): string {
  if (platform() === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/zsh';
}

/**
 * Execute a shell command and return stdout
 */
function execAsync(cmd: string, timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, shell: getShell() }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve((stdout || stderr).trim());
    });
  });
}

interface CommandCheckResult {
  exists: boolean;
  path?: string;
  version?: string;
}

/**
 * Check if a command exists and get its version
 */
async function checkCommand(command: string): Promise<CommandCheckResult> {
  // Validate: must be in whitelist AND contain only safe characters
  if (!ALLOWED_COMMANDS.has(command) || !/^[a-zA-Z0-9_-]+$/.test(command)) {
    return { exists: false };
  }

  try {
    const cmdPath = await execAsync(`which ${command}`);

    let version: string | undefined;
    try {
      const output = await execAsync(`${command} --version`);
      const match = output.match(/(\d+\.\d+(?:\.\d+)*)/);
      version = match?.[1] ?? output.split('\n')[0];
    } catch {
      // Some commands don't support --version
    }

    return { exists: true, path: cmdPath, version };
  } catch {
    return { exists: false };
  }
}

// ── Terminal Detection ──────────────────────────────────────────────────

interface TerminalInfo {
  id: string;
  name: string;
  path: string;
  isDefault: boolean;
}

interface TerminalCandidate {
  id: string;
  name: string;
  /** macOS: app bundle name, Linux: command name, Windows: exe path pattern */
  check: string;
}

const MACOS_TERMINALS: TerminalCandidate[] = [
  { id: 'terminal', name: 'Terminal', check: 'Terminal.app' },
  { id: 'iterm2', name: 'iTerm2', check: 'iTerm.app' },
  { id: 'warp', name: 'Warp', check: 'Warp.app' },
  { id: 'kitty', name: 'Kitty', check: 'kitty.app' },
  { id: 'alacritty', name: 'Alacritty', check: 'Alacritty.app' },
  { id: 'hyper', name: 'Hyper', check: 'Hyper.app' },
  { id: 'rio', name: 'Rio', check: 'Rio.app' },
  { id: 'ghostty', name: 'Ghostty', check: 'Ghostty.app' },
];

const LINUX_TERMINALS: TerminalCandidate[] = [
  { id: 'gnome-terminal', name: 'GNOME Terminal', check: 'gnome-terminal' },
  { id: 'konsole', name: 'Konsole', check: 'konsole' },
  { id: 'xfce4-terminal', name: 'XFCE Terminal', check: 'xfce4-terminal' },
  { id: 'kitty', name: 'Kitty', check: 'kitty' },
  { id: 'alacritty', name: 'Alacritty', check: 'alacritty' },
  { id: 'warp', name: 'Warp', check: 'warp-terminal' },
  { id: 'hyper', name: 'Hyper', check: 'hyper' },
  { id: 'tilix', name: 'Tilix', check: 'tilix' },
  { id: 'terminator', name: 'Terminator', check: 'terminator' },
  { id: 'xterm', name: 'XTerm', check: 'xterm' },
  { id: 'ghostty', name: 'Ghostty', check: 'ghostty' },
];

const WINDOWS_TERMINALS: TerminalCandidate[] = [
  { id: 'windows-terminal', name: 'Windows Terminal', check: 'wt.exe' },
  { id: 'powershell', name: 'PowerShell', check: 'pwsh.exe' },
  { id: 'cmd', name: 'Command Prompt', check: 'cmd.exe' },
  { id: 'git-bash', name: 'Git Bash', check: 'git-bash.exe' },
  { id: 'hyper', name: 'Hyper', check: 'Hyper.exe' },
  { id: 'alacritty', name: 'Alacritty', check: 'alacritty.exe' },
];

/**
 * Check if a path exists (async)
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect installed terminal emulators on macOS
 */
async function detectMacOSTerminals(): Promise<TerminalInfo[]> {
  const results: TerminalInfo[] = [];
  const appDirs = ['/Applications', join(homedir(), 'Applications')];

  // Detect default terminal by checking LaunchServices
  let defaultTerminalId: string | undefined;
  try {
    // The default terminal handles x-man-page URLs; fallback to checking TERM_PROGRAM
    const termProgram = process.env.TERM_PROGRAM?.toLowerCase() || '';
    if (termProgram.includes('iterm')) defaultTerminalId = 'iterm2';
    else if (termProgram.includes('warp')) defaultTerminalId = 'warp';
    else if (termProgram.includes('kitty')) defaultTerminalId = 'kitty';
    else if (termProgram.includes('alacritty')) defaultTerminalId = 'alacritty';
    else if (termProgram.includes('hyper')) defaultTerminalId = 'hyper';
    else if (termProgram.includes('ghostty')) defaultTerminalId = 'ghostty';
    else defaultTerminalId = 'terminal'; // Apple Terminal
  } catch {
    defaultTerminalId = 'terminal';
  }

  for (const candidate of MACOS_TERMINALS) {
    for (const dir of appDirs) {
      const appPath = join(dir, candidate.check);
      if (await pathExists(appPath)) {
        results.push({
          id: candidate.id,
          name: candidate.name,
          path: appPath,
          isDefault: candidate.id === defaultTerminalId,
        });
        break; // Found in one dir, no need to check others
      }
    }
  }

  return results;
}

/**
 * Detect installed terminal emulators on Linux
 */
async function detectLinuxTerminals(): Promise<TerminalInfo[]> {
  const results: TerminalInfo[] = [];

  // Detect default terminal
  let defaultTerminalId: string | undefined;
  try {
    // Check common default terminal indicators
    const termProgram = process.env.TERM_PROGRAM?.toLowerCase() || '';
    const defaultEntry = LINUX_TERMINALS.find(
      (t) => termProgram.includes(t.id) || termProgram.includes(t.check)
    );
    defaultTerminalId = defaultEntry?.id;

    // Fallback: check x-terminal-emulator symlink
    if (!defaultTerminalId) {
      try {
        const resolved = await execAsync('readlink -f /usr/bin/x-terminal-emulator');
        const matchedTerminal = LINUX_TERMINALS.find((t) =>
          resolved.toLowerCase().includes(t.check)
        );
        defaultTerminalId = matchedTerminal?.id;
      } catch {
        // x-terminal-emulator not available
      }
    }
  } catch {
    // Ignore
  }

  for (const candidate of LINUX_TERMINALS) {
    try {
      const cmdPath = await execAsync(`which ${candidate.check}`);
      if (cmdPath) {
        results.push({
          id: candidate.id,
          name: candidate.name,
          path: cmdPath,
          isDefault: candidate.id === defaultTerminalId,
        });
      }
    } catch {
      // Not installed
    }
  }

  return results;
}

/**
 * Detect installed terminal emulators on Windows
 */
async function detectWindowsTerminals(): Promise<TerminalInfo[]> {
  const results: TerminalInfo[] = [];

  const searchPaths = [
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps') : '',
    process.env.PROGRAMFILES || 'C:\\Program Files',
    process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)',
    process.env.SYSTEMROOT ? join(process.env.SYSTEMROOT, 'System32') : 'C:\\Windows\\System32',
  ].filter(Boolean);

  // Git Bash specific paths
  const gitBashPaths = [
    join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Git', 'git-bash.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Git', 'git-bash.exe'),
  ];

  for (const candidate of WINDOWS_TERMINALS) {
    let found = false;

    // Special handling for Git Bash
    if (candidate.id === 'git-bash') {
      for (const gitPath of gitBashPaths) {
        if (await pathExists(gitPath)) {
          results.push({
            id: candidate.id,
            name: candidate.name,
            path: gitPath,
            isDefault: false,
          });
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    // Check with `where` command (Windows equivalent of `which`)
    try {
      const cmdPath = await execAsync(`where ${candidate.check}`);
      const firstPath = cmdPath.split('\n')[0].trim();
      if (firstPath) {
        results.push({
          id: candidate.id,
          name: candidate.name,
          path: firstPath,
          isDefault: candidate.id === 'windows-terminal', // WT is default if installed
        });
        continue;
      }
    } catch {
      // Not found via where
    }

    // Search common paths
    for (const dir of searchPaths) {
      try {
        const files = await readdir(dir);
        if (files.some((f) => f.toLowerCase() === candidate.check.toLowerCase())) {
          results.push({
            id: candidate.id,
            name: candidate.name,
            path: join(dir, candidate.check),
            isDefault: candidate.id === 'windows-terminal',
          });
          found = true;
          break;
        }
      } catch {
        // Can't read directory
      }
    }
  }

  // If no default was marked and Windows Terminal isn't installed, mark cmd as default
  if (results.length > 0 && !results.some((r) => r.isDefault)) {
    const cmd = results.find((r) => r.id === 'cmd');
    if (cmd) cmd.isDefault = true;
  }

  return results;
}

/**
 * Detect installed terminal emulators (cross-platform)
 */
async function detectTerminals(): Promise<TerminalInfo[]> {
  try {
    switch (platform()) {
      case 'darwin':
        return detectMacOSTerminals();
      case 'linux':
        return detectLinuxTerminals();
      case 'win32':
        return detectWindowsTerminals();
      default:
        return [];
    }
  } catch {
    return [];
  }
}

// ── IDE Detection ─────────────────────────────────────────────────────

interface IDEInfo {
  id: string;
  name: string;
  path: string;
}

interface IDECandidate {
  id: string;
  name: string;
  /** macOS: app bundle name, Linux/Windows: command name */
  macApp?: string;
  command?: string;
  /** Windows-specific exe name */
  winExe?: string;
}

const IDE_CANDIDATES: IDECandidate[] = [
  {
    id: 'vscode',
    name: 'VS Code',
    macApp: 'Visual Studio Code.app',
    command: 'code',
    winExe: 'Code.exe',
  },
  { id: 'cursor', name: 'Cursor', macApp: 'Cursor.app', command: 'cursor', winExe: 'Cursor.exe' },
  {
    id: 'windsurf',
    name: 'Windsurf',
    macApp: 'Windsurf.app',
    command: 'windsurf',
    winExe: 'Windsurf.exe',
  },
  {
    id: 'webstorm',
    name: 'WebStorm',
    macApp: 'WebStorm.app',
    command: 'webstorm',
    winExe: 'webstorm64.exe',
  },
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    macApp: 'IntelliJ IDEA.app',
    command: 'idea',
    winExe: 'idea64.exe',
  },
  { id: 'zed', name: 'Zed', macApp: 'Zed.app', command: 'zed', winExe: 'zed.exe' },
  {
    id: 'sublime',
    name: 'Sublime Text',
    macApp: 'Sublime Text.app',
    command: 'subl',
    winExe: 'sublime_text.exe',
  },
  { id: 'neovim', name: 'Neovim', command: 'nvim' },
  { id: 'vim', name: 'Vim', command: 'vim' },
  { id: 'emacs', name: 'Emacs', macApp: 'Emacs.app', command: 'emacs' },
];

/**
 * Detect installed IDEs on macOS
 */
async function detectMacOSIDEs(): Promise<IDEInfo[]> {
  const results: IDEInfo[] = [];
  const appDirs = ['/Applications', join(homedir(), 'Applications')];

  for (const candidate of IDE_CANDIDATES) {
    // Check .app bundle first
    if (candidate.macApp) {
      let found = false;
      for (const dir of appDirs) {
        const appPath = join(dir, candidate.macApp);
        if (await pathExists(appPath)) {
          results.push({ id: candidate.id, name: candidate.name, path: appPath });
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    // Fallback to CLI command
    if (candidate.command) {
      try {
        const cmdPath = await execAsync(`which ${candidate.command}`);
        if (cmdPath) {
          results.push({ id: candidate.id, name: candidate.name, path: cmdPath });
        }
      } catch {
        // Not installed
      }
    }
  }

  return results;
}

/**
 * Detect installed IDEs on Linux
 */
async function detectLinuxIDEs(): Promise<IDEInfo[]> {
  const results: IDEInfo[] = [];

  for (const candidate of IDE_CANDIDATES) {
    if (!candidate.command) continue;
    try {
      const cmdPath = await execAsync(`which ${candidate.command}`);
      if (cmdPath) {
        results.push({ id: candidate.id, name: candidate.name, path: cmdPath });
      }
    } catch {
      // Not installed
    }
  }

  return results;
}

/**
 * Detect installed IDEs on Windows
 */
async function detectWindowsIDEs(): Promise<IDEInfo[]> {
  const results: IDEInfo[] = [];

  for (const candidate of IDE_CANDIDATES) {
    const checkName = candidate.winExe || candidate.command;
    if (!checkName) continue;

    try {
      const cmdPath = await execAsync(`where ${checkName}`);
      const firstPath = cmdPath.split('\n')[0].trim();
      if (firstPath) {
        results.push({ id: candidate.id, name: candidate.name, path: firstPath });
      }
    } catch {
      // Not installed
    }
  }

  return results;
}

/**
 * Detect installed IDEs (cross-platform)
 */
async function detectIDEs(): Promise<IDEInfo[]> {
  try {
    switch (platform()) {
      case 'darwin':
        return detectMacOSIDEs();
      case 'linux':
        return detectLinuxIDEs();
      case 'win32':
        return detectWindowsIDEs();
      default:
        return [];
    }
  } catch {
    return [];
  }
}

// ── Config Management ───────────────────────────────────────────────────

/**
 * Read application config from ~/.matrix/config.json
 */
async function readConfig(): Promise<Record<string, unknown>> {
  try {
    const data = await readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { onboarding_completed: false };
  }
}

/**
 * Write application config to ~/.matrix/config.json (merge with existing)
 */
async function writeConfig(config: Record<string, unknown>): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }

  // Merge with existing config
  let existing: Record<string, unknown> = {};
  try {
    const data = await readFile(CONFIG_PATH, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // No existing config
  }

  const merged = { ...existing, ...config };
  await writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2), { mode: 0o600 });
}

// ── IPC Handler Registration ────────────────────────────────────────────

/**
 * Register IPC handlers for system checks and config management
 */
export function setupSystemCheckHandlers(): void {
  // Check if a CLI command exists and get version info
  ipcMain.handle('system:check-command', async (_event, command: string) => {
    return checkCommand(command);
  });

  // Detect installed terminal emulators
  ipcMain.handle('system:detect-terminals', async () => {
    return detectTerminals();
  });

  // Detect installed IDEs / code editors
  ipcMain.handle('system:detect-ides', async () => {
    return detectIDEs();
  });

  // Read application config
  ipcMain.handle('config:read', async () => {
    return readConfig();
  });

  // Write application config (merge with existing)
  ipcMain.handle('config:write', async (_event, config: Record<string, unknown>) => {
    await writeConfig(config);
    return { success: true };
  });

  // Open URL in default browser (only allow http/https)
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http/https URLs are allowed');
    }
    await shell.openExternal(url);
  });
}
