"""Unit tests for GitHub IPC handlers in handler.py."""

from unittest.mock import patch

import pytest

from src.db import get_engine, init_db
from src.github.detector import GitHubRepoInfo
from src.ipc.handler import handle_message


@pytest.fixture(autouse=True)
def use_memory_db():
    """Patch get_engine to use in-memory SQLite for all handler tests."""
    engine = get_engine(":memory:")
    init_db(engine)

    with (
        patch("src.ipc.handler.get_engine", return_value=engine),
        patch("src.ipc.handler.init_db"),
        patch("src.ipc.handler.create_matrix_space"),
        patch("src.ipc.handler.update_matrix_md"),
    ):
        yield


# ============================================================================
# github-check handler
# ============================================================================


class TestGitHubCheckHandler:
    """Tests for the github-check IPC handler."""

    @patch("src.ipc.handler.GitHubClient")
    def test_github_check_not_installed(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.check_installation.return_value = False

        response = handle_message({"type": "github-check"})
        assert response["success"] is True
        assert response["data"]["installed"] is False
        assert response["data"]["authenticated"] is False
        assert response["data"]["user"] is None

    @patch("src.ipc.handler.GitHubClient")
    def test_github_check_installed_and_authenticated(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.check_installation.return_value = True
        mock_client.check_auth.return_value = {
            "authenticated": True,
            "user": "octocat",
            "error": None,
        }

        response = handle_message({"type": "github-check"})
        assert response["success"] is True
        assert response["data"]["installed"] is True
        assert response["data"]["authenticated"] is True
        assert response["data"]["user"] == "octocat"
        assert response["data"]["error"] is None

    @patch("src.ipc.handler.GitHubClient")
    def test_github_check_installed_not_authenticated(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.check_installation.return_value = True
        mock_client.check_auth.return_value = {
            "authenticated": False,
            "user": None,
            "error": "Not authenticated. Run 'gh auth login'",
        }

        response = handle_message({"type": "github-check"})
        assert response["success"] is True
        assert response["data"]["installed"] is True
        assert response["data"]["authenticated"] is False
        assert response["data"]["user"] is None
        assert "Not authenticated" in response["data"]["error"]


# ============================================================================
# github-detect-repos handler
# ============================================================================


class TestGitHubDetectReposHandler:
    """Tests for the github-detect-repos IPC handler."""

    def test_detect_repos_empty_source_ids(self):
        response = handle_message({"type": "github-detect-repos", "data": {"source_ids": []}})
        assert response["success"] is False
        assert "required" in response["error"]

    def test_detect_repos_missing_data(self):
        response = handle_message({"type": "github-detect-repos", "data": {}})
        assert response["success"] is False

    @patch("src.ipc.handler.GitHubRepoDetector")
    def test_detect_repos_with_sources(self, MockDetector):
        """Test detection with registered sources."""
        # First create a source
        source_response = handle_message(
            {
                "type": "source-create",
                "data": {
                    "name": "my-repo",
                    "path": "/tmp/my-repo",
                    "url": "https://github.com/owner/my-repo",
                    "source_type": "remote",
                },
            }
        )
        assert source_response["success"] is True
        source_id = source_response["data"]["source"]["id"]

        # Mock detector to return repo info
        mock_detector = MockDetector.return_value
        mock_detector.detect_from_source.return_value = GitHubRepoInfo(
            owner="owner", name="my-repo"
        )

        response = handle_message(
            {
                "type": "github-detect-repos",
                "data": {"source_ids": [source_id]},
            }
        )
        assert response["success"] is True
        repos = response["data"]["repos"]
        assert len(repos) == 1
        assert repos[0]["owner"] == "owner"
        assert repos[0]["repo"] == "my-repo"
        assert repos[0]["full_name"] == "owner/my-repo"
        assert repos[0]["source_id"] == source_id

    @patch("src.ipc.handler.GitHubRepoDetector")
    def test_detect_repos_skips_missing_source(self, MockDetector):
        """Non-existent source IDs are silently skipped."""
        mock_detector = MockDetector.return_value

        response = handle_message(
            {
                "type": "github-detect-repos",
                "data": {"source_ids": ["nonexistent-id"]},
            }
        )
        assert response["success"] is True
        assert response["data"]["repos"] == []
        mock_detector.detect_from_source.assert_not_called()

    @patch("src.ipc.handler.GitHubRepoDetector")
    def test_detect_repos_skips_non_github(self, MockDetector):
        """Source without GitHub remote is skipped."""
        # Create a source
        source_response = handle_message(
            {
                "type": "source-create",
                "data": {
                    "name": "non-github",
                    "path": "/tmp/non-github",
                    "source_type": "local",
                },
            }
        )
        source_id = source_response["data"]["source"]["id"]

        mock_detector = MockDetector.return_value
        mock_detector.detect_from_source.return_value = None

        response = handle_message(
            {
                "type": "github-detect-repos",
                "data": {"source_ids": [source_id]},
            }
        )
        assert response["success"] is True
        assert response["data"]["repos"] == []


# ============================================================================
# github-list-issues handler
# ============================================================================


class TestGitHubListIssuesHandler:
    """Tests for the github-list-issues IPC handler."""

    def test_list_issues_missing_repos(self):
        response = handle_message({"type": "github-list-issues", "data": {"repos": []}})
        assert response["success"] is False
        assert "required" in response["error"]

    @patch("src.ipc.handler.GitHubClient")
    def test_list_issues_success(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.list_issues.return_value = [
            {"number": 1, "title": "Bug", "state": "OPEN"},
            {"number": 2, "title": "Feature", "state": "OPEN"},
        ]

        response = handle_message(
            {
                "type": "github-list-issues",
                "data": {
                    "repos": [{"owner": "octocat", "repo": "hello-world"}],
                    "state": "open",
                    "limit": 50,
                },
            }
        )
        assert response["success"] is True
        issues = response["data"]["issues"]
        assert len(issues) == 2
        # _repository metadata is injected
        assert issues[0]["_repository"] == {"owner": "octocat", "name": "hello-world"}
        assert response["data"]["errors"] is None

    @patch("src.ipc.handler.GitHubClient")
    def test_list_issues_partial_failure(self, MockClient):
        """One repo succeeds, one fails."""
        from src.github import GitHubError

        mock_client = MockClient.return_value

        def side_effect(owner, repo, state, limit):
            if repo == "good-repo":
                return [{"number": 1, "title": "Issue"}]
            raise GitHubError("Not found")

        mock_client.list_issues.side_effect = side_effect

        response = handle_message(
            {
                "type": "github-list-issues",
                "data": {
                    "repos": [
                        {"owner": "o", "repo": "good-repo"},
                        {"owner": "o", "repo": "bad-repo"},
                    ],
                },
            }
        )
        assert response["success"] is True
        assert len(response["data"]["issues"]) == 1
        assert len(response["data"]["errors"]) == 1
        assert "bad-repo" in response["data"]["errors"][0]

    def test_list_issues_invalid_repo_spec(self):
        """Invalid repo spec (missing owner/repo) produces an error entry."""
        response = handle_message(
            {
                "type": "github-list-issues",
                "data": {"repos": [{"owner": "o"}]},
            }
        )
        assert response["success"] is True
        assert len(response["data"]["errors"]) == 1


# ============================================================================
# github-list-prs handler
# ============================================================================


class TestGitHubListPRsHandler:
    """Tests for the github-list-prs IPC handler."""

    def test_list_prs_missing_repos(self):
        response = handle_message({"type": "github-list-prs", "data": {"repos": []}})
        assert response["success"] is False
        assert "required" in response["error"]

    @patch("src.ipc.handler.GitHubClient")
    def test_list_prs_success(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.list_pull_requests.return_value = [
            {"number": 10, "title": "Add feature", "state": "OPEN", "isDraft": False},
        ]

        response = handle_message(
            {
                "type": "github-list-prs",
                "data": {
                    "repos": [{"owner": "octocat", "repo": "hello-world"}],
                    "state": "all",
                },
            }
        )
        assert response["success"] is True
        prs = response["data"]["prs"]
        assert len(prs) == 1
        assert prs[0]["_repository"] == {"owner": "octocat", "name": "hello-world"}
        assert response["data"]["errors"] is None

    @patch("src.ipc.handler.GitHubClient")
    def test_list_prs_gh_error(self, MockClient):
        from src.github import GitHubError

        mock_client = MockClient.return_value
        mock_client.list_pull_requests.side_effect = GitHubError("auth required")

        response = handle_message(
            {
                "type": "github-list-prs",
                "data": {"repos": [{"owner": "o", "repo": "r"}]},
            }
        )
        assert response["success"] is True
        assert response["data"]["prs"] == []
        assert len(response["data"]["errors"]) == 1
