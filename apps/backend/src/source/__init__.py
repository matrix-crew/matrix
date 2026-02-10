"""Source domain package.

Provides the Source data model, repository, symlink linker, and git cloner.
"""

from .cloner import CloneError, RepositoryCloner
from .linker import SourceLinker, SymlinkError
from .model import Source, SourceType
from .repository import SourceRepository

__all__ = [
    "CloneError",
    "RepositoryCloner",
    "Source",
    "SourceLinker",
    "SourceRepository",
    "SourceType",
    "SymlinkError",
]
