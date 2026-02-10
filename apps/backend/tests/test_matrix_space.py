"""Unit tests for matrix.space module."""

import os
from unittest.mock import patch

import pytest

from src.matrix.model import Matrix
from src.matrix.space import (
    create_matrix_space,
    generate_matrix_md_content,
    update_matrix_md,
)
from src.source.model import Source


@pytest.fixture
def test_workspace(tmp_path):
    """Return a temporary workspace path string."""
    return str(tmp_path / "test-project-a1b2c3d4")


@pytest.fixture(autouse=True)
def patch_workspace_path(test_workspace):
    """Patch get_matrix_space_path to return test workspace for all tests."""
    with patch("src.config.paths.get_matrix_space_path", return_value=test_workspace):
        yield


@pytest.fixture
def tmp_matrix():
    """Create a Matrix pointing to the patched workspace."""
    return Matrix(
        id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        name="Test Project",
        source_ids=[],
        created_at="2024-01-15T10:30:00+00:00",
        updated_at="2024-01-15T10:30:00+00:00",
    )


@pytest.fixture
def sample_sources():
    """Create sample Source objects for testing."""
    return [
        Source(
            id="src-1",
            name="frontend",
            path="/home/user/repos/frontend",
            url="https://github.com/user/frontend",
            source_type="remote",
            created_at="2024-01-15T10:30:00+00:00",
        ),
        Source(
            id="src-2",
            name="backend",
            path="/home/user/repos/backend",
            url=None,
            source_type="local",
            created_at="2024-01-15T10:30:00+00:00",
        ),
    ]


class TestCreateMatrixSpace:
    """Tests for create_matrix_space function."""

    def test_creates_directory(self, tmp_matrix):
        create_matrix_space(tmp_matrix, [])
        assert os.path.isdir(tmp_matrix.workspace_path)

    def test_creates_matrix_md(self, tmp_matrix):
        create_matrix_space(tmp_matrix, [])
        md_path = os.path.join(tmp_matrix.workspace_path, "MATRIX.md")
        assert os.path.isfile(md_path)

    def test_matrix_md_contains_name(self, tmp_matrix):
        create_matrix_space(tmp_matrix, [])
        md_path = os.path.join(tmp_matrix.workspace_path, "MATRIX.md")
        content = open(md_path).read()
        assert "# Test Project" in content

    def test_matrix_md_with_sources(self, tmp_matrix, sample_sources):
        create_matrix_space(tmp_matrix, sample_sources)
        md_path = os.path.join(tmp_matrix.workspace_path, "MATRIX.md")
        content = open(md_path).read()
        assert "### frontend" in content
        assert "### backend" in content
        assert "/home/user/repos/frontend" in content
        assert "https://github.com/user/frontend" in content

    def test_idempotent(self, tmp_matrix):
        create_matrix_space(tmp_matrix, [])
        create_matrix_space(tmp_matrix, [])
        assert os.path.isdir(tmp_matrix.workspace_path)


class TestUpdateMatrixMd:
    """Tests for update_matrix_md function."""

    def test_updates_existing(self, tmp_matrix, sample_sources):
        create_matrix_space(tmp_matrix, [])
        update_matrix_md(tmp_matrix, sample_sources)
        md_path = os.path.join(tmp_matrix.workspace_path, "MATRIX.md")
        content = open(md_path).read()
        assert "### frontend" in content

    def test_creates_if_missing(self, tmp_matrix, sample_sources):
        update_matrix_md(tmp_matrix, sample_sources)
        md_path = os.path.join(tmp_matrix.workspace_path, "MATRIX.md")
        assert os.path.isfile(md_path)
        content = open(md_path).read()
        assert "### frontend" in content


class TestGenerateMatrixMdContent:
    """Tests for generate_matrix_md_content function."""

    def test_empty_sources(self, tmp_matrix):
        content = generate_matrix_md_content(tmp_matrix, [])
        assert "# Test Project" in content
        assert "No sources added yet" in content

    def test_with_sources(self, tmp_matrix, sample_sources):
        content = generate_matrix_md_content(tmp_matrix, sample_sources)
        assert "# Test Project" in content
        assert "### frontend" in content
        assert "### backend" in content
        assert "https://github.com/user/frontend" in content
        # Backend has no URL, so URL line should not appear for it
        assert content.count("**URL**") == 1

    def test_contains_matrix_id(self, tmp_matrix):
        content = generate_matrix_md_content(tmp_matrix, [])
        assert tmp_matrix.id in content

    def test_contains_timestamps(self, tmp_matrix):
        content = generate_matrix_md_content(tmp_matrix, [])
        assert "2024-01-15" in content
