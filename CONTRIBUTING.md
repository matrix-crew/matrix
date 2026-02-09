# Contributing to Matrix

Thanks for your interest in contributing! This guide covers everything you need to get started developing Matrix.

## Prerequisites

- **Node.js** 20+ (see `.nvmrc`)
- **Python** 3.12+ (see `.python-version`)
- **pnpm** — Node package manager
- **uv** — Python package manager

### macOS (Homebrew)

```bash
# Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20 && nvm use 20

# Python
brew install pyenv
pyenv install 3.12 && pyenv local 3.12

# Package managers
npm install -g pnpm
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Linux (Ubuntu/Debian)

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python
sudo apt-get install -y python3.12 python3.12-venv

# Package managers
sudo npm install -g pnpm
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Installation

```bash
# Clone the repository
git clone https://github.com/matrix-crew/matrix.git
cd matrix

# Install Node dependencies
pnpm install

# Set up Python environment
cd apps/backend && uv sync && cd ../..

# Verify everything works
pnpm type-check
```

## Development

```bash
# Start dev server (Electron + HMR)
pnpm dev

# Type checking
pnpm type-check

# Lint all packages
pnpm lint

# Format with Prettier
pnpm format

# Build all packages
pnpm build

# Clean build artifacts
pnpm clean
```

### Python Backend

```bash
cd apps/backend

# Run standalone (prints "OK")
uv run python src/main.py

# Run tests
uv run pytest -v

# Lint
uv run ruff check src/

# Format
uv run ruff format src/
```

### Environment Variables

Create `.env` in `apps/desktop/` if needed:

```bash
VITE_API_URL=http://localhost:3000
NODE_ENV=development
```

Available in renderer as `import.meta.env.VITE_*`.

## Project Structure

```
matrix/
├── apps/
│   ├── desktop/                # Electron desktop application
│   │   ├── src/
│   │   │   ├── main/          # Main process (Electron)
│   │   │   │   ├── index.ts   # App lifecycle & window management
│   │   │   │   └── ipc.ts     # IPC bridge to Python
│   │   │   ├── preload/       # Security bridge (contextBridge)
│   │   │   │   └── index.ts
│   │   │   ├── renderer/      # React UI
│   │   │   │   ├── App.tsx
│   │   │   │   ├── components/
│   │   │   │   └── services/
│   │   │   └── shared/        # Shared types (main + preload + renderer)
│   │   │       └── types/
│   │   └── electron.vite.config.ts
│   │
│   └── backend/               # Python backend
│       ├── src/
│       │   ├── main.py        # Entry point (stdin JSON → stdout JSON)
│       │   └── ipc/
│       │       └── handler.py # Message routing
│       ├── tests/
│       └── pyproject.toml
│
├── turbo.json                 # Turborepo pipeline config
├── pnpm-workspace.yaml        # Workspace definitions
└── package.json
```

**Path aliases:** `@/*` → `src/renderer/*`, `@shared/*` → `src/shared/*`

## Architecture

### IPC Communication

The app uses type-safe IPC between Electron and Python:

```
React Component (Renderer)
  ↓ window.api.sendMessage({ type: "ping" })
Preload Script (contextBridge)
  ↓ ipcRenderer.invoke("ipc:send-to-python")
Main Process (ipc.ts)
  ↓ python-shell with uv
Python Backend (handler.py)
  ↓ handle_message() routes by type
Response (JSON via stdout)
  ↓ flows back through the chain
React Component
```

Each IPC call spawns a new Python process that reads one JSON line from stdin, processes it, writes one JSON response to stdout, and exits.

**Message format:**

```json
// Request (JS → Python)
{ "type": "ping" }

// Success response (Python → JS)
{ "success": true, "data": { "message": "pong" } }

// Error response
{ "success": false, "error": "Error description" }
```

### Terminal Architecture

The embedded terminal uses **node-pty** (main process) + **xterm.js** (renderer) with direct Electron IPC (not Python):

```
TerminalManager (React)
  ↓ terminalService.createTerminal()
TerminalService (Renderer singleton)
  ↓ window.api.terminal.create()
Preload Bridge (contextBridge)
  ↓ ipcRenderer.invoke('terminal:create')
TerminalManagerMain (Main process)
  ↓ node-pty spawn
PTY Process (/bin/zsh, etc.)
```

**Key design decisions:**

- **Always-mounted**: Uses `visibility: hidden` (not `display: none`) when inactive to preserve PTY sessions
- **Max 12 sessions**: Dynamic gap-free grid with top-heavy row distribution
- **Workspace-scoped persistence**: Sessions saved to `~/.matrix/{slug}/terminals/`

### Security

- **Context Isolation**: Renderer has no direct Node.js access
- **Preload Script**: `contextBridge` exposes a controlled API
- **IPC Validation**: All messages validated before processing
- **TypeScript Strict Mode**: Full strict type checking

## Adding New IPC Handlers

### 1. Define TypeScript types

In `apps/desktop/src/shared/types/ipc.ts`:

```typescript
export interface MyNewMessage extends IPCMessage {
  type: 'my-handler';
  data?: { someField: string };
}
```

### 2. Add Python handler

In `apps/backend/src/ipc/handler.py`:

```python
if message_type == "my-handler":
    data = message.get("data", {})
    return {"success": True, "data": {"result": "processed"}}
```

### 3. Use in React

```typescript
const response = await window.api.sendMessage({
  type: 'my-handler',
  data: { someField: 'value' },
});
```

### 4. Write tests (required)

- **Python**: Add tests in `apps/backend/tests/` covering success, error, and edge cases
- **Types**: Add contract tests in `apps/desktop/src/shared/types/ipc.test.ts`
- **React**: Add component tests if a UI component consumes the handler

## Testing

### Test Stack

| Layer       | Tool                           | Location                        |
| ----------- | ------------------------------ | ------------------------------- |
| TS Unit     | Vitest + React Testing Library | `*.test.ts(x)` alongside source |
| Python Unit | pytest                         | `apps/backend/tests/`           |
| E2E         | Playwright                     | `apps/desktop/e2e/`             |

### Running Tests

```bash
# All TypeScript tests
pnpm test

# Desktop app tests
cd apps/desktop && pnpm test

# Watch mode
cd apps/desktop && pnpm test:watch

# Python tests
cd apps/backend && uv run pytest -v

# E2E (requires built app)
cd apps/desktop && pnpm build && pnpm test:e2e
```

### Test Patterns

**Mocking IPC in React tests:**

```typescript
vi.mocked(window.api.sendMessage).mockImplementation(async (msg) => {
  if (msg.type === 'my-handler') {
    return { success: true, data: { result: 'value' } };
  }
  return { success: true, data: {} };
});
```

**Python handler tests with in-memory DB:**

```python
@pytest.fixture(autouse=True)
def use_memory_db():
    engine = get_engine(":memory:")
    init_db(engine)
    with patch("src.ipc.handler.get_engine", return_value=engine), \
         patch("src.ipc.handler.init_db"):
        yield
```

### CI/CD

GitHub Actions runs on pushes to `main` and all PRs:

- **test-typescript**: Install → Build → Lint → Type-check → Test
- **test-python**: Install → Ruff lint → Ruff format check → pytest
- **e2e**: (after both above) Build → Playwright → E2E tests

## Pre-Commit Hooks

The project uses **Husky + lint-staged** (JS/TS) and **pre-commit** (Python).

**Automatic (Husky):** Runs on every commit — Prettier, ESLint auto-fix, TypeScript type-check, Ruff (if installed).

**Python setup (one-time):**

```bash
pip install pre-commit
pre-commit install
```

## Code Style

- **Formatting**: Prettier (`pnpm format`)
- **Linting**: ESLint (`pnpm lint`), Ruff for Python
- **TypeScript**: Strict mode enabled
- **CSS**: TailwindCSS v4 with `@import 'tailwindcss'` syntax
- **Components**: shadcn/ui patterns with `cva` for variants and `cn()` for class merging

### Before Committing

```bash
pnpm lint
pnpm type-check
pnpm build
```

## Troubleshooting

### Port 5173 already in use

```bash
lsof -ti:5173 | xargs kill -9
# Or use a different port
VITE_PORT=5174 pnpm dev
```

### "uv: command not found"

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Python dependencies not found

```bash
cd apps/backend && uv sync
```

### Electron window doesn't open

```bash
pnpm clean
pnpm install
pnpm dev
```

### TypeScript errors

```bash
pnpm type-check
# If errors persist, check:
# - Path aliases in tsconfig.json
# - workspace:* dependencies in package.json
```

### Testing IPC manually

```bash
# Start the app
pnpm dev

# In another terminal
echo '{"type":"ping"}' | uv run python apps/backend/src/main.py
# Expected: {"success":true,"data":{"message":"pong"}}
```
