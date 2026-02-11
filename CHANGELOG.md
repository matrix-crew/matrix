# Changelog

All notable changes to this project will be documented in this file.

## [v0.0.2] - 2026-02-11

### Fixed

- Fix Linux `.deb` build path error (#30)
- Fix onboarding skip not saving agents/tools to `.matrix.json` (#37)
- Rename Maxtix to Matrix and remove auto-update yml from release

### Added

- Add customizable keyboard shortcut system with settings UI (#39)
- Add source symlink management with filesystem reconciliation (#35)
- Add system-check.ts unit tests and gate release on CI (#34)
- Add dev-only DevTools panel for testing utilities (#32)
- Add editable tool/agent paths in onboarding wizard (#31)

### Changed

- Reorganize sidebar groups with persistent order (#38)
- Improve onboarding wizard: add back navigation, reorder steps, rename Agent Detection (#36)
- Refactor README into minimal landing page with CONTRIBUTING.md (#33)

## [v0.0.1] - 2026-02-09

### Added

- Electron packaging pipeline with cross-platform CI release (#28)
- Embedded terminal with PTY sessions, grid layout, and persistence (#23)
- Color theme system with ThemeProvider and appearance settings (#25)
- Permanent Home tab with Matrix grid view (#22)
- Onboarding wizard with system checks, config persistence, and tools-first step order (#14, #16)
- Matrix Space workspace management and MATRIX.md auto-generation (#13)
- Matrix tab bar and contextual sidebar layout (#12)
- Pre-commit hooks for linting, formatting, and type-checking (#11)
- SQLite + SQLModel database persistence (#10)
- Matrix object CRUD: create, manage, and persist (#9)
- Kanban board (#2)
- Application settings page (#5)
- Hierarchical sidebar navigation with collapsible sections (#4)
- Comprehensive test suite and CI pipeline (#17)

### Changed

- Consolidate packages/ into apps/desktop monorepo structure (#26)
- Restructure monorepo: move Python backend to apps/ and flatten renderer (#20)
- Improve sidebar UX: resizable width, modal settings, larger tabs (#27)
- Use hiddenInset titlebar for native macOS look (#18)

### Fixed

- Fix node-pty posix_spawnp error by rebuilding for Electron (#21)
- Fix pnpm compatibility for Electron development

[v0.0.2]: https://github.com/matrix-crew/matrix/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/matrix-crew/matrix/releases/tag/v0.0.1
