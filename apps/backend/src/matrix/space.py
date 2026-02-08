"""Matrix workspace management and MATRIX.md generation.

Handles creation of matrix space folders and generation/update of
MATRIX.md context files that describe the matrix and its sources.
"""

from datetime import datetime
from pathlib import Path

from src.matrix.model import Matrix
from src.source.model import Source


def create_matrix_space(matrix: Matrix, sources: list[Source]) -> None:
    """Create matrix space folder and initialize MATRIX.md.

    Creates the workspace directory at the matrix's workspace_path
    and writes a MATRIX.md file with the current matrix context.

    Args:
        matrix: Matrix instance with workspace_path set.
        sources: List of sources to include in MATRIX.md.
    """
    space_path = Path(matrix.workspace_path)
    space_path.mkdir(parents=True, exist_ok=True)

    md_content = generate_matrix_md_content(matrix, sources)
    md_path = space_path / "MATRIX.md"
    md_path.write_text(md_content, encoding="utf-8")


def update_matrix_md(matrix: Matrix, sources: list[Source]) -> None:
    """Update MATRIX.md with current matrix state.

    If the workspace folder doesn't exist yet, creates it first.

    Args:
        matrix: Matrix instance with workspace_path set.
        sources: List of current sources in the matrix.
    """
    space_path = Path(matrix.workspace_path)
    if not space_path.exists():
        create_matrix_space(matrix, sources)
        return

    md_content = generate_matrix_md_content(matrix, sources)
    md_path = space_path / "MATRIX.md"
    md_path.write_text(md_content, encoding="utf-8")


def generate_matrix_md_content(matrix: Matrix, sources: list[Source]) -> str:
    """Generate MATRIX.md content from template.

    Args:
        matrix: Matrix instance.
        sources: List of sources in the matrix.

    Returns:
        Rendered MATRIX.md content as string.
    """
    sources_section = _generate_sources_section(sources)
    relationships_section = _generate_relationships_section(sources)

    return f"""# {matrix.name}

**Created**: {_format_timestamp(matrix.created_at)}
**Last Updated**: {_format_timestamp(matrix.updated_at)}
**Matrix ID**: `{matrix.id}`

## Overview

This is a Matrix workspace for organizing and coordinating work across multiple repositories.

## Sources

{sources_section}

## Source Relationships

{relationships_section}
"""


def _generate_sources_section(sources: list[Source]) -> str:
    """Generate the sources list section."""
    if not sources:
        return "*No sources added yet.*"

    sections = []
    for source in sources:
        lines = [f"### {source.name}", f"- **Path**: `{source.path}`"]
        if source.url:
            lines.append(f"- **URL**: {source.url}")
        lines.append(f"- **Source ID**: `{source.id}`")
        sections.append("\n".join(lines))

    return "\n\n".join(sections)


def _generate_relationships_section(sources: list[Source]) -> str:
    """Generate placeholder for source relationships."""
    if not sources:
        return "*Define relationships between sources here.*"

    return """*Document how these sources relate to each other:*

- Dependencies between repositories
- Shared interfaces or contracts
- Integration points
- Communication patterns"""


def _format_timestamp(iso_timestamp: str) -> str:
    """Format ISO timestamp to readable date.

    Args:
        iso_timestamp: ISO 8601 timestamp string.

    Returns:
        Formatted timestamp like "2024-01-15 10:30:00 UTC".
    """
    try:
        dt = datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    except (ValueError, AttributeError):
        return iso_timestamp
