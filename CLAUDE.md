# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maxtix is an Electron desktop application with a Python backend, featuring type-safe IPC communication. The project is a **Turborepo monorepo** using **pnpm workspaces** with three main packages:

- `apps/desktop` - Electron application (React + TailwindCSS v4)
- `packages/core` - Python backend (managed with uv)
- `packages/shared` - TypeScript types for IPC communication
- `packages/ui` - Shared React components (shadcn/ui patterns)

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
cd packages/core
uv run python src/main.py  # Should print "OK"

# Sync Python dependencies
cd packages/core
uv sync

# Run Python tests
cd packages/core
uv run pytest

# Lint Python code
cd packages/core
uv run ruff check src/

# Format Python code
cd packages/core
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

### Workspace Packages

```bash
# Build shared types package (required before desktop app)
cd packages/shared
pnpm build

# Build UI components package
cd packages/ui
pnpm build

# Watch mode for development
cd packages/shared
pnpm dev
```

## Testing

### Test Requirement

**All new features and IPC handlers MUST include corresponding tests.** Pull requests without tests for new functionality will not pass CI.

### Test Stack

| Layer                     | Tool                           | Location                        |
| ------------------------- | ------------------------------ | ------------------------------- |
| TypeScript Unit/Component | Vitest + React Testing Library | `*.test.ts(x)` alongside source |
| Python Unit               | pytest                         | `packages/core/tests/`          |
| E2E (Electron)            | Playwright                     | `apps/desktop/e2e/`             |

### Running Tests

```bash
# Run ALL TypeScript tests (via Turborepo)
pnpm test

# Run tests for a specific package
cd apps/desktop && pnpm test        # Desktop app (14 tests)
cd packages/ui && pnpm test         # UI components (13 tests)
cd packages/shared && pnpm test     # Shared types (16 tests)

# Watch mode (re-runs on file changes)
cd apps/desktop && pnpm test:watch
cd packages/ui && pnpm test:watch

# Run Python tests
cd packages/core && uv run pytest -v

# Run E2E tests (requires built app)
cd apps/desktop && pnpm build && pnpm test:e2e
```

### Writing Tests for New Features

When adding a new feature, tests are required at every layer it touches:

1. **New IPC handler** (Python): Add tests in `packages/core/tests/` that call `handle_message()` directly with an in-memory SQLite database. Test success, error, and edge cases.

2. **New React component**: Add a `ComponentName.test.tsx` file next to the component. Mock `window.api.sendMessage` using `vi.mocked()` for IPC calls. Use `@testing-library/react` for rendering and assertions.

3. **New shared types**: Add type contract tests in `packages/shared/src/types/` that verify message structure satisfies the interfaces.

4. **New UI component**: Add a test file in `packages/ui/src/components/` using React Testing Library. Test all variants, states, and interactions.

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
Python Backend (packages/core/src/main.py)
  ↓ stdin JSON → handler.py routes → stdout JSON
Response flows back through the chain
```

**Key files:**

- [apps/desktop/src/main/ipc.ts](apps/desktop/src/main/ipc.ts) - IPC bridge using python-shell
- [apps/desktop/src/preload/index.ts](apps/desktop/src/preload/index.ts) - Security boundary with contextBridge
- [packages/core/src/main.py](packages/core/src/main.py) - Python entry point (reads stdin, writes stdout)
- [packages/core/src/ipc/handler.py](packages/core/src/ipc/handler.py) - Message routing
- [packages/shared/src/types/ipc.ts](packages/shared/src/types/ipc.ts) - TypeScript types for IPC messages

### Adding New IPC Handlers

1. **Define TypeScript types** in [packages/shared/src/types/ipc.ts](packages/shared/src/types/ipc.ts):

```typescript
export interface MyNewMessage extends IPCMessage {
  type: 'my-handler';
  data?: { someField: string };
}
```

2. **Add Python handler** in [packages/core/src/ipc/handler.py](packages/core/src/ipc/handler.py):

```python
if message_type == "my-handler":
    data = message.get("data", {})
    return {"success": True, "data": {"result": "processed"}}
```

3. **Use in React** via `window.api.sendMessage()`:

```typescript
const response = await window.api.sendMessage({ type: 'my-handler', data: { someField: 'value' } });
```

4. **Rebuild shared types** if you modified `packages/shared`:

```bash
cd packages/shared && pnpm build
```

5. **Write tests** (required):
   - Add Python handler tests in `packages/core/tests/` covering success, error, and edge cases
   - Add type contract tests in `packages/shared/src/types/ipc.test.ts` for the new message type
   - Add React component tests if a UI component consumes the new handler

### Security Architecture

- **Context Isolation**: Renderer has no direct Node.js access
- **Preload Script**: [apps/desktop/src/preload/index.ts](apps/desktop/src/preload/index.ts) uses `contextBridge` for secure API exposure
- **IPC Validation**: Main process validates all messages before sending to Python
- **TypeScript Strict Mode**: All TypeScript uses strict type checking

### Python Backend Architecture

The Python backend (`packages/core`) is a stateless message processor:

- **Entry Point**: [src/main.py](packages/core/src/main.py) reads JSON from stdin, writes JSON to stdout
- **Handler**: [src/ipc/handler.py](packages/core/src/ipc/handler.py) routes messages by `type` field
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

- **Runtime**: Python objects in `packages/core`
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
- **Build dependencies**: Turborepo ensures `packages/shared` builds before `apps/desktop`
- **Package references**: Use `workspace:*` in package.json dependencies
- **Turbo cache**: Located in `.turbo/` directory

**Important**: Always run `pnpm build` from root to ensure correct build order. Turborepo handles the dependency graph defined in [turbo.json](turbo.json).

### UI Component Patterns

The UI uses **TailwindCSS v4** with the new CSS `@import` syntax (not a PostCSS plugin):

```css
@import 'tailwindcss';
```

Components follow **shadcn/ui patterns**:

- Located in `packages/ui/src/components/ui/`
- Use `class-variance-authority` (cva) for variant management
- Use `tailwind-merge` for className composition
- Utility function `cn()` in `packages/ui/src/lib/utils.ts`

When adding shadcn/ui components, manually copy them into `packages/ui/src/components/ui/` (no CLI generator is configured).

## Development Notes

### Python Path in IPC

The [apps/desktop/src/main/ipc.ts](apps/desktop/src/main/ipc.ts) file uses a relative path to find the Python script:

```typescript
const pythonScriptPath = join(__dirname, '../../../../packages/core/src');
```

This works because `__dirname` in production is `apps/desktop/out/main`. If you move the Python package, update this path.

### Python Uses uv

All Python commands use `uv` package manager:

- `pythonPath: 'uv'` in python-shell configuration
- `pythonOptions: ['run', 'python', '-u']` runs `uv run python`

Ensure `uv` is installed globally. Do not use `python3` or `python` directly.

### TypeScript Build Order

Shared types must be built before the desktop app can build:

1. `packages/shared` exports types used by `apps/desktop`
2. Turborepo enforces this via `"dependsOn": ["^build"]` in [turbo.json](turbo.json)
3. Run `pnpm build` from root to build in correct order

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
echo '{"type":"ping"}' | uv run python packages/core/src/main.py
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

Sync dependencies: `cd packages/core && uv sync`

### TypeScript errors about @maxtix/shared

Build shared package first: `cd packages/shared && pnpm build`

### Port 5173 already in use

Kill process: `lsof -ti:5173 | xargs kill -9` or use different port: `VITE_PORT=5174 pnpm dev`
