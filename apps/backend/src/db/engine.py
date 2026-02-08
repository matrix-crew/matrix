"""Database engine creation and session management.

Provides functions for creating SQLite engines, managing database sessions,
and initializing the schema.
"""

import os
from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine


def get_engine(db_path: str | None = None) -> Engine:
    """Create a SQLAlchemy engine for the SQLite database.

    Args:
        db_path: Path to the SQLite database file. Defaults to $HOME/.matrix/matrix.db.
                 Use ":memory:" for in-memory databases (useful for testing).

    Returns:
        A SQLAlchemy Engine instance.
    """
    if db_path is None:
        home = os.path.expanduser("~")
        matrix_dir = os.path.join(home, ".matrix")
        os.makedirs(matrix_dir, exist_ok=True)
        db_path = os.path.join(matrix_dir, "matrix.db")

    if db_path == ":memory:":
        url = "sqlite:///:memory:"
    else:
        url = f"sqlite:///{db_path}"

    return create_engine(url)


@contextmanager
def get_session(engine: Engine) -> Generator[Session, None, None]:
    """Context manager that yields a database session.

    Automatically commits on success and rolls back on error.

    Args:
        engine: The SQLAlchemy engine to create the session from.

    Yields:
        A SQLModel Session instance.
    """
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise


def init_db(engine: Engine) -> None:
    """Initialize the database schema.

    Creates all tables defined by SQLModel metadata if they don't exist.
    This operation is idempotent.

    Args:
        engine: The SQLAlchemy engine to create tables on.
    """
    # Import models to ensure they're registered with SQLModel metadata
    import src.db.models  # noqa: F401

    SQLModel.metadata.create_all(engine)
