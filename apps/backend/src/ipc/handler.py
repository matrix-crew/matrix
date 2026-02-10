"""IPC message handler for Electron-Python communication.

This module provides the core message handling functionality for processing
JSON-based IPC messages from the Electron frontend.
"""

import os
import sys
from datetime import UTC, datetime
from typing import Any

from src.db import get_engine, get_session, init_db
from src.matrix import (
    Matrix,
    MatrixReconciler,
    MatrixRepository,
    create_matrix_space,
    update_matrix_md,
)
from src.source import (
    CloneError,
    RepositoryCloner,
    Source,
    SourceLinker,
    SourceRepository,
    SymlinkError,
)


def handle_message(message: dict[str, Any]) -> dict[str, Any]:
    """Handle incoming IPC message from Electron frontend.

    Processes JSON messages received from the Electron main process via python-shell.
    Routes messages to appropriate handlers based on message type and returns
    structured responses.

    Args:
        message: Dictionary containing the IPC message with at minimum a 'type' field
                indicating the message type. Additional fields depend on message type.
                May include 'db_path' injected by Electron for database location.

    Returns:
        Dictionary containing the response to send back to the frontend.
        Always includes a 'success' boolean field and may include 'data' or 'error'.

    Example:
        >>> handle_message({'type': 'ping'})
        {'success': True, 'data': {'message': 'pong'}}
    """
    # Extract message type
    message_type = message.get("type", "unknown")

    # Route to appropriate handler based on message type
    if message_type == "ping":
        return {"success": True, "data": {"message": "pong"}}

    # All other handlers need DB access
    db_path = message.get("db_path")
    engine = get_engine(db_path)
    init_db(engine)

    with get_session(engine) as session:
        matrix_repo = MatrixRepository(session)
        source_repo = SourceRepository(session)

        if message_type == "matrix-create":
            return _handle_matrix_create(message, matrix_repo)

        if message_type == "matrix-list":
            return _handle_matrix_list(matrix_repo)

        if message_type == "matrix-get":
            return _handle_matrix_get(message, matrix_repo)

        if message_type == "matrix-update":
            return _handle_matrix_update(message, matrix_repo)

        if message_type == "matrix-delete":
            return _handle_matrix_delete(message, matrix_repo)

        if message_type == "source-create":
            return _handle_source_create(message, source_repo)

        if message_type == "source-create-local":
            return _handle_source_create_local(message, source_repo)

        if message_type == "source-create-remote":
            return _handle_source_create_remote(message, source_repo)

        if message_type == "source-list":
            return _handle_source_list(source_repo)

        if message_type == "source-get":
            return _handle_source_get(message, source_repo)

        if message_type == "matrix-add-source":
            return _handle_matrix_add_source(message, matrix_repo, source_repo)

        if message_type == "matrix-remove-source":
            return _handle_matrix_remove_source(message, matrix_repo, source_repo)

        if message_type == "matrix-reconcile":
            return _handle_matrix_reconcile(message, matrix_repo, source_repo)

    # Unknown message type
    return {
        "success": False,
        "error": f"Unknown message type: {message_type}",
    }


def _handle_matrix_create(message: dict[str, Any], repo: MatrixRepository) -> dict[str, Any]:
    data = message.get("data", {})
    name = data.get("name", "")

    if not name or not name.strip():
        return {"success": False, "error": "Matrix name is required"}

    matrix = Matrix.create(name.strip())
    repo.create(matrix)

    # Initialize matrix space folder with MATRIX.md
    try:
        create_matrix_space(matrix, [])
    except OSError as e:
        return {"success": False, "error": f"Failed to create workspace folder: {e}"}

    return {"success": True, "data": {"matrix": matrix.to_json()}}


def _handle_matrix_list(repo: MatrixRepository) -> dict[str, Any]:
    matrices = repo.list()
    return {
        "success": True,
        "data": {"matrices": [m.to_json() for m in matrices]},
    }


def _handle_matrix_get(message: dict[str, Any], repo: MatrixRepository) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("id", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    matrix = repo.get(matrix_id)

    if matrix is None:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    return {"success": True, "data": {"matrix": matrix.to_json()}}


def _handle_matrix_update(message: dict[str, Any], repo: MatrixRepository) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("id", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    matrix = repo.get(matrix_id)

    if matrix is None:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    if "name" in data:
        name = data["name"]
        if not name or not name.strip():
            return {"success": False, "error": "Matrix name cannot be empty"}
        matrix.name = name.strip()

    if "source_ids" in data:
        matrix.source_ids = data["source_ids"]

    matrix.updated_at = datetime.now(UTC).isoformat()

    repo.update(matrix)

    return {"success": True, "data": {"matrix": matrix.to_json()}}


def _handle_matrix_delete(message: dict[str, Any], repo: MatrixRepository) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("id", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    deleted = repo.delete(matrix_id)

    if not deleted:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    # Note: Matrix space folder is intentionally preserved on deletion
    return {"success": True, "data": {"deleted": True}}


def _handle_source_create(message: dict[str, Any], repo: SourceRepository) -> dict[str, Any]:
    data = message.get("data", {})
    name = data.get("name", "")
    path = data.get("path", "")
    url = data.get("url")
    source_type = data.get("source_type", "local")

    if not name or not name.strip():
        return {"success": False, "error": "Source name is required"}

    if not path or not path.strip():
        return {"success": False, "error": "Source path is required"}

    source = Source.create(name.strip(), path.strip(), source_type, url)
    repo.create(source)

    return {"success": True, "data": {"source": source.to_json()}}


def _handle_source_create_local(message: dict[str, Any], repo: SourceRepository) -> dict[str, Any]:
    data = message.get("data", {})
    name = data.get("name", "")
    path = data.get("path", "")
    url = data.get("url")

    if not name or not name.strip():
        return {"success": False, "error": "Source name is required"}

    if not path or not path.strip():
        return {"success": False, "error": "Source path is required"}

    if not os.path.exists(path):
        return {"success": False, "error": f"Path does not exist: {path}"}

    source = Source.create(name.strip(), path.strip(), "local", url)
    repo.create(source)

    return {"success": True, "data": {"source": source.to_json()}}


def _handle_source_create_remote(message: dict[str, Any], repo: SourceRepository) -> dict[str, Any]:
    data = message.get("data", {})
    name = data.get("name", "")
    url = data.get("url", "")

    if not url or not url.strip():
        return {"success": False, "error": "Repository URL is required"}

    cloner = RepositoryCloner()

    if not name or not name.strip():
        name = cloner.extract_repo_name(url)

    try:
        clone_path = cloner.clone_repository(url.strip(), name.strip())
    except CloneError as e:
        return {"success": False, "error": str(e)}

    source = Source.create(name.strip(), clone_path, "remote", url.strip())
    repo.create(source)

    return {
        "success": True,
        "data": {"source": source.to_json(), "clonePath": clone_path},
    }


def _handle_source_list(repo: SourceRepository) -> dict[str, Any]:
    sources = repo.list()
    return {
        "success": True,
        "data": {"sources": [s.to_json() for s in sources]},
    }


def _handle_source_get(message: dict[str, Any], repo: SourceRepository) -> dict[str, Any]:
    data = message.get("data", {})
    source_id = data.get("id", "")

    if not source_id:
        return {"success": False, "error": "Source ID is required"}

    source = repo.get(source_id)

    if source is None:
        return {"success": False, "error": f"Source not found: {source_id}"}

    return {"success": True, "data": {"source": source.to_json()}}


def _handle_matrix_add_source(
    message: dict[str, Any],
    matrix_repo: MatrixRepository,
    source_repo: SourceRepository,
) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("matrixId", "")
    source_id = data.get("sourceId", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    if not source_id:
        return {"success": False, "error": "Source ID is required"}

    matrix = matrix_repo.get(matrix_id)

    if matrix is None:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    source = source_repo.get(source_id)

    if source is None:
        return {"success": False, "error": f"Source not found: {source_id}"}

    if source_id not in matrix.source_ids:
        matrix.source_ids.append(source_id)
        matrix.updated_at = datetime.now(UTC).isoformat()
        matrix_repo.update(matrix)

        # Create symlink in matrix workspace (best-effort)
        linker = SourceLinker()
        try:
            linker.link_source_to_matrix(source, matrix.workspace_path)
        except SymlinkError as e:
            print(f"Warning: Failed to create symlink: {e}", file=sys.stderr)

        # Update MATRIX.md with current sources (best-effort)
        try:
            sources = _resolve_sources(matrix.source_ids, source_repo)
            update_matrix_md(matrix, sources)
        except OSError as e:
            print(f"Warning: Failed to update MATRIX.md: {e}", file=sys.stderr)

    return {"success": True, "data": {"matrix": matrix.to_json()}}


def _handle_matrix_remove_source(
    message: dict[str, Any],
    matrix_repo: MatrixRepository,
    source_repo: SourceRepository,
) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("matrixId", "")
    source_id = data.get("sourceId", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    if not source_id:
        return {"success": False, "error": "Source ID is required"}

    matrix = matrix_repo.get(matrix_id)

    if matrix is None:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    source = source_repo.get(source_id)

    if source_id in matrix.source_ids:
        matrix.source_ids.remove(source_id)
        matrix.updated_at = datetime.now(UTC).isoformat()
        matrix_repo.update(matrix)

        # Remove symlink from matrix workspace (best-effort)
        if source is not None:
            linker = SourceLinker()
            try:
                linker.unlink_source_from_matrix(source, matrix.workspace_path)
            except SymlinkError as e:
                print(f"Warning: Failed to remove symlink: {e}", file=sys.stderr)

        # Update MATRIX.md with remaining sources (best-effort)
        try:
            sources = _resolve_sources(matrix.source_ids, source_repo)
            update_matrix_md(matrix, sources)
        except OSError as e:
            print(f"Warning: Failed to update MATRIX.md: {e}", file=sys.stderr)

    return {"success": True, "data": {"matrix": matrix.to_json()}}


def _handle_matrix_reconcile(
    message: dict[str, Any],
    matrix_repo: MatrixRepository,
    source_repo: SourceRepository,
) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("id", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    matrix = matrix_repo.get(matrix_id)

    if matrix is None:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    sources = _resolve_sources(matrix.source_ids, source_repo)

    reconciler = MatrixReconciler()
    report = reconciler.reconcile(matrix, sources)

    return {
        "success": True,
        "data": {
            "matrix": matrix.to_json(),
            "report": report.to_json(),
        },
    }


def _resolve_sources(source_ids: list[str], source_repo: SourceRepository) -> list[Source]:
    """Resolve source IDs to Source objects, skipping any not found."""
    sources = []
    for sid in source_ids:
        source = source_repo.get(sid)
        if source is not None:
            sources.append(source)
    return sources
