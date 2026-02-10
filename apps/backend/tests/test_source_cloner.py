"""Unit tests for RepositoryCloner git clone management."""

import subprocess
from pathlib import Path
from unittest.mock import patch

import pytest

from src.source.cloner import CloneError, RepositoryCloner


@pytest.fixture
def cloner(tmp_path):
    """Create a RepositoryCloner with a temp repositories directory."""
    with patch.object(RepositoryCloner, "_get_repositories_dir", return_value=tmp_path):
        c = RepositoryCloner()
    return c


class TestExtractRepoName:
    """Tests for extract_repo_name."""

    def test_https_url(self):
        cloner = RepositoryCloner.__new__(RepositoryCloner)
        assert cloner.extract_repo_name("https://github.com/user/my-repo.git") == "my-repo"

    def test_https_url_no_git_suffix(self):
        cloner = RepositoryCloner.__new__(RepositoryCloner)
        assert cloner.extract_repo_name("https://github.com/user/my-repo") == "my-repo"

    def test_ssh_url(self):
        cloner = RepositoryCloner.__new__(RepositoryCloner)
        assert cloner.extract_repo_name("git@github.com:user/my-repo.git") == "my-repo"

    def test_ssh_url_no_git_suffix(self):
        cloner = RepositoryCloner.__new__(RepositoryCloner)
        assert cloner.extract_repo_name("git@github.com:user/my-repo") == "my-repo"

    def test_trailing_slash(self):
        cloner = RepositoryCloner.__new__(RepositoryCloner)
        assert cloner.extract_repo_name("https://github.com/user/my-repo/") == "my-repo"

    def test_fallback(self):
        cloner = RepositoryCloner.__new__(RepositoryCloner)
        assert cloner.extract_repo_name("") == "repository"


class TestCloneRepository:
    """Tests for clone_repository."""

    def test_raises_if_git_not_available(self, cloner):
        """Test error when git is not installed."""
        with patch.object(cloner, "_is_git_available", return_value=False):
            with pytest.raises(CloneError, match="git command not found"):
                cloner.clone_repository("https://github.com/user/repo.git")

    def test_returns_existing_clone(self, cloner):
        """Test returns path when repository already cloned."""
        existing = cloner.repositories_dir / "my-repo"
        existing.mkdir()
        (existing / ".git").mkdir()

        with patch.object(cloner, "_is_git_available", return_value=True):
            result = cloner.clone_repository("https://github.com/user/my-repo.git")

        assert result == str(existing)

    def test_successful_clone(self, cloner):
        """Test successful git clone."""
        with (
            patch.object(cloner, "_is_git_available", return_value=True),
            patch("src.source.cloner.subprocess.run") as mock_run,
        ):
            mock_run.return_value = subprocess.CompletedProcess([], 0)
            result = cloner.clone_repository("https://github.com/user/my-repo.git")

        expected_path = str(cloner.repositories_dir / "my-repo")
        assert result == expected_path
        mock_run.assert_called_once_with(
            ["git", "clone", "https://github.com/user/my-repo.git", expected_path],
            capture_output=True,
            text=True,
            timeout=300,
            check=True,
        )

    def test_custom_name(self, cloner):
        """Test clone with custom directory name."""
        with (
            patch.object(cloner, "_is_git_available", return_value=True),
            patch("src.source.cloner.subprocess.run") as mock_run,
        ):
            mock_run.return_value = subprocess.CompletedProcess([], 0)
            result = cloner.clone_repository("https://github.com/user/repo.git", "custom-name")

        assert result == str(cloner.repositories_dir / "custom-name")

    def test_clone_timeout(self, cloner):
        """Test timeout during clone."""
        with (
            patch.object(cloner, "_is_git_available", return_value=True),
            patch("src.source.cloner.subprocess.run") as mock_run,
        ):
            mock_run.side_effect = subprocess.TimeoutExpired(cmd=["git"], timeout=300)
            with pytest.raises(CloneError, match="timed out"):
                cloner.clone_repository("https://github.com/user/repo.git")

    def test_clone_failure(self, cloner):
        """Test clone command failure."""
        with (
            patch.object(cloner, "_is_git_available", return_value=True),
            patch("src.source.cloner.subprocess.run") as mock_run,
        ):
            mock_run.side_effect = subprocess.CalledProcessError(
                128, ["git"], stderr="fatal: repository not found"
            )
            with pytest.raises(CloneError, match="clone failed"):
                cloner.clone_repository("https://github.com/user/nonexistent.git")

    def test_name_collision_with_non_git_dir(self, cloner):
        """Test collision handling when directory exists but isn't a git repo."""
        existing = cloner.repositories_dir / "my-repo"
        existing.mkdir()
        # No .git directory — triggers collision handling

        with (
            patch.object(cloner, "_is_git_available", return_value=True),
            patch("src.source.cloner.subprocess.run") as mock_run,
        ):
            mock_run.return_value = subprocess.CompletedProcess([], 0)
            result = cloner.clone_repository("https://github.com/user/my-repo.git")

        # Should have used a different name (with hash suffix)
        assert result != str(existing)
        assert "my-repo-" in Path(result).name
