"""Path utilities for matrix workspace management.

Provides functions for generating workspace paths, slugifying names,
and managing matrix space folder naming conventions.
"""

import os
import re


def get_workspace_root() -> str:
    """Get the workspace root directory ($HOME/.matrix/).

    Returns:
        Absolute path to the workspace root directory.
    """
    return os.path.join(os.path.expanduser("~"), ".matrix")


def slugify(text: str) -> str:
    """Convert text to URL-safe slug.

    Lowercases the text, removes special characters, and replaces
    spaces/underscores with hyphens.

    Args:
        text: Text to slugify.

    Returns:
        Lowercase slug with hyphens, no special characters.
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def generate_matrix_folder_name(matrix_name: str, matrix_id: str) -> str:
    """Generate folder name from matrix name and ID.

    Combines a slugified name with the first segment of the UUID
    for human-readability with uniqueness guarantee.

    Args:
        matrix_name: Human-readable matrix name.
        matrix_id: Full UUID of the matrix.

    Returns:
        Folder name like "my-project-a1b2c3d4".
    """
    slug = slugify(matrix_name) or "matrix"
    short_id = matrix_id.split("-")[0]
    return f"{slug}-{short_id}"


def get_matrix_space_path(matrix_name: str, matrix_id: str) -> str:
    """Get full path to a matrix space folder.

    Matrix spaces live under ~/.matrix/matrices/ to keep them separated
    from other data (DB, repositories, config).

    Args:
        matrix_name: Human-readable matrix name.
        matrix_id: Full UUID of the matrix.

    Returns:
        Absolute path to the matrix workspace folder.
    """
    folder_name = generate_matrix_folder_name(matrix_name, matrix_id)
    return os.path.join(get_workspace_root(), "matrices", folder_name)
