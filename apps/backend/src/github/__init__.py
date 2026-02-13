"""GitHub integration package.

Provides GitHub CLI wrapper and repository detection for Matrix sources.
"""

from .client import GitHubClient, GitHubError
from .detector import GitHubRepoDetector, GitHubRepoInfo

__all__ = [
    "GitHubClient",
    "GitHubError",
    "GitHubRepoDetector",
    "GitHubRepoInfo",
]
