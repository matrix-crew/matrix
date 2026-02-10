"""Unit tests for Matrix and Source models."""

from src.matrix import Matrix
from src.source import Source


class TestMatrix:
    """Tests for Matrix dataclass."""

    def test_create_matrix(self):
        """Test Matrix.create() generates valid instance."""
        matrix = Matrix.create("Test Matrix")
        assert matrix.name == "Test Matrix"
        assert len(matrix.id) == 36  # UUID format
        assert matrix.source_ids == []
        assert matrix.workspace_path.endswith(f"test-matrix-{matrix.id.split('-')[0]}")
        assert matrix.created_at is not None
        assert matrix.updated_at is not None

    def test_create_matrix_with_source_ids(self):
        """Test Matrix.create() accepts source_ids."""
        matrix = Matrix.create("Test", source_ids=["s1", "s2"])
        assert matrix.source_ids == ["s1", "s2"]

    def test_matrix_to_json(self):
        """Test Matrix serialization to JSON."""
        matrix = Matrix.create("Test")
        json_data = matrix.to_json()
        assert json_data["name"] == "Test"
        assert "id" in json_data
        assert json_data["source_ids"] == []
        assert "workspace_path" in json_data
        assert "created_at" in json_data
        assert "updated_at" in json_data

    def test_matrix_from_json(self):
        """Test Matrix deserialization from JSON."""
        json_data = {
            "id": "test-uuid",
            "name": "Test Matrix",
            "source_ids": ["s1", "s2"],
            "workspace_path": "/home/user/.matrix/test-matrix-test",
            "created_at": "2024-01-01T00:00:00+00:00",
            "updated_at": "2024-01-01T00:00:00+00:00",
        }
        matrix = Matrix.from_json(json_data)
        assert matrix.id == "test-uuid"
        assert matrix.name == "Test Matrix"
        assert matrix.source_ids == ["s1", "s2"]
        assert matrix.workspace_path == "/home/user/.matrix/test-matrix-test"

    def test_matrix_json_round_trip(self):
        """Test Matrix survives JSON round-trip."""
        original = Matrix.create("Round Trip", source_ids=["a", "b"])
        json_data = original.to_json()
        restored = Matrix.from_json(json_data)
        assert restored.id == original.id
        assert restored.name == original.name
        assert restored.source_ids == original.source_ids
        assert restored.workspace_path == original.workspace_path


class TestSource:
    """Tests for Source dataclass."""

    def test_create_source(self):
        """Test Source.create() generates valid instance."""
        source = Source.create("repo", "/path/to/repo")
        assert source.name == "repo"
        assert source.path == "/path/to/repo"
        assert source.url is None
        assert len(source.id) == 36  # UUID format
        assert source.created_at is not None

    def test_create_source_with_url(self):
        """Test Source.create() accepts optional URL."""
        source = Source.create("repo", "/path", url="https://github.com/user/repo")
        assert source.url == "https://github.com/user/repo"

    def test_source_to_json(self):
        """Test Source serialization to JSON."""
        source = Source.create("repo", "/path", url="https://example.com")
        json_data = source.to_json()
        assert json_data["name"] == "repo"
        assert json_data["path"] == "/path"
        assert json_data["url"] == "https://example.com"

    def test_source_from_json(self):
        """Test Source deserialization from JSON."""
        json_data = {
            "id": "source-uuid",
            "name": "my-repo",
            "path": "/home/user/repo",
            "url": None,
            "created_at": "2024-01-01T00:00:00+00:00",
        }
        source = Source.from_json(json_data)
        assert source.id == "source-uuid"
        assert source.name == "my-repo"
        assert source.path == "/home/user/repo"
        assert source.url is None

    def test_source_json_round_trip(self):
        """Test Source survives JSON round-trip."""
        original = Source.create("test", "/test/path", "git@github.com:test/repo.git")
        json_data = original.to_json()
        restored = Source.from_json(json_data)
        assert restored.id == original.id
        assert restored.name == original.name
        assert restored.path == original.path
        assert restored.url == original.url
