"""Unit tests for IPC message handler."""

from unittest.mock import MagicMock, patch

import pytest

from src.db import get_engine, init_db
from src.ipc.handler import handle_message
from src.source.cloner import CloneError


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


class TestPingHandler:
    """Tests for ping IPC handler."""

    def test_ping(self):
        """Test ping returns pong."""
        response = handle_message({"type": "ping"})
        assert response["success"] is True
        assert response["data"]["message"] == "pong"


class TestMatrixHandlers:
    """Tests for Matrix IPC handlers."""

    def test_matrix_create(self):
        """Test matrix-create handler."""
        response = handle_message({"type": "matrix-create", "data": {"name": "Test Matrix"}})
        assert response["success"] is True
        assert "matrix" in response["data"]
        assert response["data"]["matrix"]["name"] == "Test Matrix"

    def test_matrix_create_empty_name(self):
        """Test matrix-create rejects empty name."""
        response = handle_message({"type": "matrix-create", "data": {"name": ""}})
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_matrix_create_whitespace_name(self):
        """Test matrix-create rejects whitespace-only name."""
        response = handle_message({"type": "matrix-create", "data": {"name": "   "}})
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_matrix_list(self):
        """Test matrix-list handler."""
        response = handle_message({"type": "matrix-list"})
        assert response["success"] is True
        assert "matrices" in response["data"]
        assert isinstance(response["data"]["matrices"], list)

    def test_matrix_get_not_found(self):
        """Test matrix-get with non-existent ID."""
        response = handle_message({"type": "matrix-get", "data": {"id": "nonexistent-id"}})
        assert response["success"] is False
        assert "not found" in response["error"].lower()

    def test_matrix_update_not_found(self):
        """Test matrix-update with non-existent ID."""
        response = handle_message(
            {"type": "matrix-update", "data": {"id": "nonexistent-id", "name": "New Name"}}
        )
        assert response["success"] is False
        assert "not found" in response["error"].lower()

    def test_matrix_delete_not_found(self):
        """Test matrix-delete with non-existent ID."""
        response = handle_message({"type": "matrix-delete", "data": {"id": "nonexistent-id"}})
        assert response["success"] is False
        assert "not found" in response["error"].lower()

    def test_matrix_crud_flow(self):
        """Test full Matrix CRUD flow."""
        # Create
        create_response = handle_message({"type": "matrix-create", "data": {"name": "CRUD Test"}})
        assert create_response["success"] is True
        matrix_id = create_response["data"]["matrix"]["id"]

        # Get
        get_response = handle_message({"type": "matrix-get", "data": {"id": matrix_id}})
        assert get_response["success"] is True
        assert get_response["data"]["matrix"]["name"] == "CRUD Test"

        # Update
        update_response = handle_message(
            {"type": "matrix-update", "data": {"id": matrix_id, "name": "Updated Name"}}
        )
        assert update_response["success"] is True
        assert update_response["data"]["matrix"]["name"] == "Updated Name"

        # List
        list_response = handle_message({"type": "matrix-list"})
        assert list_response["success"] is True
        assert len(list_response["data"]["matrices"]) >= 1

        # Delete
        delete_response = handle_message({"type": "matrix-delete", "data": {"id": matrix_id}})
        assert delete_response["success"] is True
        assert delete_response["data"]["deleted"] is True

        # Verify deleted
        get_response2 = handle_message({"type": "matrix-get", "data": {"id": matrix_id}})
        assert get_response2["success"] is False


class TestSourceHandlers:
    """Tests for Source IPC handlers."""

    def test_source_create(self):
        """Test source-create handler."""
        response = handle_message(
            {"type": "source-create", "data": {"name": "my-repo", "path": "/path/to/repo"}}
        )
        assert response["success"] is True
        assert "source" in response["data"]
        assert response["data"]["source"]["name"] == "my-repo"

    def test_source_create_empty_name(self):
        """Test source-create rejects empty name."""
        response = handle_message({"type": "source-create", "data": {"name": "", "path": "/path"}})
        assert response["success"] is False

    def test_source_create_empty_path(self):
        """Test source-create rejects empty path."""
        response = handle_message({"type": "source-create", "data": {"name": "repo", "path": ""}})
        assert response["success"] is False

    def test_source_list(self):
        """Test source-list handler."""
        response = handle_message({"type": "source-list"})
        assert response["success"] is True
        assert "sources" in response["data"]


class TestSourceCreateLocalHandler:
    """Tests for source-create-local IPC handler."""

    def test_create_local_source(self, tmp_path):
        """Test creating a local source with a valid path."""
        source_dir = tmp_path / "my-repo"
        source_dir.mkdir()

        response = handle_message(
            {
                "type": "source-create-local",
                "data": {"name": "my-repo", "path": str(source_dir)},
            }
        )
        assert response["success"] is True
        source = response["data"]["source"]
        assert source["name"] == "my-repo"
        assert source["source_type"] == "local"
        assert source["path"] == str(source_dir)

    def test_create_local_source_nonexistent_path(self):
        """Test rejection when local path does not exist."""
        response = handle_message(
            {
                "type": "source-create-local",
                "data": {"name": "missing", "path": "/nonexistent/path/abc123"},
            }
        )
        assert response["success"] is False
        assert "does not exist" in response["error"]

    def test_create_local_source_empty_name(self, tmp_path):
        """Test rejection when name is empty."""
        response = handle_message(
            {
                "type": "source-create-local",
                "data": {"name": "", "path": str(tmp_path)},
            }
        )
        assert response["success"] is False
        assert "name" in response["error"].lower()

    def test_create_local_source_empty_path(self):
        """Test rejection when path is empty."""
        response = handle_message(
            {
                "type": "source-create-local",
                "data": {"name": "repo", "path": ""},
            }
        )
        assert response["success"] is False
        assert "path" in response["error"].lower()


class TestSourceCreateRemoteHandler:
    """Tests for source-create-remote IPC handler."""

    @patch("src.ipc.handler.RepositoryCloner")
    def test_create_remote_source(self, MockCloner):
        """Test creating a remote source with URL."""
        mock_instance = MagicMock()
        mock_instance.extract_repo_name.return_value = "my-repo"
        mock_instance.clone_repository.return_value = "/cloned/path/my-repo"
        MockCloner.return_value = mock_instance

        response = handle_message(
            {
                "type": "source-create-remote",
                "data": {"name": "my-repo", "url": "https://github.com/user/my-repo.git"},
            }
        )
        assert response["success"] is True
        source = response["data"]["source"]
        assert source["name"] == "my-repo"
        assert source["source_type"] == "remote"
        assert source["url"] == "https://github.com/user/my-repo.git"
        assert source["path"] == "/cloned/path/my-repo"
        assert response["data"]["clonePath"] == "/cloned/path/my-repo"

    @patch("src.ipc.handler.RepositoryCloner")
    def test_create_remote_source_auto_name(self, MockCloner):
        """Test auto-extracting name from URL when name is empty."""
        mock_instance = MagicMock()
        mock_instance.extract_repo_name.return_value = "auto-name"
        mock_instance.clone_repository.return_value = "/cloned/auto-name"
        MockCloner.return_value = mock_instance

        response = handle_message(
            {
                "type": "source-create-remote",
                "data": {"url": "https://github.com/user/auto-name.git"},
            }
        )
        assert response["success"] is True
        assert response["data"]["source"]["name"] == "auto-name"

    @patch("src.ipc.handler.RepositoryCloner")
    def test_create_remote_source_clone_failure(self, MockCloner):
        """Test error when git clone fails."""
        mock_instance = MagicMock()
        mock_instance.clone_repository.side_effect = CloneError("clone failed: repo not found")
        MockCloner.return_value = mock_instance

        response = handle_message(
            {
                "type": "source-create-remote",
                "data": {"name": "repo", "url": "https://github.com/user/bad.git"},
            }
        )
        assert response["success"] is False
        assert "clone failed" in response["error"]

    def test_create_remote_source_empty_url(self):
        """Test rejection when URL is empty."""
        response = handle_message(
            {
                "type": "source-create-remote",
                "data": {"name": "repo", "url": ""},
            }
        )
        assert response["success"] is False
        assert "url" in response["error"].lower()


class TestMatrixSourceAssociationWithSymlinks:
    """Tests for matrix-add-source and matrix-remove-source with symlink operations."""

    def _create_matrix(self, name="Test Matrix"):
        """Helper: create a matrix and return its ID."""
        resp = handle_message({"type": "matrix-create", "data": {"name": name}})
        assert resp["success"] is True
        return resp["data"]["matrix"]["id"]

    def _create_source(self, name="my-repo", path="/path/to/repo"):
        """Helper: create a source and return its ID."""
        resp = handle_message({"type": "source-create", "data": {"name": name, "path": path}})
        assert resp["success"] is True
        return resp["data"]["source"]["id"]

    @patch("src.ipc.handler.SourceLinker")
    def test_add_source_creates_symlink(self, MockLinker):
        """Test matrix-add-source triggers symlink creation."""
        mock_linker = MagicMock()
        MockLinker.return_value = mock_linker

        matrix_id = self._create_matrix()
        source_id = self._create_source()

        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix_id, "sourceId": source_id},
            }
        )
        assert response["success"] is True
        assert source_id in response["data"]["matrix"]["source_ids"]
        mock_linker.link_source_to_matrix.assert_called_once()

    @patch("src.ipc.handler.SourceLinker")
    def test_add_source_symlink_failure_non_blocking(self, MockLinker):
        """Test that symlink failure doesn't block adding source."""
        from src.source.linker import SymlinkError

        mock_linker = MagicMock()
        mock_linker.link_source_to_matrix.side_effect = SymlinkError("symlink failed")
        MockLinker.return_value = mock_linker

        matrix_id = self._create_matrix()
        source_id = self._create_source()

        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix_id, "sourceId": source_id},
            }
        )
        # Should still succeed even though symlink failed
        assert response["success"] is True
        assert source_id in response["data"]["matrix"]["source_ids"]

    @patch("src.ipc.handler.SourceLinker")
    def test_remove_source_removes_symlink(self, MockLinker):
        """Test matrix-remove-source triggers symlink removal."""
        mock_linker = MagicMock()
        MockLinker.return_value = mock_linker

        matrix_id = self._create_matrix()
        source_id = self._create_source()

        # First add source
        handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix_id, "sourceId": source_id},
            }
        )

        # Reset to track remove call
        mock_linker.reset_mock()

        # Now remove
        response = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"matrixId": matrix_id, "sourceId": source_id},
            }
        )
        assert response["success"] is True
        assert source_id not in response["data"]["matrix"]["source_ids"]
        mock_linker.unlink_source_from_matrix.assert_called_once()


class TestMatrixReconcileHandler:
    """Tests for matrix-reconcile IPC handler."""

    def _create_matrix(self, name="Test Matrix"):
        """Helper: create a matrix and return its ID."""
        resp = handle_message({"type": "matrix-create", "data": {"name": name}})
        assert resp["success"] is True
        return resp["data"]["matrix"]["id"]

    def _create_source(self, name="my-repo", path="/path/to/repo"):
        """Helper: create a source and return its ID."""
        resp = handle_message({"type": "source-create", "data": {"name": name, "path": path}})
        assert resp["success"] is True
        return resp["data"]["source"]["id"]

    def test_reconcile_missing_id(self):
        """Test matrix-reconcile rejects missing ID."""
        response = handle_message({"type": "matrix-reconcile", "data": {}})
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_reconcile_not_found(self):
        """Test matrix-reconcile with non-existent matrix."""
        response = handle_message({"type": "matrix-reconcile", "data": {"id": "nonexistent"}})
        assert response["success"] is False
        assert "not found" in response["error"].lower()

    @patch("src.ipc.handler.MatrixReconciler")
    @patch("src.ipc.handler.SourceLinker")
    def test_reconcile_success(self, MockLinker, MockReconciler):
        """Test successful reconcile returns matrix and report."""
        from src.matrix.reconciler import ReconcileReport

        mock_reconciler = MagicMock()
        mock_reconciler.reconcile.return_value = ReconcileReport()
        MockReconciler.return_value = mock_reconciler

        matrix_id = self._create_matrix()
        source_id = self._create_source()

        # Add source to matrix
        mock_linker = MagicMock()
        MockLinker.return_value = mock_linker
        handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix_id, "sourceId": source_id},
            }
        )

        response = handle_message({"type": "matrix-reconcile", "data": {"id": matrix_id}})
        assert response["success"] is True
        assert "matrix" in response["data"]
        assert "report" in response["data"]
        assert response["data"]["report"]["has_repairs"] is False
        mock_reconciler.reconcile.assert_called_once()

    @patch("src.ipc.handler.MatrixReconciler")
    def test_reconcile_empty_matrix(self, MockReconciler):
        """Test reconcile works on matrix with no sources."""
        from src.matrix.reconciler import ReconcileReport

        mock_reconciler = MagicMock()
        mock_reconciler.reconcile.return_value = ReconcileReport(workspace_recreated=True)
        MockReconciler.return_value = mock_reconciler

        matrix_id = self._create_matrix()

        response = handle_message({"type": "matrix-reconcile", "data": {"id": matrix_id}})
        assert response["success"] is True
        assert response["data"]["report"]["workspace_recreated"] is True


class TestUnknownHandler:
    """Tests for unknown message types."""

    def test_unknown_type(self):
        """Test unknown message type returns error."""
        response = handle_message({"type": "unknown-type"})
        assert response["success"] is False
        assert "unknown" in response["error"].lower()
