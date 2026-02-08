"""SQLModel table definitions for all database entities.

Defines the database schema using SQLModel, including the junction table
for the many-to-many Matrix-Source relationship.
"""

from sqlmodel import Field, Relationship, SQLModel


class MatrixSourceLink(SQLModel, table=True):
    """Junction table for the many-to-many Matrix-Source relationship."""

    __tablename__ = "matrix_sources"

    matrix_id: str = Field(foreign_key="matrices.id", primary_key=True)
    source_id: str = Field(foreign_key="sources.id", primary_key=True)


class SourceEntity(SQLModel, table=True):
    """Database entity for Source objects."""

    __tablename__ = "sources"

    id: str = Field(primary_key=True)
    name: str
    path: str
    url: str | None = None
    created_at: str

    matrices: list["MatrixEntity"] = Relationship(
        back_populates="sources", link_model=MatrixSourceLink
    )


class MatrixEntity(SQLModel, table=True):
    """Database entity for Matrix objects."""

    __tablename__ = "matrices"

    id: str = Field(primary_key=True)
    name: str
    created_at: str
    updated_at: str

    sources: list[SourceEntity] = Relationship(
        back_populates="matrices", link_model=MatrixSourceLink
    )
