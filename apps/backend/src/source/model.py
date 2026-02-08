"""Source data model for Matrix application.

This module defines the Source entity which represents a git repository
that can be associated with one or more Matrices.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


@dataclass
class Source:
    """A Source represents a git repository reference.

    Sources are the fundamental units that can be organized into Matrices.
    Each Source tracks a repository's location (path) and optional remote URL.

    Attributes:
        id: Unique identifier (UUID v4)
        name: Human-readable repository name
        path: Absolute filesystem path to the repository
        url: Optional remote URL (e.g., GitHub URL)
        created_at: ISO 8601 timestamp of when the Source was created
    """

    id: str
    name: str
    path: str
    url: str | None
    created_at: str

    @classmethod
    def create(cls, name: str, path: str, url: str | None = None) -> "Source":
        """Create a new Source with auto-generated id and timestamp.

        Args:
            name: Human-readable name for the repository
            path: Absolute filesystem path to the repository
            url: Optional remote URL for the repository

        Returns:
            A new Source instance with generated UUID and current timestamp
        """
        return cls(
            id=str(uuid.uuid4()),
            name=name,
            path=path,
            url=url,
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
            created_at=data["created_at"],
        )
