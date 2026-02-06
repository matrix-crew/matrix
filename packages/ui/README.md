# @maxtix/ui

Shared UI components for Maxtix - built with React, TailwindCSS v4, and shadcn/ui patterns.

## Overview

This package provides reusable, type-safe UI components designed with modern React patterns and TailwindCSS v4 styling. Components follow shadcn/ui design principles for consistency and accessibility.

## Installation

This package is part of the Maxtix monorepo and is automatically linked via workspace dependencies.

```json
{
  "dependencies": {
    "@maxtix/ui": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

## Usage

### Importing Components

```typescript
import { Button, cn } from '@maxtix/ui';

export function MyComponent() {
  return (
    <Button variant="default" size="default">
      Click me
    </Button>
  );
}
```

## Available Components

### Button

A versatile button component with multiple variants and sizes.

```typescript
import { Button } from '@maxtix/ui';

export function Example() {
  return (
    <>
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </>
  );
}
```

#### Button Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

#### Button Sizes

```typescript
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🚀</Button>
```

## Utility Functions

### cn (Class Name Utility)

A utility function for conditionally joining class names, combining `clsx` and `tailwind-merge`.

```typescript
import { cn } from '@maxtix/ui';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  'text-red-500',
  'text-blue-500' // tailwind-merge handles conflicts
);
```

Benefits:
- Merges Tailwind classes intelligently (removes conflicts)
- Handles conditional classes
- Supports arrays and objects

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

React and React DOM are marked as external dependencies (peer dependencies).

### Type Checking

```bash
pnpm type-check
```

## Project Structure

```
packages/ui/
├── src/
│   ├── index.ts              # Main entry point
│   ├── components/
│   │   └── button.tsx        # Button component
│   └── lib/
│       └── utils.ts          # Utility functions (cn)
├── dist/                     # Build output (generated)
├── package.json
└── tsconfig.json
```

## Adding New Components

To add a new component:

1. Create component file in `src/components/`
2. Export from `src/index.ts`
3. Follow shadcn/ui patterns:
   - Use `cva` for variants
   - Use `cn` for class merging
   - Export TypeScript types
4. Build and test

Example:

```typescript
// src/components/card.tsx
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined';
}

export function Card({ variant = 'default', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-6',
        variant === 'outlined' && 'border-gray-300',
        className
      )}
      {...props}
    />
  );
}

// src/index.ts
export { Card } from './components/card';
export type { CardProps } from './components/card';
```

## Styling Guidelines

### TailwindCSS v4

This package uses TailwindCSS v4 with CSS `@import` syntax. Components should:

- Use utility classes directly
- Avoid custom CSS when possible
- Use `cn()` for conditional/merged classes
- Follow Tailwind's design system

### Component Variants

Use `class-variance-authority` (cva) for component variants:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const componentVariants = cva('base-classes', {
  variants: {
    variant: {
      default: 'variant-classes',
      secondary: 'secondary-classes'
    },
    size: {
      sm: 'size-small-classes',
      lg: 'size-large-classes'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm'
  }
});

export interface ComponentProps extends VariantProps<typeof componentVariants> {
  // Additional props
}
```

## Package Exports

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

## Peer Dependencies

This package requires:
- `react` ^18.3.1
- `react-dom` ^18.3.1

These must be installed in consuming applications.

## Contributing

When adding components:
- Follow existing patterns and naming conventions
- Add TypeScript types for all props
- Use semantic HTML elements
- Ensure accessibility (ARIA labels, keyboard navigation)
- Test with different variants and sizes
- Document usage examples