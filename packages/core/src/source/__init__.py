"""Source domain package.

Provides the Source data model and repository for database operations.
"""

from .model import Source
from .repository import SourceRepository

__all__ = ["Source", "SourceRepository"]
