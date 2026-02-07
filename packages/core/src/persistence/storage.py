"""Storage module for Matrix application persistence.

This module provides the MatrixStorage class for persisting Matrix and Source
entities to the filesystem using JSON files.

Storage structure:
    $HOME/.matrix/
    ├── matrices/
    │   └── {matrix-id}.json
    ├── sources/
    │   └── {source-id}.json
    └── index.json (optional)
"""

import json
import os
from pathlib import Path
from typing import Optional

from src.models.matrix import Matrix
from src.models.source import Source


class MatrixStorage:
    """Storage class for Matrix and Source persistence.

    Handles reading and writing Matrix and Source entities to JSON files
    in the $HOME/.matrix/ directory. Creates the directory structure
    automatically if it doesn't exist.

    Attributes:
        base_path: The base directory path for all storage operations
        matrices_path: Path to the matrices subdirectory
        sources_path: Path to the sources subdirectory
    """

    def __init__(self, base_path: Optional[str] = None) -> None:
        """Initialize the MatrixStorage.

        Args:
            base_path: Optional custom base path. Defaults to $HOME/.matrix/
        """
        if base_path is None:
            home = os.path.expanduser("~")
            self._base_path = os.path.join(home, ".matrix")
        else:
            self._base_path = base_path

        self._matrices_path = os.path.join(self._base_path, "matrices")
        self._sources_path = os.path.join(self._base_path, "sources")

    @property
    def base_path(self) -> str:
        """Get the base path for storage.

        Returns:
            The absolute path to the storage directory
        """
        return self._base_path

    @property
    def matrices_path(self) -> str:
        """Get the path to the matrices directory.

        Returns:
            The absolute path to the matrices subdirectory
        """
        return self._matrices_path

    @property
    def sources_path(self) -> str:
        """Get the path to the sources directory.

        Returns:
            The absolute path to the sources subdirectory
        """
        return self._sources_path

    def _ensure_directories(self) -> None:
        """Ensure the storage directory structure exists.

        Creates the base directory and subdirectories if they don't exist.
        """
        Path(self._matrices_path).mkdir(parents=True, exist_ok=True)
        Path(self._sources_path).mkdir(parents=True, exist_ok=True)
