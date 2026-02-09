"""Tests for IPC handlers that were previously uncovered.

Covers: source-get, matrix-add-source, matrix-remove-source handlers,
and edge cases for existing handlers.
"""

from unittest.mock import patch

import pytest

from src.db import get_engine, init_db
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


# ─── Helpers ─────────────────────────────────────────────────────────


def _create_matrix(name: str = "Test Matrix") -> dict:
    """Helper: create a matrix and return response data."""
    response = handle_message({"type": "matrix-create", "data": {"name": name}})
    assert response["success"] is True
    return response["data"]["matrix"]


def _create_source(name: str = "repo", path: str = "/path/to/repo", url: str | None = None) -> dict:
    """Helper: create a source and return response data."""
    data = {"name": name, "path": path}
    if url:
        data["url"] = url
    response = handle_message({"type": "source-create", "data": data})
    assert response["success"] is True
    return response["data"]["source"]


# ─── source-get handler ─────────────────────────────────────────────


class TestSourceGetHandler:
    """Tests for source-get IPC handler."""

    def test_source_get_success(self):
        """Test source-get returns source by ID."""
        source = _create_source("my-repo", "/home/user/my-repo")
        response = handle_message({"type": "source-get", "data": {"id": source["id"]}})
        assert response["success"] is True
        assert response["data"]["source"]["name"] == "my-repo"
        assert response["data"]["source"]["path"] == "/home/user/my-repo"

    def test_source_get_with_url(self):
        """Test source-get includes URL when set."""
        source = _create_source("repo", "/path", "https://github.com/user/repo")
        response = handle_message({"type": "source-get", "data": {"id": source["id"]}})
        assert response["success"] is True
        assert response["data"]["source"]["url"] == "https://github.com/user/repo"

    def test_source_get_not_found(self):
        """Test source-get with non-existent ID returns error."""
        response = handle_message({"type": "source-get", "data": {"id": "nonexistent-id"}})
        assert response["success"] is False
        assert "not found" in response["error"].lower()

    def test_source_get_empty_id(self):
        """Test source-get with empty ID returns error."""
        response = handle_message({"type": "source-get", "data": {"id": ""}})
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_source_get_missing_id(self):
        """Test source-get with no ID field returns error."""
        response = handle_message({"type": "source-get", "data": {}})
        assert response["success"] is False


# ─── matrix-add-source handler ──────────────────────────────────────


class TestMatrixAddSourceHandler:
    """Tests for matrix-add-source IPC handler."""

    def test_add_source_to_matrix(self):
        """Test adding a source to a matrix."""
        matrix = _create_matrix("My Matrix")
        source = _create_source("repo1", "/path1")

        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source["id"]},
            }
        )
        assert response["success"] is True
        assert source["id"] in response["data"]["matrix"]["source_ids"]

    def test_add_multiple_sources(self):
        """Test adding multiple sources to a matrix."""
        matrix = _create_matrix("Multi Source")
        source1 = _create_source("repo1", "/path1")
        source2 = _create_source("repo2", "/path2")

        handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source1["id"]},
            }
        )
        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source2["id"]},
            }
        )
        assert response["success"] is True
        assert source1["id"] in response["data"]["matrix"]["source_ids"]
        assert source2["id"] in response["data"]["matrix"]["source_ids"]

    def test_add_source_idempotent(self):
        """Test adding same source twice is idempotent."""
        matrix = _create_matrix("Idempotent")
        source = _create_source("repo", "/path")

        handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source["id"]},
            }
        )
        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source["id"]},
            }
        )
        assert response["success"] is True
        source_ids = response["data"]["matrix"]["source_ids"]
        assert source_ids.count(source["id"]) == 1

    def test_add_source_missing_matrix_id(self):
        """Test matrix-add-source with missing matrixId."""
        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"sourceId": "some-id"},
            }
        )
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_add_source_missing_source_id(self):
        """Test matrix-add-source with missing sourceId."""
        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": "some-id"},
            }
        )
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_add_source_matrix_not_found(self):
        """Test matrix-add-source with non-existent matrix."""
        response = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": "bad-matrix-id", "sourceId": "some-source"},
            }
        )
        assert response["success"] is False
        assert "not found" in response["error"].lower()


# ─── matrix-remove-source handler ───────────────────────────────────


class TestMatrixRemoveSourceHandler:
    """Tests for matrix-remove-source IPC handler."""

    def test_remove_source_from_matrix(self):
        """Test removing a source from a matrix."""
        matrix = _create_matrix("Remove Test")
        source = _create_source("repo", "/path")

        # Add source first
        handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source["id"]},
            }
        )

        # Remove source
        response = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"matrixId": matrix["id"], "sourceId": source["id"]},
            }
        )
        assert response["success"] is True
        assert source["id"] not in response["data"]["matrix"]["source_ids"]

    def test_remove_nonexistent_source_from_matrix(self):
        """Test removing a source that isn't in the matrix succeeds silently."""
        matrix = _create_matrix("No Source")

        response = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"matrixId": matrix["id"], "sourceId": "not-in-matrix"},
            }
        )
        assert response["success"] is True

    def test_remove_source_missing_matrix_id(self):
        """Test matrix-remove-source with missing matrixId."""
        response = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"sourceId": "some-id"},
            }
        )
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_remove_source_missing_source_id(self):
        """Test matrix-remove-source with missing sourceId."""
        response = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"matrixId": "some-id"},
            }
        )
        assert response["success"] is False
        assert "required" in response["error"].lower()

    def test_remove_source_matrix_not_found(self):
        """Test matrix-remove-source with non-existent matrix."""
        response = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"matrixId": "bad-matrix", "sourceId": "some-source"},
            }
        )
        assert response["success"] is False
        assert "not found" in response["error"].lower()

    def test_remove_preserves_other_sources(self):
        """Test removing one source doesn't affect others."""
        matrix = _create_matrix("Multi")
        source1 = _create_source("repo1", "/path1")
        source2 = _create_source("repo2", "/path2")

        handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source1["id"]},
            }
        )
        handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source2["id"]},
            }
        )

        # Remove only source1
        response = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"matrixId": matrix["id"], "sourceId": source1["id"]},
            }
        )
        assert response["success"] is True
        assert source1["id"] not in response["data"]["matrix"]["source_ids"]
        assert source2["id"] in response["data"]["matrix"]["source_ids"]


# ─── Additional edge case tests ─────────────────────────────────────


class TestHandlerEdgeCases:
    """Edge case tests for IPC handlers."""

    def test_missing_type_field(self):
        """Test message with no type field."""
        response = handle_message({})
        assert response["success"] is False
        assert "unknown" in response["error"].lower()

    def test_matrix_update_empty_name(self):
        """Test matrix-update rejects empty name."""
        matrix = _create_matrix("Original Name")
        response = handle_message(
            {
                "type": "matrix-update",
                "data": {"id": matrix["id"], "name": ""},
            }
        )
        assert response["success"] is False

    def test_matrix_update_whitespace_name(self):
        """Test matrix-update rejects whitespace-only name."""
        matrix = _create_matrix("Original Name")
        response = handle_message(
            {
                "type": "matrix-update",
                "data": {"id": matrix["id"], "name": "   "},
            }
        )
        assert response["success"] is False

    def test_matrix_create_with_no_data(self):
        """Test matrix-create with missing data field."""
        response = handle_message({"type": "matrix-create"})
        assert response["success"] is False

    def test_source_create_missing_name_field(self):
        """Test source-create with missing name."""
        response = handle_message({"type": "source-create", "data": {"path": "/path"}})
        assert response["success"] is False

    def test_source_create_missing_path_field(self):
        """Test source-create with missing path."""
        response = handle_message({"type": "source-create", "data": {"name": "repo"}})
        assert response["success"] is False

    def test_matrix_get_missing_id(self):
        """Test matrix-get with missing id."""
        response = handle_message({"type": "matrix-get", "data": {}})
        assert response["success"] is False

    def test_matrix_delete_missing_id(self):
        """Test matrix-delete with missing id."""
        response = handle_message({"type": "matrix-delete", "data": {}})
        assert response["success"] is False

    def test_matrix_update_missing_id(self):
        """Test matrix-update with missing id."""
        response = handle_message({"type": "matrix-update", "data": {"name": "New"}})
        assert response["success"] is False

    def test_full_source_crud_flow(self):
        """Test complete Source create → get → list flow."""
        # Create
        source = _create_source("test-repo", "/test/path", "https://example.com")

        # Get
        get_response = handle_message({"type": "source-get", "data": {"id": source["id"]}})
        assert get_response["success"] is True
        assert get_response["data"]["source"]["name"] == "test-repo"

        # List
        list_response = handle_message({"type": "source-list"})
        assert list_response["success"] is True
        assert any(s["id"] == source["id"] for s in list_response["data"]["sources"])

    def test_full_matrix_source_association_flow(self):
        """Test complete Matrix-Source association flow: create → add → get → remove → verify."""
        matrix = _create_matrix("Association Flow")
        source = _create_source("assoc-repo", "/path")

        # Add source
        add_resp = handle_message(
            {
                "type": "matrix-add-source",
                "data": {"matrixId": matrix["id"], "sourceId": source["id"]},
            }
        )
        assert add_resp["success"] is True

        # Verify via matrix-get
        get_resp = handle_message({"type": "matrix-get", "data": {"id": matrix["id"]}})
        assert source["id"] in get_resp["data"]["matrix"]["source_ids"]

        # Remove source
        remove_resp = handle_message(
            {
                "type": "matrix-remove-source",
                "data": {"matrixId": matrix["id"], "sourceId": source["id"]},
            }
        )
        assert remove_resp["success"] is True

        # Verify removed
        get_resp2 = handle_message({"type": "matrix-get", "data": {"id": matrix["id"]}})
        assert source["id"] not in get_resp2["data"]["matrix"]["source_ids"]
