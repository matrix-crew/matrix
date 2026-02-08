import { app, BrowserWindow } from 'electron';
import { mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { setupIPCHandlers } from './ipc';

const MATRIX_WORKSPACE_DIR = '.matrix';

function initializeWorkspace(): void {
  const workspacePath = join(homedir(), MATRIX_WORKSPACE_DIR);

  if (!existsSync(workspacePath)) {
    try {
      mkdirSync(workspacePath, { recursive: true });
      console.log(`Matrix workspace initialized: ${workspacePath}`);
    } catch (error) {
      console.error('Failed to create Matrix workspace:', error);
    }
  }
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
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
  // Initialize Matrix workspace directory
  initializeWorkspace();

  // Initialize IPC handlers for Python backend communication
  setupIPCHandlers();

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
