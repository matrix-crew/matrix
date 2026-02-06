# @maxtix/shared

Shared TypeScript types and utilities for Maxtix monorepo.

## Overview

This package provides type-safe definitions and utilities used across the Maxtix application, ensuring consistent data structures between the Electron frontend and Python backend.

## Installation

This package is part of the Maxtix monorepo and is automatically linked via workspace dependencies.

```json
{
  "dependencies": {
    "@maxtix/shared": "workspace:*"
  }
}
```

## Usage

### Importing Types

```typescript
import type { IPCMessage, IPCResponse } from '@maxtix/shared';

const message: IPCMessage = {
  type: 'ping'
};

const response: IPCResponse = {
  success: true,
  data: { message: 'pong' }
};
```

### Available Types

#### IPCMessage

Type definition for messages sent from the Electron renderer to the Python backend.

```typescript
interface IPCMessage {
  type: string;
  [key: string]: any;
}
```

#### IPCResponse

Type definition for responses sent from the Python backend to the Electron renderer.

```typescript
interface IPCResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

## Development

### Building

```bash
# Build once
pnpm build

# Watch mode for development
pnpm dev
```

The build process uses `tsup` to generate:
- CommonJS output (`dist/index.js`)
- ESM output (`dist/index.mjs`)
- TypeScript declarations (`dist/index.d.ts`)

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Project Structure

```
packages/shared/
├── src/
│   ├── index.ts       # Main entry point, exports all types
│   └── types/
│       └── ipc.ts     # IPC message/response type definitions
├── dist/              # Build output (generated)
├── package.json
└── tsconfig.json
```

## Adding New Types

1. Create or edit type definition files in `src/types/`
2. Export types from `src/index.ts`
3. Run `pnpm build` to generate distribution files
4. Import types in consuming packages

Example:

```typescript
// src/types/agent.ts
export interface AgentConfig {
  name: string;
  version: string;
}

// src/index.ts
export type { AgentConfig } from './types/agent';
```

## Package Exports

The package uses modern package.json exports for optimal compatibility:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

This ensures proper resolution for:
- TypeScript (via `types` field)
- ESM imports (via `import` field)
- CommonJS requires (via `require` field)

## Contributing

When modifying types:
- Ensure backward compatibility or coordinate breaking changes
- Add JSDoc comments for complex types
- Run `pnpm type-check` before committing
- Update dependent packages if interfaces change
