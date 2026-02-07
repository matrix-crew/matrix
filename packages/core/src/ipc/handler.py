"""IPC message handler for Electron-Python communication.

This module provides the core message handling functionality for processing
JSON-based IPC messages from the Electron frontend.
"""

from typing import Any

from src.models import Matrix
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

    # Unknown message type
    return {
        "success": False,
        "error": f"Unknown message type: {message_type}",
    }
