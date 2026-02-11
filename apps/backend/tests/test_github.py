"""Unit tests for GitHub module (detector + client)."""

import json
import subprocess
from unittest.mock import MagicMock, patch

import pytest

from src.github.client import GitHubClient, GitHubError
from src.github.detector import GitHubRepoDetector, GitHubRepoInfo

# ============================================================================
# GitHubRepoInfo
# ============================================================================


class TestGitHubRepoInfo:
    """Tests for GitHubRepoInfo dataclass."""

    def test_full_name(self):
        info = GitHubRepoInfo(owner="octocat", name="hello-world")
        assert info.full_name == "octocat/hello-world"

    def test_to_json(self):
        info = GitHubRepoInfo(owner="octocat", name="hello-world")
        result = info.to_json()
        assert result == {
            "owner": "octocat",
            "name": "hello-world",
            "full_name": "octocat/hello-world",
        }


# ============================================================================
# GitHubRepoDetector
# ============================================================================


class TestGitHubRepoDetector:
    """Tests for GitHubRepoDetector."""

    def test_parse_https_url(self):
        detector = GitHubRepoDetector()
        info = detector._parse_github_url("https://github.com/octocat/hello-world")
        assert info is not None
        assert info.owner == "octocat"
        assert info.name == "hello-world"

    def test_parse_https_url_with_git_suffix(self):
        detector = GitHubRepoDetector()
        info = detector._parse_github_url("https://github.com/octocat/hello-world.git")
        assert info is not None
        assert info.owner == "octocat"
        assert info.name == "hello-world"

    def test_parse_ssh_url(self):
        detector = GitHubRepoDetector()
        info = detector._parse_github_url("git@github.com:octocat/hello-world.git")
        assert info is not None
        assert info.owner == "octocat"
        assert info.name == "hello-world"

    def test_parse_non_github_url(self):
        detector = GitHubRepoDetector()
        info = detector._parse_github_url("https://gitlab.com/user/repo")
        assert info is None

    def test_detect_from_source_url_first(self):
        """URL detection should take priority over git remote."""
        detector = GitHubRepoDetector()
        info = detector.detect_from_source(
            source_path="/some/path",
            source_url="https://github.com/owner/repo",
        )
        assert info is not None
        assert info.owner == "owner"
        assert info.name == "repo"

    def test_detect_from_source_url_none(self):
        """When URL is None, fall back to git remote."""
        detector = GitHubRepoDetector()
        with patch.object(detector, "_detect_from_git_remote") as mock_detect:
            mock_detect.return_value = GitHubRepoInfo(owner="remote-owner", name="remote-repo")
            info = detector.detect_from_source("/some/path", source_url=None)
            assert info is not None
            assert info.owner == "remote-owner"
            mock_detect.assert_called_once_with("/some/path")

    def test_detect_from_source_non_github_url_falls_back(self):
        """Non-GitHub URL should fall back to git remote."""
        detector = GitHubRepoDetector()
        with patch.object(detector, "_detect_from_git_remote") as mock_detect:
            mock_detect.return_value = None
            info = detector.detect_from_source(
                "/some/path", source_url="https://gitlab.com/user/repo"
            )
            assert info is None
            mock_detect.assert_called_once_with("/some/path")

    @patch("src.github.detector.subprocess.run")
    def test_detect_from_git_remote_success(self, mock_run):
        """git remote -v returns origin pointing to GitHub."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="origin\thttps://github.com/octocat/hello-world.git (fetch)\norigin\thttps://github.com/octocat/hello-world.git (push)\n",
        )
        detector = GitHubRepoDetector()
        info = detector._detect_from_git_remote("/path/to/repo")
        assert info is not None
        assert info.owner == "octocat"
        assert info.name == "hello-world"

    @patch("src.github.detector.subprocess.run")
    def test_detect_from_git_remote_no_github_origin(self, mock_run):
        """git remote -v with non-GitHub origin returns None."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="origin\thttps://gitlab.com/user/repo.git (fetch)\n",
        )
        detector = GitHubRepoDetector()
        info = detector._detect_from_git_remote("/path/to/repo")
        assert info is None

    @patch("src.github.detector.subprocess.run")
    def test_detect_from_git_remote_not_git_repo(self, mock_run):
        """git remote -v fails (not a git repo) returns None."""
        mock_run.return_value = MagicMock(returncode=128, stdout="")
        detector = GitHubRepoDetector()
        info = detector._detect_from_git_remote("/not/a/repo")
        assert info is None

    @patch("src.github.detector.subprocess.run")
    def test_detect_from_git_remote_subprocess_error(self, mock_run):
        """Subprocess error returns None."""
        mock_run.side_effect = subprocess.SubprocessError("error")
        detector = GitHubRepoDetector()
        info = detector._detect_from_git_remote("/path/to/repo")
        assert info is None


# ============================================================================
# GitHubClient
# ============================================================================


class TestGitHubClient:
    """Tests for GitHubClient."""

    @patch("src.github.client.subprocess.run")
    def test_check_installation_success(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0)
        client = GitHubClient()
        assert client.check_installation() is True

    @patch("src.github.client.subprocess.run")
    def test_check_installation_failure(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1)
        client = GitHubClient()
        assert client.check_installation() is False

    @patch("src.github.client.subprocess.run")
    def test_check_installation_not_found(self, mock_run):
        mock_run.side_effect = OSError("No such file")
        client = GitHubClient()
        assert client.check_installation() is False

    @patch("src.github.client.subprocess.run")
    def test_check_auth_success(self, mock_run):
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="",
            stderr="Logged in to github.com account octocat",
        )
        client = GitHubClient()
        result = client.check_auth()
        assert result["authenticated"] is True
        assert result["user"] == "octocat"
        assert result["error"] is None

    @patch("src.github.client.subprocess.run")
    def test_check_auth_not_authenticated(self, mock_run):
        mock_run.return_value = MagicMock(
            returncode=1,
            stdout="",
            stderr="You are not logged into any GitHub hosts.",
        )
        client = GitHubClient()
        result = client.check_auth()
        assert result["authenticated"] is False
        assert result["user"] is None

    @patch("src.github.client.subprocess.run")
    def test_check_auth_subprocess_error(self, mock_run):
        mock_run.side_effect = subprocess.SubprocessError("timeout")
        client = GitHubClient()
        result = client.check_auth()
        assert result["authenticated"] is False
        assert "timeout" in result["error"]

    @patch("src.github.client.subprocess.run")
    def test_list_issues_success(self, mock_run):
        issues_json = json.dumps(
            [
                {"number": 1, "title": "Bug report", "state": "OPEN"},
                {"number": 2, "title": "Feature request", "state": "OPEN"},
            ]
        )
        mock_run.return_value = MagicMock(returncode=0, stdout=issues_json)
        client = GitHubClient()
        result = client.list_issues("octocat", "hello-world")
        assert len(result) == 2
        assert result[0]["number"] == 1

    @patch("src.github.client.subprocess.run")
    def test_list_issues_gh_error(self, mock_run):
        mock_run.side_effect = subprocess.CalledProcessError(1, "gh", stderr="not found")
        client = GitHubClient()
        with pytest.raises(GitHubError, match="issues"):
            client.list_issues("octocat", "nonexistent")

    @patch("src.github.client.subprocess.run")
    def test_list_issues_timeout(self, mock_run):
        mock_run.side_effect = subprocess.TimeoutExpired("gh", 30)
        client = GitHubClient()
        with pytest.raises(GitHubError, match="Timeout"):
            client.list_issues("octocat", "hello-world")

    @patch("src.github.client.subprocess.run")
    def test_list_pull_requests_success(self, mock_run):
        prs_json = json.dumps(
            [
                {"number": 10, "title": "Add feature", "state": "OPEN"},
            ]
        )
        mock_run.return_value = MagicMock(returncode=0, stdout=prs_json)
        client = GitHubClient()
        result = client.list_pull_requests("octocat", "hello-world")
        assert len(result) == 1
        assert result[0]["number"] == 10

    @patch("src.github.client.subprocess.run")
    def test_list_pull_requests_gh_error(self, mock_run):
        mock_run.side_effect = subprocess.CalledProcessError(1, "gh", stderr="auth required")
        client = GitHubClient()
        with pytest.raises(GitHubError, match="PRs"):
            client.list_pull_requests("octocat", "hello-world")

    def test_extract_username_with_account(self):
        client = GitHubClient()
        output = "  Logged in to github.com account octocat (token)\n"
        assert client._extract_username(output) == "octocat"

    def test_extract_username_with_as(self):
        client = GitHubClient()
        output = "  Logged in to github.com as octocat\n"
        assert client._extract_username(output) == "octocat"

    def test_extract_username_not_found(self):
        client = GitHubClient()
        output = "Not logged in\n"
        assert client._extract_username(output) is None
