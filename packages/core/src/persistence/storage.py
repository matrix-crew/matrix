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

    def _get_matrix_path(self, matrix_id: str) -> str:
        """Get the file path for a Matrix by ID.

        Args:
            matrix_id: The UUID of the Matrix

        Returns:
            The absolute path to the Matrix JSON file
        """
        return os.path.join(self._matrices_path, f"{matrix_id}.json")

    def save_matrix(self, matrix: Matrix) -> None:
        """Save a Matrix to the filesystem.

        Creates the necessary directories if they don't exist, then writes
        the Matrix as JSON to the matrices subdirectory.

        Args:
            matrix: The Matrix instance to save
        """
        self._ensure_directories()
        file_path = self._get_matrix_path(matrix.id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(matrix.to_json(), f, indent=2)

    def load_matrix(self, matrix_id: str) -> Optional[Matrix]:
        """Load a Matrix from the filesystem by ID.

        Args:
            matrix_id: The UUID of the Matrix to load

        Returns:
            The Matrix instance if found, None otherwise
        """
        file_path = self._get_matrix_path(matrix_id)
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return Matrix.from_json(data)
        except (json.JSONDecodeError, KeyError):
            return None

    def list_matrices(self) -> list[Matrix]:
        """List all Matrices from the filesystem.

        Reads all JSON files in the matrices subdirectory and returns
        them as Matrix instances. Skips any files that cannot be parsed.

        Returns:
            A list of all valid Matrix instances
        """
        matrices: list[Matrix] = []
        if not os.path.exists(self._matrices_path):
            return matrices

        for filename in os.listdir(self._matrices_path):
            if filename.endswith(".json"):
                file_path = os.path.join(self._matrices_path, filename)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        matrices.append(Matrix.from_json(data))
                except (json.JSONDecodeError, KeyError):
                    # Skip corrupted files
                    continue
        return matrices

    def delete_matrix(self, matrix_id: str) -> bool:
        """Delete a Matrix from the filesystem.

        Args:
            matrix_id: The UUID of the Matrix to delete

        Returns:
            True if the Matrix was deleted, False if it didn't exist
        """
        file_path = self._get_matrix_path(matrix_id)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
