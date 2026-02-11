"""GitHub CLI wrapper for API operations.

Thin wrapper around `gh` CLI for fetching issues and pull requests.
"""

import json
import subprocess
from typing import Any


class GitHubError(Exception):
    """GitHub CLI operation failed."""


class GitHubClient:
    """Wrapper around gh CLI for GitHub API calls."""

    def check_installation(self) -> bool:
        """Check if gh CLI is installed."""
        try:
            result = subprocess.run(
                ["gh", "--version"],
                capture_output=True,
                check=False,
                timeout=5,
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, OSError):
            return False

    def check_auth(self) -> dict[str, Any]:
        """Check gh auth status.

        Returns:
            Dict with installed, authenticated, user, error fields.
        """
        try:
            result = subprocess.run(
                ["gh", "auth", "status"],
                capture_output=True,
                text=True,
                check=False,
                timeout=5,
            )

            if result.returncode == 0:
                user = self._extract_username(result.stderr + result.stdout)
                return {"authenticated": True, "user": user, "error": None}
            else:
                return {
                    "authenticated": False,
                    "user": None,
                    "error": "Not authenticated. Run 'gh auth login'",
                }
        except (subprocess.SubprocessError, OSError) as e:
            return {"authenticated": False, "user": None, "error": str(e)}

    def list_issues(
        self, owner: str, repo: str, state: str = "open", limit: int = 100
    ) -> list[dict[str, Any]]:
        """Fetch issues for a repository via gh CLI.

        Args:
            owner: Repository owner
            repo: Repository name
            state: "open", "closed", or "all"
            limit: Maximum number of issues

        Returns:
            List of issue dicts from gh.

        Raises:
            GitHubError: If gh command fails.
        """
        fields = ",".join(
            [
                "number",
                "title",
                "body",
                "state",
                "labels",
                "assignees",
                "author",
                "createdAt",
                "updatedAt",
                "closedAt",
                "comments",
            ]
        )

        return self._run_gh_json(
            [
                "gh",
                "issue",
                "list",
                "--repo",
                f"{owner}/{repo}",
                "--state",
                state,
                "--limit",
                str(limit),
                "--json",
                fields,
            ],
            context=f"issues for {owner}/{repo}",
        )

    def list_pull_requests(
        self, owner: str, repo: str, state: str = "open", limit: int = 100
    ) -> list[dict[str, Any]]:
        """Fetch pull requests for a repository via gh CLI.

        Args:
            owner: Repository owner
            repo: Repository name
            state: "open", "closed", "merged", or "all"
            limit: Maximum number of PRs

        Returns:
            List of PR dicts from gh.

        Raises:
            GitHubError: If gh command fails.
        """
        fields = ",".join(
            [
                "number",
                "title",
                "body",
                "state",
                "labels",
                "assignees",
                "author",
                "createdAt",
                "updatedAt",
                "closedAt",
                "mergedAt",
                "headRefName",
                "baseRefName",
                "isDraft",
                "mergeable",
                "reviewDecision",
                "statusCheckRollup",
                "additions",
                "deletions",
                "changedFiles",
                "reviewRequests",
            ]
        )

        return self._run_gh_json(
            [
                "gh",
                "pr",
                "list",
                "--repo",
                f"{owner}/{repo}",
                "--state",
                state,
                "--limit",
                str(limit),
                "--json",
                fields,
            ],
            context=f"PRs for {owner}/{repo}",
        )

    def _run_gh_json(self, cmd: list[str], context: str, timeout: int = 30) -> list[dict[str, Any]]:
        """Execute a gh command that returns JSON array."""
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=timeout,
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise GitHubError(f"Failed to fetch {context}: {e.stderr.strip()}") from e
        except subprocess.TimeoutExpired as e:
            raise GitHubError(f"Timeout fetching {context}") from e
        except (json.JSONDecodeError, OSError) as e:
            raise GitHubError(f"Error fetching {context}: {e}") from e

    def _extract_username(self, output: str) -> str | None:
        """Extract username from gh auth status output."""
        for line in output.splitlines():
            if "Logged in to github.com" in line:
                # Format: "Logged in to github.com account <user> ..."
                # or "Logged in to github.com as <user> ..."
                for keyword in ("account ", "as "):
                    idx = line.find(keyword)
                    if idx != -1:
                        rest = line[idx + len(keyword) :].strip()
                        return rest.split()[0].strip("()")
        return None
