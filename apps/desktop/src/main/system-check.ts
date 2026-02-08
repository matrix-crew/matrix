/**
 * System Check & Config Management
 *
 * Handles system-level operations for the onboarding wizard:
 * - CLI command detection (which + --version)
 * - Application config read/write (~/.matrix/config.json)
 * - External URL opening
 *
 * Runs in the Electron main process only.
 */

import { ipcMain, shell } from 'electron';
import { exec } from 'child_process';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

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
 * Execute a shell command and return stdout
 */
function execAsync(cmd: string, timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout, shell: process.env.SHELL || '/bin/zsh' }, (error, stdout, stderr) => {
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
 * Write application config to ~/.matrix/config.json
 */
async function writeConfig(config: Record<string, unknown>): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/**
 * Register IPC handlers for system checks and config management
 */
export function setupSystemCheckHandlers(): void {
  // Check if a CLI command exists and get version info
  ipcMain.handle('system:check-command', async (_event, command: string) => {
    return checkCommand(command);
  });

  // Read application config
  ipcMain.handle('config:read', async () => {
    return readConfig();
  });

  // Write application config
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
