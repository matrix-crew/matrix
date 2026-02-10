"""Symlink management for sources in matrix workspaces.

Handles creation and deletion of symbolic links from matrix workspace
directories to source locations (local directories or cloned repositories).
"""

from pathlib import Path

from src.source.model import Source


class SymlinkError(Exception):
    """Raised when symlink operations fail."""


class SourceLinker:
    """Manages symbolic links for sources in matrix workspaces.

    Creates symlinks in matrix workspace directories pointing to source
    paths (local directories or cloned repositories). Handles name
    collisions and safe removal.
    """

    def link_source_to_matrix(self, source: Source, matrix_workspace_path: str) -> str:
        """Create a symlink in the matrix workspace pointing to the source.

        Args:
            source: Source to link (must have valid path).
            matrix_workspace_path: Absolute path to matrix workspace folder.

        Returns:
            Absolute path to the created symlink.

        Raises:
            SymlinkError: If source path doesn't exist or symlink creation fails.
        """
        workspace = Path(matrix_workspace_path)
        source_path = Path(source.path)

        if not source_path.exists():
            raise SymlinkError(f"Source path does not exist: {source.path}")

        workspace.mkdir(parents=True, exist_ok=True)

        link_name = self._sanitize_link_name(source.name)
        link_path = workspace / link_name

        # If symlink already points to same target, no-op
        if link_path.is_symlink() and link_path.resolve() == source_path.resolve():
            return str(link_path)

        # Handle collision: append short ID suffix
        if link_path.exists() or link_path.is_symlink():
            link_name = f"{link_name}-{source.id[:8]}"
            link_path = workspace / link_name

        try:
            link_path.symlink_to(source_path)
            return str(link_path)
        except OSError as e:
            raise SymlinkError(f"Failed to create symlink: {e}") from e

    def unlink_source_from_matrix(self, source: Source, matrix_workspace_path: str) -> None:
        """Remove symlink for a source from the matrix workspace.

        Only removes the symlink. Does NOT delete the source directory or clone.

        Args:
            source: Source to unlink.
            matrix_workspace_path: Absolute path to matrix workspace folder.

        Raises:
            SymlinkError: If symlink removal fails.
        """
        workspace = Path(matrix_workspace_path)
        link_name = self._sanitize_link_name(source.name)
        link_path = workspace / link_name

        # Try with ID suffix if direct name not found
        if not link_path.is_symlink():
            link_path = workspace / f"{link_name}-{source.id[:8]}"

        if link_path.is_symlink():
            try:
                link_path.unlink()
            except OSError as e:
                raise SymlinkError(f"Failed to remove symlink: {e}") from e

    def is_linked(self, source: Source, matrix_workspace_path: str) -> bool:
        """Check if a source is already symlinked in the matrix workspace.

        Checks both the base sanitized name and the ID-suffixed name.

        Args:
            source: Source to check.
            matrix_workspace_path: Absolute path to matrix workspace folder.

        Returns:
            True if a valid symlink exists pointing to the source path.
        """
        workspace = Path(matrix_workspace_path)
        if not workspace.exists():
            return False

        link_name = self._sanitize_link_name(source.name)
        candidates = [
            workspace / link_name,
            workspace / f"{link_name}-{source.id[:8]}",
        ]

        source_path = Path(source.path)
        for link_path in candidates:
            if link_path.is_symlink():
                try:
                    if link_path.resolve() == source_path.resolve():
                        return True
                except OSError:
                    continue
        return False

    def _sanitize_link_name(self, name: str) -> str:
        """Sanitize source name for use as symlink name."""
        return name.replace("/", "_").replace("\\", "_").replace(":", "_").strip()
