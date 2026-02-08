"""IPC message handler for Electron-Python communication.

This module provides the core message handling functionality for processing
JSON-based IPC messages from the Electron frontend.
"""

from datetime import UTC, datetime
from typing import Any

from src.db import get_engine, get_session, init_db
from src.matrix import Matrix, MatrixRepository
from src.source import Source, SourceRepository


def handle_message(message: dict[str, Any]) -> dict[str, Any]:
    """Handle incoming IPC message from Electron frontend.

    Processes JSON messages received from the Electron main process via python-shell.
    Routes messages to appropriate handlers based on message type and returns
    structured responses.

    Args:
        message: Dictionary containing the IPC message with at minimum a 'type' field
                indicating the message type. Additional fields depend on message type.

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
    engine = get_engine()
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

        if message_type == "source-list":
            return _handle_source_list(source_repo)

        if message_type == "source-get":
            return _handle_source_get(message, source_repo)

        if message_type == "matrix-add-source":
            return _handle_matrix_add_source(message, matrix_repo)

        if message_type == "matrix-remove-source":
            return _handle_matrix_remove_source(message, matrix_repo)

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

    return {"success": True, "data": {"deleted": True}}


def _handle_source_create(message: dict[str, Any], repo: SourceRepository) -> dict[str, Any]:
    data = message.get("data", {})
    name = data.get("name", "")
    path = data.get("path", "")
    url = data.get("url")

    if not name or not name.strip():
        return {"success": False, "error": "Source name is required"}

    if not path or not path.strip():
        return {"success": False, "error": "Source path is required"}

    source = Source.create(name.strip(), path.strip(), url)
    repo.create(source)

    return {"success": True, "data": {"source": source.to_json()}}


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


def _handle_matrix_add_source(message: dict[str, Any], repo: MatrixRepository) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("matrixId", "")
    source_id = data.get("sourceId", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    if not source_id:
        return {"success": False, "error": "Source ID is required"}

    matrix = repo.get(matrix_id)

    if matrix is None:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    if source_id not in matrix.source_ids:
        matrix.source_ids.append(source_id)
        matrix.updated_at = datetime.now(UTC).isoformat()
        repo.update(matrix)

    return {"success": True, "data": {"matrix": matrix.to_json()}}


def _handle_matrix_remove_source(message: dict[str, Any], repo: MatrixRepository) -> dict[str, Any]:
    data = message.get("data", {})
    matrix_id = data.get("matrixId", "")
    source_id = data.get("sourceId", "")

    if not matrix_id:
        return {"success": False, "error": "Matrix ID is required"}

    if not source_id:
        return {"success": False, "error": "Source ID is required"}

    matrix = repo.get(matrix_id)

    if matrix is None:
        return {"success": False, "error": f"Matrix not found: {matrix_id}"}

    if source_id in matrix.source_ids:
        matrix.source_ids.remove(source_id)
        matrix.updated_at = datetime.now(UTC).isoformat()
        repo.update(matrix)

    return {"success": True, "data": {"matrix": matrix.to_json()}}
