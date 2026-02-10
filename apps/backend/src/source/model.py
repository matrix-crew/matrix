"""Source data model for Matrix application.

This module defines the Source entity which represents a local directory
or cloned git repository that can be associated with one or more Matrices.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Literal

SourceType = Literal["local", "remote"]


@dataclass
class Source:
    """A Source represents a local directory or cloned git repository.

    Sources can be either:
    - local: Existing directory symlinked into matrix workspace
    - remote: Git repository cloned to ~/.matrix/repositories/ and symlinked

    Attributes:
        id: Unique identifier (UUID v4)
        name: Human-readable repository/directory name
        path: Absolute filesystem path (local: user-specified, remote: clone path)
        url: Remote URL (required for remote, optional for local)
        source_type: Discriminator ("local" | "remote")
        created_at: ISO 8601 timestamp of when the Source was created
    """

    id: str
    name: str
    path: str
    url: str | None
    source_type: SourceType
    created_at: str

    @classmethod
    def create(
        cls,
        name: str,
        path: str,
        source_type: SourceType = "local",
        url: str | None = None,
    ) -> "Source":
        """Create a new Source with auto-generated id and timestamp.

        Args:
            name: Human-readable name for the repository
            path: Absolute filesystem path to the repository
            source_type: "local" for existing directories, "remote" for cloned repos
            url: Optional remote URL for the repository

        Returns:
            A new Source instance with generated UUID and current timestamp
        """
        return cls(
            id=str(uuid.uuid4()),
            name=name,
            path=path,
            url=url,
            source_type=source_type,
            created_at=datetime.now(UTC).isoformat(),
        )

    def to_json(self) -> dict[str, Any]:
        """Serialize the Source to a JSON-compatible dictionary.

        Returns:
            Dictionary representation suitable for JSON serialization
        """
        return {
            "id": self.id,
            "name": self.name,
            "path": self.path,
            "url": self.url,
            "source_type": self.source_type,
            "created_at": self.created_at,
        }

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "Source":
        """Deserialize a Source from a JSON-compatible dictionary.

        Args:
            data: Dictionary containing Source fields

        Returns:
            A Source instance populated from the dictionary

        Raises:
            KeyError: If required fields are missing from the data
        """
        return cls(
            id=data["id"],
            name=data["name"],
            path=data["path"],
            url=data.get("url"),
            source_type=data.get("source_type", "local"),
            created_at=data["created_at"],
        )
