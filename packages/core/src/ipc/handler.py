"""IPC message handler for Electron-Python communication.

This module provides the core message handling functionality for processing
JSON-based IPC messages from the Electron frontend.
"""

from datetime import datetime, timezone
from typing import Any

from src.models import Matrix, Source
from src.persistence import MatrixStorage


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

    if message_type == "matrix-create":
        data = message.get("data", {})
        name = data.get("name", "")

        # Validate name is not empty
        if not name or not name.strip():
            return {"success": False, "error": "Matrix name is required"}

        # Create and save the matrix
        matrix = Matrix.create(name.strip())
        storage = MatrixStorage()
        storage.save_matrix(matrix)

        return {"success": True, "data": {"matrix": matrix.to_json()}}

    if message_type == "matrix-list":
        storage = MatrixStorage()
        matrices = storage.list_matrices()
        return {
            "success": True,
            "data": {"matrices": [m.to_json() for m in matrices]},
        }

    if message_type == "matrix-get":
        data = message.get("data", {})
        matrix_id = data.get("id", "")

        if not matrix_id:
            return {"success": False, "error": "Matrix ID is required"}

        storage = MatrixStorage()
        matrix = storage.load_matrix(matrix_id)

        if matrix is None:
            return {"success": False, "error": f"Matrix not found: {matrix_id}"}

        return {"success": True, "data": {"matrix": matrix.to_json()}}

    if message_type == "matrix-update":
        data = message.get("data", {})
        matrix_id = data.get("id", "")

        if not matrix_id:
            return {"success": False, "error": "Matrix ID is required"}

        storage = MatrixStorage()
        matrix = storage.load_matrix(matrix_id)

        if matrix is None:
            return {"success": False, "error": f"Matrix not found: {matrix_id}"}

        # Update allowed fields
        if "name" in data:
            name = data["name"]
            if not name or not name.strip():
                return {"success": False, "error": "Matrix name cannot be empty"}
            matrix.name = name.strip()

        if "source_ids" in data:
            matrix.source_ids = data["source_ids"]

        # Update the timestamp
        matrix.updated_at = datetime.now(timezone.utc).isoformat()

        storage.save_matrix(matrix)

        return {"success": True, "data": {"matrix": matrix.to_json()}}

    if message_type == "matrix-delete":
        data = message.get("data", {})
        matrix_id = data.get("id", "")

        if not matrix_id:
            return {"success": False, "error": "Matrix ID is required"}

        storage = MatrixStorage()
        deleted = storage.delete_matrix(matrix_id)

        if not deleted:
            return {"success": False, "error": f"Matrix not found: {matrix_id}"}

        return {"success": True, "data": {"deleted": True}}

    if message_type == "source-create":
        data = message.get("data", {})
        name = data.get("name", "")
        path = data.get("path", "")
        url = data.get("url")

        # Validate required fields
        if not name or not name.strip():
            return {"success": False, "error": "Source name is required"}

        if not path or not path.strip():
            return {"success": False, "error": "Source path is required"}

        # Create and save the source
        source = Source.create(name.strip(), path.strip(), url)
        storage = MatrixStorage()
        storage.save_source(source)

        return {"success": True, "data": {"source": source.to_json()}}

    if message_type == "source-list":
        storage = MatrixStorage()
        sources = storage.list_sources()
        return {
            "success": True,
            "data": {"sources": [s.to_json() for s in sources]},
        }

    if message_type == "source-get":
        data = message.get("data", {})
        source_id = data.get("id", "")

        if not source_id:
            return {"success": False, "error": "Source ID is required"}

        storage = MatrixStorage()
        source = storage.load_source(source_id)

        if source is None:
            return {"success": False, "error": f"Source not found: {source_id}"}

        return {"success": True, "data": {"source": source.to_json()}}

    # Unknown message type
    return {
        "success": False,
        "error": f"Unknown message type: {message_type}",
    }
