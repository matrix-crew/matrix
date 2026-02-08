"""Matrix domain package.

Provides the Matrix data model and repository for database operations.
"""

from .model import Matrix
from .repository import MatrixRepository

__all__ = ["Matrix", "MatrixRepository"]
