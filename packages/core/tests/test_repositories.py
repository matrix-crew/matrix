"""Unit tests for Matrix and Source repositories using in-memory SQLite."""

import pytest

from src.db import get_engine, get_session, init_db
from src.matrix import Matrix, MatrixRepository
from src.source import Source, SourceRepository


@pytest.fixture
def engine():
    """Create an in-memory SQLite engine with tables initialized."""
    engine = get_engine(":memory:")
    init_db(engine)
    return engine


@pytest.fixture
def session(engine):
    """Create a session for testing."""
    with get_session(engine) as session:
        yield session


class TestMatrixRepository:
    """Tests for MatrixRepository class."""

    def test_create_and_get_matrix(self, session):
        """Test Matrix create and get round-trip."""
        repo = MatrixRepository(session)
        matrix = Matrix.create("Test Matrix")
        repo.create(matrix)
        session.flush()

        loaded = repo.get(matrix.id)
        assert loaded is not None
        assert loaded.name == "Test Matrix"
        assert loaded.id == matrix.id

    def test_get_nonexistent_matrix(self, session):
        """Test getting a matrix that doesn't exist returns None."""
        repo = MatrixRepository(session)
        result = repo.get("nonexistent-id")
        assert result is None

    def test_list_matrices_empty(self, session):
        """Test listing matrices when none exist."""
        repo = MatrixRepository(session)
        matrices = repo.list()
        assert matrices == []

    def test_list_matrices(self, session):
        """Test listing multiple matrices."""
        repo = MatrixRepository(session)
        m1 = Matrix.create("Matrix One")
        m2 = Matrix.create("Matrix Two")
        repo.create(m1)
        repo.create(m2)
        session.flush()

        matrices = repo.list()
        assert len(matrices) == 2
        names = {m.name for m in matrices}
        assert names == {"Matrix One", "Matrix Two"}

    def test_update_matrix(self, session):
        """Test updating a matrix."""
        repo = MatrixRepository(session)
        matrix = Matrix.create("Original")
        repo.create(matrix)
        session.flush()

        matrix.name = "Updated"
        repo.update(matrix)
        session.flush()

        loaded = repo.get(matrix.id)
        assert loaded is not None
        assert loaded.name == "Updated"

    def test_delete_matrix(self, session):
        """Test deleting a matrix."""
        repo = MatrixRepository(session)
        matrix = Matrix.create("To Delete")
        repo.create(matrix)
        session.flush()

        assert repo.delete(matrix.id) is True
        assert repo.get(matrix.id) is None

    def test_delete_nonexistent_matrix(self, session):
        """Test deleting a matrix that doesn't exist returns False."""
        repo = MatrixRepository(session)
        result = repo.delete("nonexistent-id")
        assert result is False

    def test_matrix_with_sources_junction(self, session):
        """Test Matrix-Source many-to-many via junction table."""
        matrix_repo = MatrixRepository(session)
        source_repo = SourceRepository(session)

        # Create sources first
        s1 = Source.create("repo1", "/path1")
        s2 = Source.create("repo2", "/path2")
        source_repo.create(s1)
        source_repo.create(s2)
        session.flush()

        # Create matrix with source_ids
        matrix = Matrix.create("With Sources", source_ids=[s1.id, s2.id])
        matrix_repo.create(matrix)
        session.flush()

        # Verify source_ids are loaded from junction
        loaded = matrix_repo.get(matrix.id)
        assert loaded is not None
        assert set(loaded.source_ids) == {s1.id, s2.id}

    def test_update_matrix_source_ids(self, session):
        """Test updating matrix source_ids re-syncs junction table."""
        matrix_repo = MatrixRepository(session)
        source_repo = SourceRepository(session)

        s1 = Source.create("repo1", "/path1")
        s2 = Source.create("repo2", "/path2")
        source_repo.create(s1)
        source_repo.create(s2)
        session.flush()

        matrix = Matrix.create("Test", source_ids=[s1.id])
        matrix_repo.create(matrix)
        session.flush()

        # Update to different source_ids
        matrix.source_ids = [s2.id]
        matrix_repo.update(matrix)
        session.flush()

        loaded = matrix_repo.get(matrix.id)
        assert loaded is not None
        assert loaded.source_ids == [s2.id]


class TestSourceRepository:
    """Tests for SourceRepository class."""

    def test_create_and_get_source(self, session):
        """Test Source create and get round-trip."""
        repo = SourceRepository(session)
        source = Source.create("my-repo", "/path/to/repo", "https://github.com/user/repo")
        repo.create(source)
        session.flush()

        loaded = repo.get(source.id)
        assert loaded is not None
        assert loaded.name == "my-repo"
        assert loaded.path == "/path/to/repo"
        assert loaded.url == "https://github.com/user/repo"

    def test_get_nonexistent_source(self, session):
        """Test getting a source that doesn't exist returns None."""
        repo = SourceRepository(session)
        result = repo.get("nonexistent-id")
        assert result is None

    def test_list_sources(self, session):
        """Test listing multiple sources."""
        repo = SourceRepository(session)
        s1 = Source.create("repo1", "/path1")
        s2 = Source.create("repo2", "/path2")
        repo.create(s1)
        repo.create(s2)
        session.flush()

        sources = repo.list()
        assert len(sources) == 2

    def test_delete_source(self, session):
        """Test deleting a source."""
        repo = SourceRepository(session)
        source = Source.create("to-delete", "/path")
        repo.create(source)
        session.flush()

        assert repo.delete(source.id) is True
        assert repo.get(source.id) is None

    def test_delete_nonexistent_source(self, session):
        """Test deleting a source that doesn't exist returns False."""
        repo = SourceRepository(session)
        result = repo.delete("nonexistent-id")
        assert result is False
