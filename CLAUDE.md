# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maxtix is an Electron desktop application with a Python backend, featuring type-safe IPC communication. The project is a **Turborepo monorepo** using **pnpm workspaces** with two apps:

- `apps/desktop` - Electron application (React + TailwindCSS v4)
- `apps/backend` - Python backend (managed with uv)

## Git Workflow

- **Default branch**: `develop` (NOT `main`)
- When creating PRs, always use `--base develop` or omit `--base` to follow the GitHub default branch
- Never create PRs with `main` as the base branch

## Common Commands

### Development

```bash
# Start Electron app with HMR (from root)
pnpm dev

# Start with explicit port
VITE_PORT=5174 pnpm dev

# Type checking all TypeScript
pnpm type-check

# Lint all packages
pnpm lint

# Build all packages (respects dependencies via Turborepo)
pnpm build

# Format all files with Prettier
pnpm format

# Check formatting without changes
pnpm format:check

# Clean all build artifacts
pnpm clean
```

### Pre-Commit Hooks

The project uses **Husky + lint-staged** for JavaScript/TypeScript and **pre-commit** (Python package) for Python.

**Automatic (via Husky):**

- Runs on every `git commit`
- Auto-formats staged files with Prettier (`--write`)
- Auto-fixes ESLint issues (`--fix`)
- Runs TypeScript type-checking (`tsc --noEmit`)
- Runs Ruff linting and formatting for Python files (if `pre-commit` is installed)

**Python pre-commit setup (one-time):**

```bash
pip install pre-commit
pre-commit install
```

**Manual run:**

```bash
# Run lint-staged manually
pnpm lint-staged

# Run Python pre-commit on all files
pre-commit run --all-files
```

### Python Backend

```bash
# Run Python backend standalone (verify installation)
cd apps/backend
uv run python src/main.py  # Should print "OK"

# Sync Python dependencies
cd apps/backend
uv sync

# Run Python tests
cd apps/backend
uv run pytest

# Lint Python code
cd apps/backend
uv run ruff check src/

# Format Python code
cd apps/backend
uv run ruff format src/
```

### Desktop App (Electron)

```bash
# Run from app directory
cd apps/desktop
pnpm dev

# Build for production
cd apps/desktop
pnpm build

# Type check only desktop app
cd apps/desktop
pnpm type-check
```

## Testing

### Test Requirement

**All new features and IPC handlers MUST include corresponding tests.** Pull requests without tests for new functionality will not pass CI.

### Test Stack

| Layer                     | Tool                           | Location                        |
| ------------------------- | ------------------------------ | ------------------------------- |
| TypeScript Unit/Component | Vitest + React Testing Library | `*.test.ts(x)` alongside source |
| Python Unit               | pytest                         | `apps/backend/tests/`           |
| E2E (Electron)            | Playwright                     | `apps/desktop/e2e/`             |

### Running Tests

```bash
# Run ALL TypeScript tests (via Turborepo)
pnpm test

# Run tests for desktop app
cd apps/desktop && pnpm test

# Watch mode (re-runs on file changes)
cd apps/desktop && pnpm test:watch

# Run Python tests
cd apps/backend && uv run pytest -v

# Run E2E tests (requires built app)
cd apps/desktop && pnpm build && pnpm test:e2e
```

### Writing Tests for New Features

When adding a new feature, tests are required at every layer it touches:

1. **New IPC handler** (Python): Add tests in `apps/backend/tests/` that call `handle_message()` directly with an in-memory SQLite database. Test success, error, and edge cases.

2. **New React component**: Add a `ComponentName.test.tsx` file next to the component. Mock `window.api.sendMessage` using `vi.mocked()` for IPC calls. Use `@testing-library/react` for rendering and assertions.

3. **New shared types**: Add type contract tests in `apps/desktop/src/shared/types/` that verify message structure satisfies the interfaces.

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

GitHub Actions runs automatically on pushes to `main` and on all pull requests:

- **test-typescript**: Install → Build → Lint → Type-check → Test (all TS packages)
- **test-python**: Install → Ruff lint → Ruff format check → pytest
- **e2e**: (after both above pass) Build → Playwright install → E2E tests

CI config: [.github/workflows/ci.yml](.github/workflows/ci.yml)

## Architecture

### IPC Communication Flow

The application uses a type-safe IPC bridge between Electron and Python:

```
React Component (Renderer)
  ↓ window.api.sendMessage({ type: "ping" })
Preload Script (apps/desktop/src/preload/index.ts)
  ↓ contextBridge exposes secure API
Main Process (apps/desktop/src/main/ipc.ts)
  ↓ python-shell with uv
Python Backend (apps/backend/src/main.py)
  ↓ stdin JSON → handler.py routes → stdout JSON
Response flows back through the chain
```

**Key files:**

- [apps/desktop/src/main/ipc.ts](apps/desktop/src/main/ipc.ts) - IPC bridge using python-shell
- [apps/desktop/src/preload/index.ts](apps/desktop/src/preload/index.ts) - Security boundary with contextBridge
- [apps/backend/src/main.py](apps/backend/src/main.py) - Python entry point (reads stdin, writes stdout)
- [apps/backend/src/ipc/handler.py](apps/backend/src/ipc/handler.py) - Message routing
- [apps/desktop/src/shared/types/ipc.ts](apps/desktop/src/shared/types/ipc.ts) - TypeScript types for IPC messages

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

**Data flow (bidirectional):**

- **Input**: xterm.js `onData` → `window.api.terminal.write()` → `ipcMain` → `pty.write()`
- **Output**: `pty.onData` → `ipcMain` event → `ipcRenderer` listener → `xterm.write()`

**Key files:**

- [apps/desktop/src/main/terminal-manager.ts](apps/desktop/src/main/terminal-manager.ts) - Main process PTY lifecycle + persistence IPC
- [apps/desktop/src/renderer/services/TerminalService.ts](apps/desktop/src/renderer/services/TerminalService.ts) - Renderer service singleton (session CRUD, persistence)
- [apps/desktop/src/renderer/components/terminal/TerminalManager.tsx](apps/desktop/src/renderer/components/terminal/TerminalManager.tsx) - Grid layout, workspace-scoped persistence
- [apps/desktop/src/renderer/components/terminal/TerminalInstance.tsx](apps/desktop/src/renderer/components/terminal/TerminalInstance.tsx) - xterm.js instance with forwardRef for scrollback capture
- [apps/desktop/src/shared/types/terminal.ts](apps/desktop/src/shared/types/terminal.ts) - Terminal types
- [apps/desktop/src/shared/theme/xterm-theme.ts](apps/desktop/src/shared/theme/xterm-theme.ts) - xterm.js theme/options

**Design decisions:**

- **Always-mounted**: TerminalManager uses `visibility: hidden` (not `display: none`) when inactive to preserve PTY sessions and avoid ResizeObserver flicker
- **Ref-based callbacks**: `onExit` stored in ref to prevent useEffect re-runs that would re-initialize all terminals
- **Max 12 sessions**: Dynamic gap-free grid with top-heavy row distribution
- **Matrix-scoped persistence**: Sessions saved to `~/.matrix/{slug}/terminals/` (sessions.json + scrollback files)

### Adding New IPC Handlers

1. **Define TypeScript types** in [apps/desktop/src/shared/types/ipc.ts](apps/desktop/src/shared/types/ipc.ts):

```typescript
export interface MyNewMessage extends IPCMessage {
  type: 'my-handler';
  data?: { someField: string };
}
```

2. **Add Python handler** in [apps/backend/src/ipc/handler.py](apps/backend/src/ipc/handler.py):

```python
if message_type == "my-handler":
    data = message.get("data", {})
    return {"success": True, "data": {"result": "processed"}}
```

3. **Use in React** via `window.api.sendMessage()`:

```typescript
const response = await window.api.sendMessage({ type: 'my-handler', data: { someField: 'value' } });
```

4. **Write tests** (required):
   - Add Python handler tests in `apps/backend/tests/` covering success, error, and edge cases
   - Add type contract tests in `apps/desktop/src/shared/types/ipc.test.ts` for the new message type
   - Add React component tests if a UI component consumes the new handler

### Security Architecture

- **Context Isolation**: Renderer has no direct Node.js access
- **Preload Script**: [apps/desktop/src/preload/index.ts](apps/desktop/src/preload/index.ts) uses `contextBridge` for secure API exposure
- **IPC Validation**: Main process validates all messages before sending to Python
- **TypeScript Strict Mode**: All TypeScript uses strict type checking

### Python Backend Architecture

The Python backend (`apps/backend/`) is a stateless message processor:

- **Entry Point**: [apps/backend/src/main.py](apps/backend/src/main.py) reads JSON from stdin, writes JSON to stdout
- **Handler**: [apps/backend/src/ipc/handler.py](apps/backend/src/ipc/handler.py) routes messages by `type` field
- **Standalone Mode**: Running `uv run python src/main.py` in a TTY prints "OK"
- **IPC Mode**: Running with stdin (non-TTY) processes JSON messages

Each IPC call spawns a new Python process via `python-shell`. The Python process:

1. Reads one line of JSON from stdin
2. Routes the message through `handle_message()`
3. Writes one JSON response to stdout
4. Exits

### Data Structure

All service data is implemented as Python objects with JSON serialization for persistence:

**Design Pattern:**

- **Runtime**: Python objects in `apps/backend`
- **Storage**: JSON format for all user-created objects

**User Object Types:**

- `Matrix` - Core matrix objects
- `Kanban` - Kanban boards
- `Task` - Individual tasks
- `Agent` - AI agents
- (Extensible for future object types)

**Serialization Flow:**

```
Python Object (Runtime) ↔ JSON (Storage/Transfer)
```

All user objects must implement `to_json()` and `from_json()` methods for bidirectional conversion.

### Monorepo Structure

This is a **Turborepo** monorepo with **pnpm workspaces**:

- **Root** scripts run across all workspaces (via `turbo run <task>`)
- **Two apps**: `apps/desktop` (Electron) and `apps/backend` (Python)
- **Shared types**: Live in `apps/desktop/src/shared/` (used by main, preload, and renderer processes)
- **Path aliases**: `@/*` → `src/renderer/*`, `@shared/*` → `src/shared/*`
- **Turbo cache**: Located in `.turbo/` directory

### UI Component Patterns

The UI uses **TailwindCSS v4** with the new CSS `@import` syntax (not a PostCSS plugin):

```css
@import 'tailwindcss';
```

Components follow **shadcn/ui patterns**:

- Use `class-variance-authority` (cva) for variant management
- Use `tailwind-merge` for className composition
- Utility function `cn()` in `apps/desktop/src/renderer/lib/utils.ts`

## Development Notes

### Python Path in IPC

The [apps/desktop/src/main/ipc.ts](apps/desktop/src/main/ipc.ts) file uses a relative path to find the Python script:

```typescript
const backendPath = join(__dirname, '../../../backend');
```

This works because `__dirname` in production is `apps/desktop/out/main`. Three levels up reaches `apps/`, then `backend` reaches `apps/backend`.

### Python Uses uv

All Python commands use `uv` package manager:

- `pythonPath: 'uv'` in python-shell configuration
- `pythonOptions: ['run', 'python', '-u']` runs `uv run python`

Ensure `uv` is installed globally. Do not use `python3` or `python` directly.

### Hot Module Replacement (HMR)

When running `pnpm dev`:

- Vite serves the React app with HMR on port 5173 (configurable)
- Electron loads from `process.env.ELECTRON_RENDERER_URL`
- Changes to React components reload instantly
- Changes to main/preload process require restart

## Testing IPC

### Quick Test

```bash
pnpm dev
# Click "Test IPC Connection" button in the UI
# Should see: {"success": true, "data": {"message": "pong"}}
```

### Manual Test

```bash
# Terminal 1
pnpm dev

# Terminal 2
echo '{"type":"ping"}' | uv run python apps/backend/src/main.py
# Expected: {"success":true,"data":{"message":"pong"}}
```

For automated IPC testing, see the [Testing](#testing) section above.

## Environment Variables

Electron app supports `.env` files in `apps/desktop/`:

```bash
VITE_API_URL=http://localhost:3000
NODE_ENV=development
```

These are available in renderer as `import.meta.env.VITE_*`.

## Troubleshooting

### "uv: command not found"

Install uv globally: `curl -LsSf https://astral.sh/uv/install.sh | sh`

### Python dependencies not found

Sync dependencies: `cd apps/backend && uv sync`

### Port 5173 already in use

Kill process: `lsof -ti:5173 | xargs kill -9` or use different port: `VITE_PORT=5174 pnpm dev`
