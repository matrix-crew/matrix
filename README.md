<p align="center">
  <h1 align="center">Matrix</h1>
  <p align="center">A workspace-driven desktop app for managing projects, tasks, and workflows — all in one place.</p>
</p>

<p align="center">
  <a href="https://github.com/matrix-crew/matrix/releases">Download</a> &nbsp;&middot;&nbsp;
  <a href="CONTRIBUTING.md">Contributing</a> &nbsp;&middot;&nbsp;
  <a href="https://github.com/matrix-crew/matrix/issues">Issues</a>
</p>

<!-- Screenshot placeholder: replace with actual app screenshot -->
<!-- <p align="center"><img src="docs/screenshot.png" width="720" /></p> -->

---

## Features

**Workspaces** — Organize everything by project. Each workspace has its own boards, tasks, and terminal sessions.

**Kanban Boards** — Visual task management with drag-and-drop columns and cards.

**Embedded Terminal** — Full terminal emulator built in. Split into grids, persist sessions across restarts.

**MCP Integration** — Connect to Model Context Protocol servers for AI-powered workflows.

**Themes** — Light and dark modes with a customizable color system.

## Quick Start

```bash
# Download the latest release
# https://github.com/matrix-crew/matrix/releases

# Or build from source
git clone https://github.com/matrix-crew/matrix.git
cd matrix
pnpm install && cd apps/backend && uv sync && cd ../..
pnpm dev
```

## Tech Stack

Electron &middot; React &middot; TypeScript &middot; TailwindCSS v4 &middot; Python &middot; Turborepo

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture, and guidelines.

## License

[GPL-3.0](LICENSE)
