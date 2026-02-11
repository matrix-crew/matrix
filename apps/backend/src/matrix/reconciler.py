"""Matrix filesystem-database reconciliation.

Reconciles the filesystem state of a matrix workspace with the database,
repairing missing workspace folders, MATRIX.md files, clones, and symlinks.
"""

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from src.matrix.model import Matrix
from src.matrix.space import create_matrix_space, update_matrix_md
from src.source.cloner import CloneError, RepositoryCloner
from src.source.linker import SourceLinker, SymlinkError
from src.source.model import Source

SourceReconcileStatus = Literal["ok", "repaired", "skipped", "error"]


@dataclass
class SourceReconcileResult:
    """Result of reconciling a single source."""

    source_id: str
    source_name: str
    status: SourceReconcileStatus
    action: str = ""

    def to_json(self) -> dict:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "status": self.status,
            "action": self.action,
        }


@dataclass
class ReconcileReport:
    """Report of a full matrix reconciliation."""

    workspace_recreated: bool = False
    matrix_md_recreated: bool = False
    sources_reconciled: list[SourceReconcileResult] = field(default_factory=list)
    orphaned_source_ids: list[str] = field(default_factory=list)

    @property
    def has_repairs(self) -> bool:
        if self.workspace_recreated or self.matrix_md_recreated:
            return True
        return any(r.status == "repaired" for r in self.sources_reconciled)

    def to_json(self) -> dict:
        return {
            "workspace_recreated": self.workspace_recreated,
            "matrix_md_recreated": self.matrix_md_recreated,
            "sources_reconciled": [r.to_json() for r in self.sources_reconciled],
            "orphaned_source_ids": self.orphaned_source_ids,
            "has_repairs": self.has_repairs,
        }


class MatrixReconciler:
    """Reconciles matrix filesystem state with database state.

    Checks and repairs:
    1. Matrix workspace folder existence
    2. MATRIX.md file existence
    3. Source symlinks (local) and clones + symlinks (remote)
    """

    def __init__(
        self,
        linker: SourceLinker | None = None,
        cloner: RepositoryCloner | None = None,
    ) -> None:
        self.linker = linker or SourceLinker()
        self.cloner = cloner or RepositoryCloner()

    def reconcile(
        self,
        matrix: Matrix,
        sources: list[Source],
    ) -> ReconcileReport:
        """Reconcile a matrix's filesystem state with its database state.

        Args:
            matrix: Matrix from the database.
            sources: Resolved Source objects for the matrix's source_ids.

        Returns:
            ReconcileReport describing what was checked and repaired.
        """
        report = ReconcileReport()

        # 1. Check/create workspace folder
        workspace = Path(matrix.workspace_path)
        if not workspace.exists():
            try:
                create_matrix_space(matrix, sources)
                report.workspace_recreated = True
                report.matrix_md_recreated = True
            except OSError as e:
                print(f"Warning: Failed to recreate workspace: {e}", file=sys.stderr)
                return report
        else:
            # 2. Check/create MATRIX.md
            md_path = workspace / "MATRIX.md"
            if not md_path.exists():
                try:
                    update_matrix_md(matrix, sources)
                    report.matrix_md_recreated = True
                except OSError as e:
                    print(f"Warning: Failed to recreate MATRIX.md: {e}", file=sys.stderr)

        # 3. Detect orphaned source_ids (in matrix.source_ids but not in resolved sources)
        resolved_ids = {s.id for s in sources}
        for sid in matrix.source_ids:
            if sid not in resolved_ids:
                report.orphaned_source_ids.append(sid)

        # 4. Reconcile each source
        for source in sources:
            result = self._reconcile_source(source, matrix.workspace_path)
            report.sources_reconciled.append(result)

        return report

    def _reconcile_source(
        self,
        source: Source,
        matrix_workspace_path: str,
    ) -> SourceReconcileResult:
        """Reconcile a single source's filesystem state.

        Args:
            source: Source to reconcile.
            matrix_workspace_path: Absolute path to the matrix workspace.

        Returns:
            SourceReconcileResult with status and action taken.
        """
        # Check if already linked
        if self.linker.is_linked(source, matrix_workspace_path):
            return SourceReconcileResult(
                source_id=source.id,
                source_name=source.name,
                status="ok",
            )

        source_path = Path(source.path)

        if source.source_type == "local":
            return self._reconcile_local_source(source, source_path, matrix_workspace_path)
        else:
            return self._reconcile_remote_source(source, source_path, matrix_workspace_path)

    def _reconcile_local_source(
        self,
        source: Source,
        source_path: Path,
        matrix_workspace_path: str,
    ) -> SourceReconcileResult:
        """Reconcile a local source: check path exists, recreate symlink."""
        if not source_path.exists():
            return SourceReconcileResult(
                source_id=source.id,
                source_name=source.name,
                status="skipped",
                action="local path missing",
            )

        try:
            self.linker.link_source_to_matrix(source, matrix_workspace_path)
            return SourceReconcileResult(
                source_id=source.id,
                source_name=source.name,
                status="repaired",
                action="symlink recreated",
            )
        except SymlinkError as e:
            return SourceReconcileResult(
                source_id=source.id,
                source_name=source.name,
                status="error",
                action=str(e),
            )

    def _reconcile_remote_source(
        self,
        source: Source,
        source_path: Path,
        matrix_workspace_path: str,
    ) -> SourceReconcileResult:
        """Reconcile a remote source: reclone if needed, recreate symlink."""
        # If clone directory is missing, reclone
        if not source_path.exists() and source.url:
            try:
                clone_path = self.cloner.clone_repository(source.url, source.name)
                # Update source path to new clone location
                source.path = clone_path
            except CloneError as e:
                return SourceReconcileResult(
                    source_id=source.id,
                    source_name=source.name,
                    status="error",
                    action=f"reclone failed: {e}",
                )
        elif not source_path.exists():
            return SourceReconcileResult(
                source_id=source.id,
                source_name=source.name,
                status="skipped",
                action="remote clone missing and no URL",
            )

        # Now create the symlink
        try:
            self.linker.link_source_to_matrix(source, matrix_workspace_path)
            recloned = not Path(source.path).samefile(source_path) if source_path.exists() else True
            action = "recloned and symlink created" if recloned else "symlink recreated"
            return SourceReconcileResult(
                source_id=source.id,
                source_name=source.name,
                status="repaired",
                action=action,
            )
        except (SymlinkError, OSError) as e:
            return SourceReconcileResult(
                source_id=source.id,
                source_name=source.name,
                status="error",
                action=str(e),
            )
