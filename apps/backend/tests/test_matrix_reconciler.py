"""Unit tests for MatrixReconciler filesystem-database reconciliation."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.matrix.model import Matrix
from src.matrix.reconciler import MatrixReconciler
from src.source.cloner import CloneError
from src.source.model import Source


@pytest.fixture
def workspace(tmp_path):
    """Create a temporary matrix workspace directory."""
    ws = tmp_path / "matrices" / "test-matrix-abc12345"
    ws.mkdir(parents=True)
    return ws


@pytest.fixture(autouse=True)
def patch_workspace_path(workspace):
    """Patch get_matrix_space_path to return test workspace for all tests."""
    with patch("src.config.paths.get_matrix_space_path", return_value=str(workspace)):
        yield


@pytest.fixture
def matrix():
    """Create a Matrix pointing to the temporary workspace."""
    return Matrix(
        id="abc12345-1234-5678-9012-abcdefabcdef",
        name="Test Matrix",
        source_ids=["src-1111", "src-2222"],
        created_at="2025-01-01T00:00:00+00:00",
        updated_at="2025-01-01T00:00:00+00:00",
    )


@pytest.fixture
def local_source(tmp_path):
    """Create a local source with an existing directory."""
    src_dir = tmp_path / "local-repo"
    src_dir.mkdir()
    (src_dir / "README.md").write_text("# Local")
    return Source(
        id="src-1111",
        name="local-repo",
        path=str(src_dir),
        url=None,
        source_type="local",
        created_at="2025-01-01T00:00:00+00:00",
    )


@pytest.fixture
def remote_source(tmp_path):
    """Create a remote source with a cloned directory."""
    clone_dir = tmp_path / "repositories" / "remote-repo"
    clone_dir.mkdir(parents=True)
    (clone_dir / ".git").mkdir()
    return Source(
        id="src-2222",
        name="remote-repo",
        path=str(clone_dir),
        url="https://github.com/user/remote-repo.git",
        source_type="remote",
        created_at="2025-01-01T00:00:00+00:00",
    )


class TestReconcileAllOk:
    """Tests when everything is in order."""

    def test_all_ok_no_repairs(self, workspace, matrix, local_source, remote_source):
        """Test reconcile when workspace, MATRIX.md, and all symlinks exist."""
        (workspace / "MATRIX.md").write_text("# Test")
        (workspace / "local-repo").symlink_to(local_source.path)
        (workspace / "remote-repo").symlink_to(remote_source.path)

        reconciler = MatrixReconciler()
        report = reconciler.reconcile(matrix, [local_source, remote_source])

        assert not report.workspace_recreated
        assert not report.matrix_md_recreated
        assert not report.has_repairs
        assert len(report.sources_reconciled) == 2
        assert all(r.status == "ok" for r in report.sources_reconciled)
        assert report.orphaned_source_ids == []


class TestReconcileWorkspace:
    """Tests for workspace folder reconciliation."""

    def test_workspace_missing_recreated(self, tmp_path, local_source, remote_source):
        """Test workspace folder is recreated when missing."""
        ws = str(tmp_path / "nonexistent" / "workspace")
        with patch("src.config.paths.get_matrix_space_path", return_value=ws):
            matrix = Matrix(
                id="abc12345-1234-5678-9012-abcdefabcdef",
                name="Test Matrix",
                source_ids=["src-1111", "src-2222"],
                created_at="2025-01-01T00:00:00+00:00",
                updated_at="2025-01-01T00:00:00+00:00",
            )

            reconciler = MatrixReconciler()
            report = reconciler.reconcile(matrix, [local_source, remote_source])

        assert report.workspace_recreated
        assert report.matrix_md_recreated
        assert Path(ws).is_dir()
        assert (Path(ws) / "MATRIX.md").exists()
        assert report.has_repairs


class TestReconcileMatrixMd:
    """Tests for MATRIX.md reconciliation."""

    def test_matrix_md_missing_recreated(self, workspace, matrix, local_source, remote_source):
        """Test MATRIX.md is recreated when missing."""
        (workspace / "local-repo").symlink_to(local_source.path)
        (workspace / "remote-repo").symlink_to(remote_source.path)

        reconciler = MatrixReconciler()
        report = reconciler.reconcile(matrix, [local_source, remote_source])

        assert not report.workspace_recreated
        assert report.matrix_md_recreated
        assert (workspace / "MATRIX.md").exists()
        assert report.has_repairs


class TestReconcileLocalSource:
    """Tests for local source symlink reconciliation."""

    def test_local_symlink_missing_recreated(self, workspace, matrix, local_source, remote_source):
        """Test local source symlink is recreated when missing."""
        (workspace / "MATRIX.md").write_text("# Test")
        (workspace / "remote-repo").symlink_to(remote_source.path)

        reconciler = MatrixReconciler()
        report = reconciler.reconcile(matrix, [local_source, remote_source])

        local_result = next(r for r in report.sources_reconciled if r.source_id == "src-1111")
        assert local_result.status == "repaired"
        assert "symlink recreated" in local_result.action
        assert (workspace / "local-repo").is_symlink()

    def test_local_source_path_missing_skipped(self, workspace, matrix, remote_source):
        """Test local source is skipped when its original path doesn't exist."""
        (workspace / "MATRIX.md").write_text("# Test")
        (workspace / "remote-repo").symlink_to(remote_source.path)

        missing_source = Source(
            id="src-1111",
            name="missing-local",
            path="/nonexistent/path/missing",
            url=None,
            source_type="local",
            created_at="2025-01-01T00:00:00+00:00",
        )

        reconciler = MatrixReconciler()
        report = reconciler.reconcile(matrix, [missing_source, remote_source])

        local_result = next(r for r in report.sources_reconciled if r.source_id == "src-1111")
        assert local_result.status == "skipped"
        assert "local path missing" in local_result.action


class TestReconcileRemoteSource:
    """Tests for remote source clone + symlink reconciliation."""

    def test_remote_clone_missing_recloned(self, workspace, matrix, local_source):
        """Test remote source is recloned when clone directory is missing."""
        (workspace / "MATRIX.md").write_text("# Test")
        (workspace / "local-repo").symlink_to(local_source.path)

        missing_remote = Source(
            id="src-2222",
            name="remote-repo",
            path="/nonexistent/cloned/repo",
            url="https://github.com/user/remote-repo.git",
            source_type="remote",
            created_at="2025-01-01T00:00:00+00:00",
        )

        mock_cloner = MagicMock()
        mock_cloner.clone_repository.return_value = str(local_source.path)

        reconciler = MatrixReconciler(cloner=mock_cloner)
        report = reconciler.reconcile(matrix, [local_source, missing_remote])

        mock_cloner.clone_repository.assert_called_once_with(
            "https://github.com/user/remote-repo.git", "remote-repo"
        )
        remote_result = next(r for r in report.sources_reconciled if r.source_id == "src-2222")
        assert remote_result.status == "repaired"

    def test_remote_clone_failure_error(self, workspace, matrix, local_source):
        """Test error when reclone fails."""
        (workspace / "MATRIX.md").write_text("# Test")
        (workspace / "local-repo").symlink_to(local_source.path)

        missing_remote = Source(
            id="src-2222",
            name="remote-repo",
            path="/nonexistent/cloned/repo",
            url="https://github.com/user/remote-repo.git",
            source_type="remote",
            created_at="2025-01-01T00:00:00+00:00",
        )

        mock_cloner = MagicMock()
        mock_cloner.clone_repository.side_effect = CloneError("network error")

        reconciler = MatrixReconciler(cloner=mock_cloner)
        report = reconciler.reconcile(matrix, [local_source, missing_remote])

        remote_result = next(r for r in report.sources_reconciled if r.source_id == "src-2222")
        assert remote_result.status == "error"
        assert "reclone failed" in remote_result.action

    def test_remote_no_url_skipped(self, workspace, matrix, local_source):
        """Test remote source without URL is skipped when clone is missing."""
        (workspace / "MATRIX.md").write_text("# Test")
        (workspace / "local-repo").symlink_to(local_source.path)

        no_url_remote = Source(
            id="src-2222",
            name="remote-repo",
            path="/nonexistent/cloned/repo",
            url=None,
            source_type="remote",
            created_at="2025-01-01T00:00:00+00:00",
        )

        reconciler = MatrixReconciler()
        report = reconciler.reconcile(matrix, [local_source, no_url_remote])

        remote_result = next(r for r in report.sources_reconciled if r.source_id == "src-2222")
        assert remote_result.status == "skipped"
        assert "no URL" in remote_result.action


class TestReconcileOrphanedSources:
    """Tests for orphaned source ID detection."""

    def test_orphaned_source_ids_reported(self, workspace, matrix, local_source):
        """Test source IDs in matrix but not in DB are reported as orphaned."""
        (workspace / "MATRIX.md").write_text("# Test")
        (workspace / "local-repo").symlink_to(local_source.path)

        reconciler = MatrixReconciler()
        report = reconciler.reconcile(matrix, [local_source])

        assert "src-2222" in report.orphaned_source_ids
        assert "src-1111" not in report.orphaned_source_ids


class TestReconcileReport:
    """Tests for ReconcileReport serialization."""

    def test_to_json(self):
        """Test report serializes to JSON correctly."""
        from src.matrix.reconciler import ReconcileReport, SourceReconcileResult

        report = ReconcileReport(
            workspace_recreated=True,
            matrix_md_recreated=False,
            sources_reconciled=[
                SourceReconcileResult(
                    source_id="s1",
                    source_name="repo1",
                    status="ok",
                ),
                SourceReconcileResult(
                    source_id="s2",
                    source_name="repo2",
                    status="repaired",
                    action="symlink recreated",
                ),
            ],
            orphaned_source_ids=["s3"],
        )

        data = report.to_json()
        assert data["workspace_recreated"] is True
        assert data["matrix_md_recreated"] is False
        assert data["has_repairs"] is True
        assert len(data["sources_reconciled"]) == 2
        assert data["sources_reconciled"][0]["status"] == "ok"
        assert data["sources_reconciled"][1]["action"] == "symlink recreated"
        assert data["orphaned_source_ids"] == ["s3"]

    def test_has_repairs_false(self):
        """Test has_repairs is False when nothing was repaired."""
        from src.matrix.reconciler import ReconcileReport, SourceReconcileResult

        report = ReconcileReport(
            sources_reconciled=[
                SourceReconcileResult(source_id="s1", source_name="r", status="ok"),
            ],
        )
        assert not report.has_repairs
