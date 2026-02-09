# Maxtix - Electron + Python Desktop Application

A modern desktop application framework combining Electron with a Python backend, featuring type-safe IPC communication, React UI with shadcn/ui components, and TailwindCSS v4 styling.

## 📋 Prerequisites

### Required Software

- **Node.js** 20+ (see `.nvmrc`)
- **Python** 3.12+ (see `.python-version`)
- **pnpm** (Node package manager)
- **uv** (Python package manager)

### Installation

#### macOS (using Homebrew)

```bash
# Install Node.js with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install Python with pyenv
brew install pyenv
pyenv install 3.12
pyenv local 3.12

# Install pnpm
npm install -g pnpm

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Linux (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt-get install -y python3.12 python3.12-venv

# Install pnpm
sudo npm install -g pnpm

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 🚀 Quick Start

### 1. Install Node Dependencies

```bash
pnpm install
```

This installs all workspace dependencies including:

- Electron and electron-vite for the desktop app
- React 18 with TypeScript
- TailwindCSS v4
- shadcn/ui components
- And all development tools

### 2. Set Up Python Environment

```bash
cd apps/backend
uv sync
cd ../..
```

This creates a Python virtual environment and installs dependencies:

- pytest (testing framework)
- ruff (linter)

### 3. Verify Type Checking

```bash
pnpm type-check
```

Expected output: All TypeScript files compile without errors.

### 4. Test Python Backend Standalone

```bash
cd apps/backend
uv run python src/main.py
```

Expected output: `OK`

### 5. Start Development

```bash
pnpm dev
```

Expected behavior:

- Electron window opens displaying the Maxtix UI
- React app loads with "Maxtix" heading and a styled button
- Hot Module Replacement (HMR) enabled for development

## 🧪 Testing IPC Communication

The application includes an IPC (Inter-Process Communication) test to verify the Electron-Python bridge is working:

### Automated Test (Recommended)

1. Run `pnpm dev` to start the development server
2. Click the **"Test IPC Connection"** button in the UI
3. Verify a success message appears with JSON response: `{"message": "pong"}`

### Manual Test

Send a JSON message directly:

```bash
# Terminal 1: Start the app
pnpm dev

# Terminal 2: Send a test message (while app is running)
echo '{"type":"ping"}' | uv run python apps/backend/src/main.py
```

Expected output: `{"success":true,"data":{"message":"pong"}}`

## 🏗️ Project Structure

```
maxtix/
├── apps/
│   ├── desktop/                # Electron desktop application
│   │   ├── src/
│   │   │   ├── main/          # Main process (Electron control)
│   │   │   │   ├── index.ts   # App lifecycle & window management
│   │   │   │   └── ipc.ts     # IPC bridge to Python
│   │   │   ├── preload/       # Preload script (security bridge)
│   │   │   │   └── index.ts   # Exposes secure API to renderer
│   │   │   └── renderer/      # React UI
│   │   │       ├── App.tsx
│   │   │       ├── main.tsx
│   │   │       ├── index.css
│   │   │       └── components/
│   │   └── electron.vite.config.ts
│   │
│   └── backend/               # Python backend
│       ├── src/
│       │   ├── main.py       # Entry point with IPC processing
│       │   └── ipc/
│       │       ├── __init__.py
│       │       └── handler.py # Message routing & processing
│       └── pyproject.toml
│
├── packages/
│   └── shared/               # Shared types
│       ├── src/
│       │   ├── index.ts      # Type exports
│       │   └── types/
│       │       └── ipc.ts    # IPCMessage, IPCResponse types
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml       # Monorepo workspace config
├── package.json              # Root package configuration
├── turbo.json                # Turborepo task pipeline
├── .eslintrc.json            # ESLint configuration
├── .prettierrc                # Code formatting rules
├── .nvmrc                     # Node.js version
├── .python-version           # Python version
└── tsconfig.json             # TypeScript root config
```

## 📦 Available Commands

### Development

```bash
# Start development server (Electron + HMR)
pnpm dev

# Type checking
pnpm type-check

# Linting and formatting
pnpm lint
pnpm format

# Clean build artifacts
pnpm clean
```

### Building

```bash
# Build all packages (Turborepo)
pnpm build

# Build only the desktop app
cd apps/desktop
pnpm build

# Build shared types
cd packages/shared
pnpm build
```

### Python

```bash
# Run Python backend standalone
cd apps/backend
uv run python src/main.py

# Run tests
cd apps/backend
uv run pytest

# Lint Python code
cd apps/backend
uv run ruff check src/
```

## 🔌 IPC Communication

### How It Works

```
React Component (Renderer)
  ↓ window.api.sendMessage({ type: "ping" })
Electron Preload Script
  ↓ ipcRenderer.invoke("ipc:send-to-python")
Electron Main Process
  ↓ setupIPCHandlers()
Python via python-shell
  ↓ uv run python
Python Backend
  ↓ main.py reads JSON from stdin
IPC Handler
  ↓ handle_message() routes & processes
Response
  ↓ JSON output to stdout
Electron Main Process
  ↓ Returns response
React Component
  ↓ Display result
```

### Message Format

**Request** (JavaScript → Python):

```json
{
  "type": "ping"
}
```

**Response** (Python → JavaScript):

```json
{
  "success": true,
  "data": {
    "message": "pong"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## 🔐 Security Features

- ✅ **Electron Context Isolation**: Renderer process has no direct access to Node.js
- ✅ **Preload Script**: Secure bridge using `contextBridge` to expose controlled API
- ✅ **No eval()**: Dynamic code execution disabled
- ✅ **Content Security Policy**: Configured in HTML
- ✅ **IPC Validation**: All messages validated before processing
- ✅ **Type Safety**: Full TypeScript strict mode prevents type-related vulnerabilities

## 📚 Technology Stack

### Frontend

- **Electron** 28+ - Desktop application framework
- **electron-vite** - Optimized Vite configuration for Electron
- **React** 18 - UI library
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** v4 - Utility-first CSS framework (CSS @import syntax)
- **shadcn/ui** - High-quality UI components
- **CVA** (Class Variance Authority) - Component variant system

### Backend

- **Python** 3.12 - Backend runtime
- **uv** - Fast Python package management
- **pytest** - Testing framework
- **ruff** - Python linter

### Build & Development

- **Turborepo** - Monorepo task orchestration
- **pnpm** - Fast, disk-efficient package manager
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting

## 🧪 Testing

### Type Safety Tests

```bash
pnpm type-check
```

Ensures all TypeScript files compile correctly with strict mode enabled.

### Python Tests

```bash
cd apps/backend
uv run pytest
```

Runs unit tests for Python components.

### Integration Tests

```bash
pnpm dev
# Then manually:
# 1. Verify Electron window opens
# 2. Click "Test IPC Connection" button
# 3. Verify success message and JSON response appear
# 4. Check browser console (F12) for no errors
```

## 🐛 Troubleshooting

### Port Already in Use

If you see "Port 5173 is already in use" or similar:

```bash
# macOS/Linux: Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
VITE_PORT=5174 pnpm dev
```

### Python Not Found

If you see "python-shell: command not found":

```bash
# Verify uv is installed
which uv

# Verify Python is available
python3 --version

# Try with explicit python path
cd apps/desktop
# Edit src/main/ipc.ts and update pythonPath if needed
```

### Module Not Found in Python

```bash
# Ensure Python dependencies are synced
cd apps/backend
uv sync
cd ../..
```

### Electron Window Doesn't Open

```bash
# Clear build artifacts and reinstall
pnpm clean
pnpm install
pnpm dev
```

### TypeScript Errors

```bash
# Rebuild all TypeScript files
pnpm type-check

# If still errors, check imports:
# - Ensure @maxtix/shared is properly installed
# - Verify path aliases in tsconfig.json
# - Check workspace:* dependencies in package.json
```

## 📝 Development Guide

### Adding a New IPC Handler

1. **Python side** (`apps/backend/src/ipc/handler.py`):

```python
def handle_message(message: dict[str, Any]) -> dict[str, Any]:
    message_type = message.get("type", "unknown")

    if message_type == "ping":
        return {"success": True, "data": {"message": "pong"}}

    if message_type == "my-new-handler":  # Add new handler
        return {"success": True, "data": {"result": "processed"}}

    return {
        "success": False,
        "error": f"Unknown message type: {message_type}",
    }
```

2. **Frontend side** (`apps/desktop/src/renderer/App.tsx`):

```typescript
const handleTest = async () => {
  setLoading(true);
  try {
    const response = await window.api.sendMessage({ type: 'my-new-handler' });
    setResponse(response);
  } catch (error) {
    setResponse({ success: false, error: String(error) });
  } finally {
    setLoading(false);
  }
};
```

### Adding a New UI Component

1. Create component in `apps/desktop/src/renderer/components/`
2. Use TypeScript and React hooks
3. Style with TailwindCSS utility classes
4. For complex UI, use shadcn/ui component library

Example:

```typescript
// components/Counter.tsx
import { useState } from 'react';
import { Button } from './ui/button';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => setCount(count - 1)}>-</Button>
      <span className="font-semibold">{count}</span>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </div>
  );
}
```

## 📄 Environment Variables

Create a `.env` file in `apps/desktop` if needed:

```bash
# Development
VITE_API_URL=http://localhost:3000
NODE_ENV=development
```

## 🤝 Contributing

### Code Style

- Use Prettier for formatting: `pnpm format`
- Use ESLint for linting: `pnpm lint`
- Follow TypeScript strict mode
- Add docstrings and JSDoc comments
- Keep commits focused and descriptive

### Before Committing

```bash
# Run all checks
pnpm lint
pnpm type-check
pnpm build

# Or use the quick check
pnpm dev  # Should start without errors
```

## 📦 Monorepo Structure

This is a **Turborepo** monorepo with:

- **Root** (`./`): Configuration, scripts, dependencies
- **Apps** (`./apps/`): Runnable applications (Electron desktop, Python backend)
- **Packages** (`./packages/`): Reusable libraries (shared types, UI components)

### Workspace Scripts

Run commands across all workspaces:

```bash
# Type-check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Build all packages (respects task dependencies)
pnpm build

# Clean all build artifacts
pnpm clean
```

## 📄 License

This is a demonstration project for Maxtix project initialization.

## 🆘 Support

For issues or questions:

1. Check this README's Troubleshooting section
2. Review the QA session summaries for known issues
3. Check the implementation plan for architecture details
4. Review docstrings in source code for specific components

---

**Last Updated**: 2026-02-06
**Status**: Production Ready ✓
**QA Approval**: Sessions 4 & 5 - APPROVED FOR PRODUCTION
