"""Matrix repository for database operations.

Provides CRUD operations for Matrix entities using SQLModel.
Handles conversion between Matrix dataclasses and MatrixEntity DB models.
"""

from sqlmodel import Session, select

from src.db.models import MatrixEntity, MatrixSourceLink
from src.matrix.model import Matrix


class MatrixRepository:
    """Repository for Matrix CRUD operations against the database."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, matrix: Matrix) -> None:
        """Insert a new Matrix into the database.

        Creates the MatrixEntity and any junction table entries for source_ids.
        """
        entity = MatrixEntity(
            id=matrix.id,
            name=matrix.name,
            workspace_path=matrix.workspace_path,
            created_at=matrix.created_at,
            updated_at=matrix.updated_at,
        )
        self.session.add(entity)
        self.session.flush()

        for source_id in matrix.source_ids:
            link = MatrixSourceLink(matrix_id=matrix.id, source_id=source_id)
            self.session.add(link)

    def get(self, matrix_id: str) -> Matrix | None:
        """Load a Matrix by ID, including its source_ids from the junction table."""
        entity = self.session.get(MatrixEntity, matrix_id)
        if entity is None:
            return None
        return self._to_domain(entity)

    def list(self) -> list[Matrix]:
        """Load all Matrices with their source_ids."""
        statement = select(MatrixEntity)
        entities = self.session.exec(statement).all()
        return [self._to_domain(e) for e in entities]

    def update(self, matrix: Matrix) -> None:
        """Update a Matrix entity and re-sync its junction table links."""
        entity = self.session.get(MatrixEntity, matrix.id)
        if entity is None:
            return

        entity.name = matrix.name
        entity.workspace_path = matrix.workspace_path
        entity.updated_at = matrix.updated_at

        # Re-sync junction table: delete old links, insert new ones
        old_links = self.session.exec(
            select(MatrixSourceLink).where(MatrixSourceLink.matrix_id == matrix.id)
        ).all()
        for link in old_links:
            self.session.delete(link)
        self.session.flush()

        for source_id in matrix.source_ids:
            link = MatrixSourceLink(matrix_id=matrix.id, source_id=source_id)
            self.session.add(link)

    def delete(self, matrix_id: str) -> bool:
        """Delete a Matrix and its junction table links.

        Returns True if the matrix was found and deleted, False otherwise.
        """
        entity = self.session.get(MatrixEntity, matrix_id)
        if entity is None:
            return False

        # Delete junction links first
        links = self.session.exec(
            select(MatrixSourceLink).where(MatrixSourceLink.matrix_id == matrix_id)
        ).all()
        for link in links:
            self.session.delete(link)

        self.session.delete(entity)
        self.session.flush()
        return True

    def _to_domain(self, entity: MatrixEntity) -> Matrix:
        """Convert a MatrixEntity to a Matrix dataclass."""
        source_ids = [source.id for source in entity.sources]
        return Matrix(
            id=entity.id,
            name=entity.name,
            source_ids=source_ids,
            workspace_path=entity.workspace_path,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
