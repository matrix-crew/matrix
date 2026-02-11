"""IPC communication module for Matrix Python backend.

This module handles inter-process communication between the Electron main process
and the Python backend. It provides message handling and routing functionality.
"""

from .handler import handle_message

__all__ = ["handle_message"]
