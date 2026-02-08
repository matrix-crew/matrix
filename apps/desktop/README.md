# @maxtix/desktop

Maxtix Electron desktop application - AI agent execution interface.

## Overview

The Maxtix desktop application is an Electron-based UI that provides a modern, responsive interface for AI agent execution. It features:

- Electron 28+ for cross-platform desktop support
- React 18 with TypeScript for type-safe UI development
- TailwindCSS v4 for modern styling
- Type-safe IPC communication with Python backend
- Hot Module Replacement (HMR) for fast development

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm package manager
- Python 3.12+ (for backend)
- uv (Python package manager)

### Development

From the project root:

```bash
# Start development server
pnpm dev
```

This will:

1. Start the Vite dev server for the renderer process
2. Launch Electron with hot reload enabled
3. Watch for file changes and rebuild automatically

From the desktop app directory:

```bash
cd apps/desktop
pnpm dev
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

The build output is located in:

- `out/main/` - Main process
- `out/preload/` - Preload script
- `out/renderer/` - Renderer process

## Project Structure

```
apps/desktop/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App lifecycle and window management
│   │   └── ipc.ts         # IPC handlers for Python communication
│   │
│   ├── preload/           # Electron preload script
│   │   ├── index.ts       # Context bridge API
│   │   └── index.d.ts     # Type definitions for renderer
│   │
│   └── renderer/          # React UI (renderer process)
│       ├── App.tsx        # Main application component
│       ├── main.tsx       # React entry point
│       ├── index.css      # Global styles with TailwindCSS
│       ├── components/    # UI components
│       └── index.html     # HTML entry point
│
├── electron.vite.config.ts  # Vite configuration for Electron
├── package.json
└── tsconfig.json
```

## Architecture

### Three-Process Model

1. **Main Process** (`src/main/`)
   - Controls application lifecycle
   - Manages windows and system integration
   - Handles IPC with Python backend
   - No direct DOM access

2. **Preload Script** (`src/preload/`)
   - Secure bridge between main and renderer
   - Exposes controlled API via `contextBridge`
   - Provides type-safe IPC methods

3. **Renderer Process** (`src/renderer/`)
   - React UI running in Chromium
   - No Node.js access (context isolation enabled)
   - Communicates via preload-exposed API

### IPC Communication Flow

```
React Component (Renderer)
  ↓ window.api.sendMessage()
Preload Script (contextBridge)
  ↓ ipcRenderer.invoke()
Main Process
  ↓ python-shell
Python Backend
  ↓ JSON response
Main Process
  ↓ Return
Preload Script
  ↓ Return
React Component
```

## Development Guide

### Adding IPC Methods

#### 1. Main Process (`src/main/ipc.ts`)

```typescript
import { ipcMain } from 'electron';

export function setupIPCHandlers() {
  ipcMain.handle('ipc:my-method', async (event, data) => {
    // Handle communication with Python
    return { success: true, data: result };
  });
}
```

#### 2. Preload Script (`src/preload/index.ts`)

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  myMethod: (data: any) => ipcRenderer.invoke('ipc:my-method', data),
});
```

#### 3. Type Definitions (`src/preload/index.d.ts`)

```typescript
export interface IElectronAPI {
  myMethod: (data: any) => Promise<any>;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
```

#### 4. React Component

```typescript
import { useState } from 'react';

export function MyComponent() {
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    const response = await window.api.myMethod({ key: 'value' });
    setResult(response);
  };

  return <button onClick={handleClick}>Call IPC</button>;
}
```

### Using Shared Packages

#### @maxtix/shared (Types)

```typescript
import type { IPCMessage, IPCResponse } from '@maxtix/shared';

const message: IPCMessage = { type: 'ping' };
```

#### @maxtix/ui (Components)

```typescript
import { Button } from '@maxtix/ui';

export function App() {
  return <Button>Click Me</Button>;
}
```

### Styling with TailwindCSS v4

The app uses TailwindCSS v4 with CSS `@import` syntax:

```css
/* src/renderer/index.css */
@import 'tailwindcss';
```

Use utility classes in components:

```typescript
export function Card() {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Title</h2>
    </div>
  );
}
```

## Available Scripts

### Development

```bash
# Start development server with HMR
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Configuration

### Electron Vite Config

The `electron.vite.config.ts` file configures:

- **Main process**: TypeScript compilation, external dependencies
- **Preload script**: TypeScript compilation, Node.js integration
- **Renderer**: React, TailwindCSS v4, Vite plugins

### Window Settings

Main window configuration in `src/main/index.ts`:

```typescript
const mainWindow = new BrowserWindow({
  width: 900,
  height: 670,
  show: false,
  autoHideMenuBar: true,
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false,
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

## Security

### Enabled Features

- ✅ **Context Isolation**: Renderer has no direct Node.js access
- ✅ **Preload Script**: Controlled API via `contextBridge`
- ✅ **No Remote Module**: Remote module disabled
- ✅ **Content Security Policy**: Configured in HTML
- ✅ **IPC Validation**: All messages validated

### Security Best Practices

```typescript
// ✅ GOOD: Use contextBridge
contextBridge.exposeInMainWorld('api', { ... });

// ❌ BAD: Don't expose Node.js directly
contextBridge.exposeInMainWorld('fs', require('fs'));

// ✅ GOOD: Validate IPC input
ipcMain.handle('my-handler', async (event, data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input');
  }
  // Process data
});
```

## Debugging

### Renderer DevTools

The DevTools are automatically opened in development:

```typescript
// src/main/index.ts
if (is.dev) {
  mainWindow.webContents.openDevTools();
}
```

### Main Process Debugging

Use VS Code launch configuration or:

```bash
# Run with inspect flag
electron --inspect=5858 .
```

### IPC Debugging

Add logging to track IPC calls:

```typescript
// Main process
ipcMain.handle('ipc:send-to-python', async (event, message) => {
  console.log('IPC received:', message);
  const result = await pythonShell.send(message);
  console.log('IPC response:', result);
  return result;
});
```

## Troubleshooting

### Electron Window Not Opening

```bash
# Clear cache and rebuild
pnpm clean
pnpm install
pnpm dev
```

### Python Backend Connection Issues

Check IPC configuration in `src/main/ipc.ts`:

```typescript
const pythonShell = new PythonShell('main.py', {
  mode: 'json',
  pythonPath: 'uv',
  pythonOptions: ['run', 'python'],
  scriptPath: join(__dirname, '../../../backend'),
});
```

### HMR Not Working

Ensure Vite dev server is running:

```bash
# Check if port 5173 is in use
lsof -ti:5173

# Kill process if needed
lsof -ti:5173 | xargs kill -9
```

### TypeScript Errors

```bash
# Check all TypeScript files
pnpm type-check

# Rebuild workspace dependencies
cd ../..
pnpm install
pnpm build
```

## Environment Variables

Create `.env` file if needed:

```bash
# Development
VITE_API_URL=http://localhost:3000
NODE_ENV=development

# Python backend path (if custom)
PYTHON_BACKEND_PATH=/path/to/custom/backend
```

## Testing

### Manual Testing

1. Start development server: `pnpm dev`
2. Verify window opens
3. Test IPC: Click "Test IPC Connection" button
4. Check console for errors (F12)

### Integration Testing

Test IPC communication:

```bash
# Terminal 1: Start app
pnpm dev

# Terminal 2: Test Python backend directly
echo '{"type":"ping"}' | uv run python apps/backend/src/main.py
```

Expected output: `{"success":true,"data":{"message":"pong"}}`

## Performance

### Production Optimization

The build process optimizes:

- Code splitting for faster loading
- Minification of JavaScript and CSS
- Tree shaking to remove unused code
- Asset optimization (images, fonts)

### Bundle Analysis

```bash
# Build and analyze bundle size
pnpm build
```

Check `out/` directory for generated files and sizes.

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Add JSDoc comments for complex functions

### Before Committing

```bash
# Run all checks
pnpm lint
pnpm type-check
pnpm build
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-vite](https://electron-vite.org/)
- [React Documentation](https://react.dev/)
- [TailwindCSS v4](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/)

## License

Part of the Maxtix monorepo project.
