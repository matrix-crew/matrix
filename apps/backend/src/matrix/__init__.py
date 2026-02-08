"""Matrix domain package.

Provides the Matrix data model, repository for database operations,
and workspace management for matrix spaces.
"""

from .model import Matrix
from .repository import MatrixRepository
from .space import create_matrix_space, update_matrix_md

__all__ = ["Matrix", "MatrixRepository", "create_matrix_space", "update_matrix_md"]
