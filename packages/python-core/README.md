# Maxtix Python Core

Maxtix Python backend core - AI agent execution engine

## Overview

The Python core package provides the foundation for the Maxtix agent execution system. It handles the core business logic and IPC communication with the Electron frontend.

## Requirements

- Python 3.12+
- uv package manager

## Installation

```bash
# Install dependencies
cd packages/python-core
uv sync
```

## Running

From the project root:

```bash
uv run python packages/python-core/src/main.py
```

Or from the package directory:

```bash
cd packages/python-core
uv run python src/main.py
```

## Development

### Running Tests

```bash
cd packages/python-core
uv run pytest
```

### Code Quality

The project uses:
- **ruff** for linting and formatting (line-length: 100, target: Python 3.12)
- **pytest** for testing

Configuration is in `pyproject.toml`.

## Architecture

- `src/main.py` - Entry point for the Python backend
- `src/ipc/` - IPC handler module for Electron communication

## Contributing

Follow the code style configured in `pyproject.toml`.
