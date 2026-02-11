"""Git repository cloning for remote sources.

Handles cloning remote git repositories into ~/.matrix/repositories/
and managing the clones directory structure.
"""

import re
import subprocess
from pathlib import Path

from src.config.paths import get_workspace_root


class CloneError(Exception):
    """Raised when git clone operations fail."""


class RepositoryCloner:
    """Manages git repository cloning for remote sources.

    Clones repositories to ~/.matrix/repositories/ and provides
    utilities for extracting repository names from git URLs.
    """

    def __init__(self) -> None:
        self.repositories_dir = self._get_repositories_dir()

    def _get_repositories_dir(self) -> Path:
        """Get the shared repositories directory (~/.matrix/repositories/)."""
        repos_path = Path(get_workspace_root()) / "repositories"
        repos_path.mkdir(parents=True, exist_ok=True)
        return repos_path

    def extract_repo_name(self, url: str) -> str:
        """Extract repository name from git URL.

        Examples:
            https://github.com/user/repo.git -> repo
            git@github.com:user/repo.git -> repo
            https://github.com/user/repo -> repo

        Args:
            url: Git repository URL.

        Returns:
            Repository name (without .git suffix).
        """
        # Handle SSH-style URLs: git@github.com:user/repo.git
        match = re.search(r"[/:]([^/:]+?)(?:\.git)?/?$", url)
        if match:
            return match.group(1)
        return "repository"

    def clone_repository(self, url: str, name: str | None = None) -> str:
        """Clone a git repository to ~/.matrix/repositories/.

        Args:
            url: Git repository URL to clone.
            name: Optional custom name for the clone directory.

        Returns:
            Absolute path to the cloned repository.

        Raises:
            CloneError: If git is not available or clone fails.
        """
        if not self._is_git_available():
            raise CloneError("git command not found. Please install git.")

        clone_name = name or self.extract_repo_name(url)
        clone_path = self.repositories_dir / clone_name

        # If already cloned, return existing path
        if clone_path.exists() and (clone_path / ".git").exists():
            return str(clone_path)

        # Handle name collision with non-git directory
        if clone_path.exists():
            clone_name = f"{clone_name}-{hash(url) % 10000:04d}"
            clone_path = self.repositories_dir / clone_name

        try:
            subprocess.run(
                ["git", "clone", url, str(clone_path)],
                capture_output=True,
                text=True,
                timeout=300,
                check=True,
            )
            return str(clone_path)
        except subprocess.TimeoutExpired as e:
            raise CloneError("Git clone timed out after 5 minutes") from e
        except subprocess.CalledProcessError as e:
            raise CloneError(f"Git clone failed: {e.stderr.strip()}") from e

    def _is_git_available(self) -> bool:
        """Check if git command is available."""
        try:
            subprocess.run(
                ["git", "--version"],
                capture_output=True,
                timeout=5,
                check=True,
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            return False
