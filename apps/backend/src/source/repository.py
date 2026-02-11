"""Source repository for database operations.

Provides CRUD operations for Source entities using SQLModel.
Handles conversion between Source dataclasses and SourceEntity DB models.
"""

from sqlmodel import Session, select

from src.db.models import SourceEntity
from src.source.model import Source


class SourceRepository:
    """Repository for Source CRUD operations against the database."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, source: Source) -> None:
        """Insert a new Source into the database."""
        entity = SourceEntity(
            id=source.id,
            name=source.name,
            path=source.path,
            url=source.url,
            source_type=source.source_type,
            created_at=source.created_at,
        )
        self.session.add(entity)

    def get(self, source_id: str) -> Source | None:
        """Load a Source by ID."""
        entity = self.session.get(SourceEntity, source_id)
        if entity is None:
            return None
        return self._to_domain(entity)

    def list(self) -> list[Source]:
        """Load all Sources."""
        statement = select(SourceEntity)
        entities = self.session.exec(statement).all()
        return [self._to_domain(e) for e in entities]

    def delete(self, source_id: str) -> bool:
        """Delete a Source.

        Returns True if the source was found and deleted, False otherwise.
        """
        entity = self.session.get(SourceEntity, source_id)
        if entity is None:
            return False
        self.session.delete(entity)
        self.session.flush()
        return True

    def update(self, source: Source) -> None:
        """Update an existing Source in the database."""
        entity = self.session.get(SourceEntity, source.id)
        if entity is None:
            return
        entity.name = source.name
        entity.path = source.path
        entity.url = source.url
        entity.source_type = source.source_type
        self.session.flush()

    def _to_domain(self, entity: SourceEntity) -> Source:
        """Convert a SourceEntity to a Source dataclass."""
        return Source(
            id=entity.id,
            name=entity.name,
            path=entity.path,
            url=entity.url,
            source_type=entity.source_type,
            created_at=entity.created_at,
        )
