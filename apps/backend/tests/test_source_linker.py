"""Unit tests for SourceLinker symlink management."""

from pathlib import Path

import pytest

from src.source.linker import SourceLinker, SymlinkError
from src.source.model import Source


@pytest.fixture
def linker():
    """Create a SourceLinker instance."""
    return SourceLinker()


@pytest.fixture
def workspace(tmp_path):
    """Create a temporary matrix workspace directory."""
    ws = tmp_path / "workspace"
    ws.mkdir()
    return str(ws)


@pytest.fixture
def source_dir(tmp_path):
    """Create a temporary source directory with a file."""
    src = tmp_path / "my-repo"
    src.mkdir()
    (src / "README.md").write_text("# Test")
    return str(src)


@pytest.fixture
def source(source_dir):
    """Create a Source pointing to a real directory."""
    return Source(
        id="abc12345-1234-5678-9012-abcdefabcdef",
        name="my-repo",
        path=source_dir,
        url=None,
        source_type="local",
        created_at="2025-01-01T00:00:00+00:00",
    )


class TestLinkSourceToMatrix:
    """Tests for link_source_to_matrix."""

    def test_creates_symlink(self, linker, source, workspace):
        """Test basic symlink creation."""
        result = linker.link_source_to_matrix(source, workspace)
        link = Path(result)

        assert link.is_symlink()
        assert link.name == "my-repo"
        assert link.resolve() == Path(source.path).resolve()

    def test_creates_workspace_if_missing(self, linker, source, tmp_path):
        """Test workspace directory is created if it doesn't exist."""
        ws = str(tmp_path / "nonexistent" / "workspace")
        result = linker.link_source_to_matrix(source, ws)

        assert Path(result).is_symlink()
        assert Path(ws).is_dir()

    def test_noop_if_same_target(self, linker, source, workspace):
        """Test no-op when symlink already points to same target."""
        result1 = linker.link_source_to_matrix(source, workspace)
        result2 = linker.link_source_to_matrix(source, workspace)

        assert result1 == result2

    def test_collision_appends_id_suffix(self, linker, source, workspace):
        """Test name collision handling with ID suffix."""
        # Create a regular directory with the same name
        Path(workspace, "my-repo").mkdir()

        result = linker.link_source_to_matrix(source, workspace)
        link = Path(result)

        assert link.is_symlink()
        assert link.name == "my-repo-abc12345"

    def test_raises_if_source_path_missing(self, linker, workspace):
        """Test error when source path does not exist."""
        source = Source(
            id="test-id",
            name="missing",
            path="/nonexistent/path",
            url=None,
            source_type="local",
            created_at="2025-01-01T00:00:00+00:00",
        )

        with pytest.raises(SymlinkError, match="does not exist"):
            linker.link_source_to_matrix(source, workspace)

    def test_symlinked_files_accessible(self, linker, source, workspace):
        """Test that files are accessible through the symlink."""
        result = linker.link_source_to_matrix(source, workspace)
        readme = Path(result) / "README.md"

        assert readme.exists()
        assert readme.read_text() == "# Test"


class TestUnlinkSourceFromMatrix:
    """Tests for unlink_source_from_matrix."""

    def test_removes_symlink(self, linker, source, workspace):
        """Test symlink removal."""
        link_path = linker.link_source_to_matrix(source, workspace)
        assert Path(link_path).is_symlink()

        linker.unlink_source_from_matrix(source, workspace)
        assert not Path(link_path).exists()

    def test_removes_symlink_with_id_suffix(self, linker, source, workspace):
        """Test removal of symlink that has ID suffix."""
        # Create collision
        Path(workspace, "my-repo").mkdir()
        link_path = linker.link_source_to_matrix(source, workspace)
        assert "abc12345" in Path(link_path).name

        linker.unlink_source_from_matrix(source, workspace)
        assert not Path(link_path).exists()

    def test_noop_if_no_symlink(self, linker, source, workspace):
        """Test no error when symlink doesn't exist."""
        # Should not raise
        linker.unlink_source_from_matrix(source, workspace)

    def test_preserves_source_directory(self, linker, source, workspace, source_dir):
        """Test that unlinking does NOT delete the actual source directory."""
        linker.link_source_to_matrix(source, workspace)
        linker.unlink_source_from_matrix(source, workspace)

        # Source directory and contents still exist
        assert Path(source_dir).is_dir()
        assert (Path(source_dir) / "README.md").exists()

    def test_does_not_remove_real_directory(self, linker, workspace):
        """Test that a real directory with the same name is NOT removed."""
        source = Source(
            id="test-id",
            name="real-dir",
            path="/some/path",
            url=None,
            source_type="local",
            created_at="2025-01-01T00:00:00+00:00",
        )
        # Create a real directory (not a symlink) with the source name
        real_dir = Path(workspace) / "real-dir"
        real_dir.mkdir()

        linker.unlink_source_from_matrix(source, workspace)

        # Real directory should still exist
        assert real_dir.is_dir()


class TestSanitizeLinkName:
    """Tests for _sanitize_link_name."""

    def test_basic_name(self, linker):
        assert linker._sanitize_link_name("my-repo") == "my-repo"

    def test_replaces_slashes(self, linker):
        assert linker._sanitize_link_name("user/repo") == "user_repo"

    def test_replaces_backslashes(self, linker):
        assert linker._sanitize_link_name("user\\repo") == "user_repo"

    def test_replaces_colons(self, linker):
        assert linker._sanitize_link_name("C:repo") == "C_repo"

    def test_strips_whitespace(self, linker):
        assert linker._sanitize_link_name("  my-repo  ") == "my-repo"
