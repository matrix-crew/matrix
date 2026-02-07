"""Unit tests for IPC message handler."""

import pytest
import tempfile
import os
from unittest.mock import patch
from src.ipc.handler import handle_message
from src.persistence.storage import MatrixStorage


class TestPingHandler:
    """Tests for ping IPC handler."""

    def test_ping(self):
        """Test ping returns pong."""
        response = handle_message({"type": "ping"})
        assert response["success"] == True
        assert response["data"]["message"] == "pong"


class TestMatrixHandlers:
    """Tests for Matrix IPC handlers."""

    @pytest.fixture(autouse=True)
    def setup_temp_storage(self):
        """Use temporary directory for all matrix operations."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Patch MatrixStorage to use temporary directory
            original_init = MatrixStorage.__init__

            def patched_init(self, base_path=None):
                original_init(self, base_path=tmpdir)

            with patch.object(MatrixStorage, "__init__", patched_init):
                yield tmpdir

    def test_matrix_create(self):
        """Test matrix-create handler."""
        response = handle_message({
            "type": "matrix-create",
            "data": {"name": "Test Matrix"}
        })
        assert response["success"] == True
        assert "matrix" in response["data"]
        assert response["data"]["matrix"]["name"] == "Test Matrix"

    def test_matrix_create_empty_name(self):
        """Test matrix-create rejects empty name."""
        response = handle_message({
            "type": "matrix-create",
            "data": {"name": ""}
        })
        assert response["success"] == False
        assert "required" in response["error"].lower()

    def test_matrix_create_whitespace_name(self):
        """Test matrix-create rejects whitespace-only name."""
        response = handle_message({
            "type": "matrix-create",
            "data": {"name": "   "}
        })
        assert response["success"] == False
        assert "required" in response["error"].lower()

    def test_matrix_list(self):
        """Test matrix-list handler."""
        response = handle_message({"type": "matrix-list"})
        assert response["success"] == True
        assert "matrices" in response["data"]
        assert isinstance(response["data"]["matrices"], list)

    def test_matrix_get_not_found(self):
        """Test matrix-get with non-existent ID."""
        response = handle_message({
            "type": "matrix-get",
            "data": {"id": "nonexistent-id"}
        })
        assert response["success"] == False
        assert "not found" in response["error"].lower()

    def test_matrix_update_not_found(self):
        """Test matrix-update with non-existent ID."""
        response = handle_message({
            "type": "matrix-update",
            "data": {"id": "nonexistent-id", "name": "New Name"}
        })
        assert response["success"] == False
        assert "not found" in response["error"].lower()

    def test_matrix_delete_not_found(self):
        """Test matrix-delete with non-existent ID."""
        response = handle_message({
            "type": "matrix-delete",
            "data": {"id": "nonexistent-id"}
        })
        assert response["success"] == False
        assert "not found" in response["error"].lower()

    def test_matrix_crud_flow(self):
        """Test full Matrix CRUD flow."""
        # Create
        create_response = handle_message({
            "type": "matrix-create",
            "data": {"name": "CRUD Test"}
        })
        assert create_response["success"] == True
        matrix_id = create_response["data"]["matrix"]["id"]

        # Get
        get_response = handle_message({
            "type": "matrix-get",
            "data": {"id": matrix_id}
        })
        assert get_response["success"] == True
        assert get_response["data"]["matrix"]["name"] == "CRUD Test"

        # Update
        update_response = handle_message({
            "type": "matrix-update",
            "data": {"id": matrix_id, "name": "Updated Name"}
        })
        assert update_response["success"] == True
        assert update_response["data"]["matrix"]["name"] == "Updated Name"

        # List
        list_response = handle_message({"type": "matrix-list"})
        assert list_response["success"] == True
        assert len(list_response["data"]["matrices"]) >= 1

        # Delete
        delete_response = handle_message({
            "type": "matrix-delete",
            "data": {"id": matrix_id}
        })
        assert delete_response["success"] == True
        assert delete_response["data"]["deleted"] == True

        # Verify deleted
        get_response2 = handle_message({
            "type": "matrix-get",
            "data": {"id": matrix_id}
        })
        assert get_response2["success"] == False


class TestSourceHandlers:
    """Tests for Source IPC handlers."""

    @pytest.fixture(autouse=True)
    def setup_temp_storage(self):
        """Use temporary directory for all source operations."""
        with tempfile.TemporaryDirectory() as tmpdir:
            original_init = MatrixStorage.__init__

            def patched_init(self, base_path=None):
                original_init(self, base_path=tmpdir)

            with patch.object(MatrixStorage, "__init__", patched_init):
                yield tmpdir

    def test_source_create(self):
        """Test source-create handler."""
        response = handle_message({
            "type": "source-create",
            "data": {"name": "my-repo", "path": "/path/to/repo"}
        })
        assert response["success"] == True
        assert "source" in response["data"]
        assert response["data"]["source"]["name"] == "my-repo"

    def test_source_create_empty_name(self):
        """Test source-create rejects empty name."""
        response = handle_message({
            "type": "source-create",
            "data": {"name": "", "path": "/path"}
        })
        assert response["success"] == False

    def test_source_create_empty_path(self):
        """Test source-create rejects empty path."""
        response = handle_message({
            "type": "source-create",
            "data": {"name": "repo", "path": ""}
        })
        assert response["success"] == False

    def test_source_list(self):
        """Test source-list handler."""
        response = handle_message({"type": "source-list"})
        assert response["success"] == True
        assert "sources" in response["data"]


class TestUnknownHandler:
    """Tests for unknown message types."""

    def test_unknown_type(self):
        """Test unknown message type returns error."""
        response = handle_message({"type": "unknown-type"})
        assert response["success"] == False
        assert "unknown" in response["error"].lower()
