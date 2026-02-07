"""Unit tests for MatrixStorage persistence layer."""

import pytest
import tempfile
import os
from src.models import Matrix, Source
from src.persistence import MatrixStorage


class TestMatrixStorage:
    """Tests for MatrixStorage class."""

    @pytest.fixture
    def storage(self):
        """Create a temporary storage for testing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield MatrixStorage(base_path=tmpdir)

    def test_directories_created(self, storage):
        """Test that directories are created on save."""
        matrix = Matrix.create("Test")
        storage.save_matrix(matrix)
        assert os.path.exists(storage.matrices_path)
        assert os.path.exists(storage.sources_path)

    def test_save_and_load_matrix(self, storage):
        """Test Matrix save and load round-trip."""
        matrix = Matrix.create("Test Matrix")
        storage.save_matrix(matrix)

        loaded = storage.load_matrix(matrix.id)
        assert loaded is not None
        assert loaded.name == "Test Matrix"
        assert loaded.id == matrix.id

    def test_load_nonexistent_matrix(self, storage):
        """Test loading a matrix that doesn't exist returns None."""
        result = storage.load_matrix("nonexistent-id")
        assert result is None

    def test_list_matrices_empty(self, storage):
        """Test listing matrices when none exist."""
        matrices = storage.list_matrices()
        assert matrices == []

    def test_list_matrices(self, storage):
        """Test listing multiple matrices."""
        m1 = Matrix.create("Matrix One")
        m2 = Matrix.create("Matrix Two")
        storage.save_matrix(m1)
        storage.save_matrix(m2)

        matrices = storage.list_matrices()
        assert len(matrices) == 2
        names = {m.name for m in matrices}
        assert names == {"Matrix One", "Matrix Two"}

    def test_delete_matrix(self, storage):
        """Test deleting a matrix."""
        matrix = Matrix.create("To Delete")
        storage.save_matrix(matrix)

        assert storage.delete_matrix(matrix.id) == True
        assert storage.load_matrix(matrix.id) is None

    def test_delete_nonexistent_matrix(self, storage):
        """Test deleting a matrix that doesn't exist returns False."""
        result = storage.delete_matrix("nonexistent-id")
        assert result == False

    def test_save_and_load_source(self, storage):
        """Test Source save and load round-trip."""
        source = Source.create("my-repo", "/path/to/repo", "https://github.com/user/repo")
        storage.save_source(source)

        loaded = storage.load_source(source.id)
        assert loaded is not None
        assert loaded.name == "my-repo"
        assert loaded.path == "/path/to/repo"
        assert loaded.url == "https://github.com/user/repo"

    def test_list_sources(self, storage):
        """Test listing multiple sources."""
        s1 = Source.create("repo1", "/path1")
        s2 = Source.create("repo2", "/path2")
        storage.save_source(s1)
        storage.save_source(s2)

        sources = storage.list_sources()
        assert len(sources) == 2

    def test_delete_source(self, storage):
        """Test deleting a source."""
        source = Source.create("to-delete", "/path")
        storage.save_source(source)

        assert storage.delete_source(source.id) == True
        assert storage.load_source(source.id) is None
