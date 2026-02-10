"""Matrix domain package.

Provides the Matrix data model, repository for database operations,
workspace management for matrix spaces, and filesystem reconciliation.
"""

from .model import Matrix
from .reconciler import MatrixReconciler, ReconcileReport
from .repository import MatrixRepository
from .space import create_matrix_space, update_matrix_md

__all__ = [
    "Matrix",
    "MatrixReconciler",
    "MatrixRepository",
    "ReconcileReport",
    "create_matrix_space",
    "update_matrix_md",
]
