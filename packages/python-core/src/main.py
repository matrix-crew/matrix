"""Main entry point for Maxtix Python backend.

This module serves as the entry point for IPC communication between the Electron
main process and the Python backend. It handles incoming JSON messages from the
frontend and routes them to appropriate handlers.
"""

import sys


def main() -> None:
    """Main entry point for the Python backend.

    When run standalone, prints OK for verification.
    When run via IPC, processes JSON messages from stdin.
    """
    # Check if running standalone (verification mode)
    if sys.stdin.isatty():
        print("OK")
        return

    # TODO: IPC message processing will be implemented in future subtasks
    # This will read JSON messages from stdin and process them
    print("OK")


if __name__ == "__main__":
    main()
