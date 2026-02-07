"""Persistence module for Maxtix Python backend.

This module provides storage functionality for persisting Matrix and Source
entities to the filesystem. Data is stored as JSON files in the $HOME/.matrix/
directory structure.
"""

from .storage import MatrixStorage

__all__ = ["MatrixStorage"]
