"""Unit tests for config.paths module."""

import os

from src.config.paths import (
    generate_matrix_folder_name,
    get_matrix_space_path,
    get_workspace_root,
    slugify,
)


class TestSlugify:
    """Tests for slugify function."""

    def test_basic_slugify(self):
        assert slugify("My Project") == "my-project"

    def test_special_characters(self):
        assert slugify("My Project!@#$%") == "my-project"

    def test_multiple_spaces(self):
        assert slugify("My   Project") == "my-project"

    def test_underscores(self):
        assert slugify("my_project_name") == "my-project-name"

    def test_leading_trailing_whitespace(self):
        assert slugify("  My Project  ") == "my-project"

    def test_hyphens_preserved(self):
        assert slugify("my-project") == "my-project"

    def test_unicode_korean(self):
        result = slugify("내 프로젝트")
        assert isinstance(result, str)

    def test_empty_string(self):
        assert slugify("") == ""


class TestGenerateMatrixFolderName:
    """Tests for generate_matrix_folder_name function."""

    def test_basic_folder_name(self):
        result = generate_matrix_folder_name("My Project", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        assert result == "my-project-a1b2c3d4"

    def test_short_uuid_prefix(self):
        result = generate_matrix_folder_name("Test", "12345678-abcd-efgh-ijkl-mnopqrstuvwx")
        assert result == "test-12345678"

    def test_empty_slug_fallback(self):
        """When name contains only special chars, falls back to 'matrix'."""
        result = generate_matrix_folder_name("!!!", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        assert result == "matrix-a1b2c3d4"

    def test_empty_name_fallback(self):
        """When name is empty, falls back to 'matrix'."""
        result = generate_matrix_folder_name("", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        assert result == "matrix-a1b2c3d4"


class TestGetWorkspaceRoot:
    """Tests for get_workspace_root function."""

    def test_returns_home_matrix(self):
        root = get_workspace_root()
        assert root == os.path.join(os.path.expanduser("~"), ".matrix")


class TestGetMatrixSpacePath:
    """Tests for get_matrix_space_path function."""

    def test_returns_full_path(self):
        path = get_matrix_space_path("My Project", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        expected = os.path.join(os.path.expanduser("~"), ".matrix", "my-project-a1b2c3d4")
        assert path == expected
