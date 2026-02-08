"""Database utilities for Maxtix Python backend.

Provides SQLite database engine creation, session management, and schema initialization
using SQLModel (Pydantic + SQLAlchemy).
"""

from .engine import get_engine, get_session, init_db

__all__ = ["get_engine", "get_session", "init_db"]
