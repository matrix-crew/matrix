import { app, BrowserWindow } from 'electron';
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { setupIPCHandlers } from './ipc';
import { setupSystemCheckHandlers } from './system-check';
import { setupTerminalHandlers } from './terminal-manager';

const MATRIX_WORKSPACE_DIR = '.matrix';

/** Application paths for database and workspace */
interface AppPaths {
  /** Path to the SQLite database file (OS-standard app data directory) */
  dbPath: string;
  /** Path to the workspace root for matrix spaces ($HOME/.matrix/) */
  workspacePath: string;
}

let appPaths: AppPaths;

function initializeAppPaths(): void {
  // OS-standard app data directory for database
  const appDataDir = join(app.getPath('appData'), 'Matrix');
  const dbPath = join(appDataDir, 'matrix.db');

  // User workspace directory for matrix spaces
  const workspacePath = join(homedir(), MATRIX_WORKSPACE_DIR);

  // Create both directories
  mkdirSync(appDataDir, { recursive: true });
  mkdirSync(workspacePath, { recursive: true });

  appPaths = { dbPath, workspacePath };
  console.log(`Matrix app data: ${appDataDir}`);
  console.log(`Matrix workspace: ${workspacePath}`);
}

export function getAppPaths(): AppPaths {
  return appPaths;
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load the renderer process
  // electron-vite provides these environment variables
  if (process.env.ELECTRON_RENDERER_URL) {
    // Development mode - load from Vite dev server
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// App lifecycle handlers
app.whenReady().then(() => {
  // Initialize application paths (DB + workspace directories)
  initializeAppPaths();

  // Initialize IPC handlers for Python backend communication
  setupIPCHandlers();

  // Initialize system check handlers for onboarding & config
  setupSystemCheckHandlers();

  // Initialize terminal PTY handlers
  setupTerminalHandlers();

  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle any errors that might occur
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
