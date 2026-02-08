"""Main entry point for Maxtix Python backend.

This module serves as the entry point for IPC communication between the Electron
main process and the Python backend. It handles incoming JSON messages from the
frontend and routes them to appropriate handlers.
"""

import json
import sys
from typing import Any

from src.ipc.handler import handle_message


def main() -> None:
    """Main entry point for the Python backend.

    When run standalone, prints OK for verification.
    When run via IPC, processes JSON messages from stdin and outputs JSON responses.
    """
    # Check if running standalone (verification mode)
    if sys.stdin.isatty():
        print("OK")
        return

    # Process IPC messages from stdin
    try:
        # Read a line from stdin
        line = sys.stdin.readline()
        if not line:
            # No input received
            response = {"success": False, "error": "No input received"}
            print(json.dumps(response))
            return

        # Parse JSON message
        message: Any = json.loads(line)

        # Process the message through the handler
        response = handle_message(message)

        # Output JSON response to stdout
        print(json.dumps(response))

    except json.JSONDecodeError as e:
        # Handle JSON parsing errors
        response = {"success": False, "error": f"JSON parse error: {str(e)}"}
        print(json.dumps(response))
    except Exception as e:
        # Handle any other errors
        response = {"success": False, "error": f"Unexpected error: {str(e)}"}
        print(json.dumps(response))


if __name__ == "__main__":
    main()
