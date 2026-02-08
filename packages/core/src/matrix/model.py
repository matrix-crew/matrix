"""Matrix data model for Matrix application.

This module defines the Matrix entity which represents a collection of
Sources that can be grouped and organized together.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


@dataclass
class Matrix:
    """A Matrix represents a collection of Sources.

    Matrices allow users to organize related git repositories into logical
    groups. Each Matrix maintains references to its Sources via their IDs.

    Attributes:
        id: Unique identifier (UUID v4)
        name: Human-readable matrix name
        source_ids: List of Source UUIDs contained in this Matrix
        created_at: ISO 8601 timestamp of when the Matrix was created
        updated_at: ISO 8601 timestamp of when the Matrix was last modified
    """

    id: str
    name: str
    source_ids: list[str]
    workspace_path: str
    created_at: str
    updated_at: str

    @classmethod
    def create(cls, name: str, source_ids: list[str] | None = None) -> "Matrix":
        """Create a new Matrix with auto-generated id and timestamps.

        Args:
            name: Human-readable name for the matrix
            source_ids: Optional list of Source UUIDs to include

        Returns:
            A new Matrix instance with generated UUID and current timestamps
        """
        from src.config.paths import get_matrix_space_path

        now = datetime.now(UTC).isoformat()
        matrix_id = str(uuid.uuid4())
        return cls(
            id=matrix_id,
            name=name,
            source_ids=source_ids if source_ids is not None else [],
            workspace_path=get_matrix_space_path(name, matrix_id),
            created_at=now,
            updated_at=now,
        )

    def to_json(self) -> dict[str, Any]:
        """Serialize the Matrix to a JSON-compatible dictionary.

        Returns:
            Dictionary representation suitable for JSON serialization
        """
        return {
            "id": self.id,
            "name": self.name,
            "source_ids": self.source_ids,
            "workspace_path": self.workspace_path,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "Matrix":
        """Deserialize a Matrix from a JSON-compatible dictionary.

        Args:
            data: Dictionary containing Matrix fields

        Returns:
            A Matrix instance populated from the dictionary

        Raises:
            KeyError: If required fields are missing from the data
        """
        return cls(
            id=data["id"],
            name=data["name"],
            source_ids=data.get("source_ids", []),
            workspace_path=data["workspace_path"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        )
