"""GitHub repository detection from Source paths and URLs.

Extracts GitHub owner/repo information from local git repositories
and remote URLs.
"""

import re
import subprocess
from dataclasses import dataclass
from typing import Any


@dataclass
class GitHubRepoInfo:
    """GitHub repository owner and name."""

    owner: str
    name: str

    @property
    def full_name(self) -> str:
        return f"{self.owner}/{self.name}"

    def to_json(self) -> dict[str, Any]:
        return {"owner": self.owner, "name": self.name, "full_name": self.full_name}


class GitHubRepoDetector:
    """Detect GitHub repositories from Source paths and URLs."""

    GITHUB_URL_PATTERN = re.compile(r"github\.com[/:](?P<owner>[^/\s]+)/(?P<name>[^/\s.]+)")

    def detect_from_source(self, source_path: str, source_url: str | None) -> GitHubRepoInfo | None:
        """Detect GitHub repo from a Source's path or URL.

        Strategy:
        1. If source_url contains github.com, parse it
        2. Otherwise, run `git remote -v` on source_path
        3. Return None if not a GitHub repo
        """
        if source_url:
            info = self._parse_github_url(source_url)
            if info:
                return info

        return self._detect_from_git_remote(source_path)

    def _detect_from_git_remote(self, path: str) -> GitHubRepoInfo | None:
        """Run `git remote -v` and extract GitHub URL from origin."""
        try:
            result = subprocess.run(
                ["git", "remote", "-v"],
                cwd=path,
                capture_output=True,
                text=True,
                check=False,
                timeout=5,
            )
            if result.returncode != 0:
                return None

            for line in result.stdout.splitlines():
                if line.startswith("origin") and "github.com" in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        info = self._parse_github_url(parts[1])
                        if info:
                            return info
        except (subprocess.SubprocessError, OSError):
            pass

        return None

    def _parse_github_url(self, url: str) -> GitHubRepoInfo | None:
        """Parse GitHub URL to extract owner/name."""
        match = self.GITHUB_URL_PATTERN.search(url)
        if match:
            owner = match.group("owner")
            name = match.group("name").removesuffix(".git")
            return GitHubRepoInfo(owner=owner, name=name)
        return None
