from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class DiffRow:
    category: str
    key: str
    field_name: str | None = None
    source_value: Any = None
    target_value: Any = None
    message: str = ""


@dataclass(frozen=True)
class ReconciliationSummary:
    source_row_count: int
    target_row_count: int
    matched_row_count: int
    missing_in_target_count: int
    missing_in_source_count: int
    metric_mismatch_count: int


@dataclass(frozen=True)
class ComparisonResult:
    summary: ReconciliationSummary
    diffs: list[DiffRow] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return len(self.diffs) == 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "passed": self.passed,
            "summary": asdict(self.summary),
            "diffs": [asdict(diff) for diff in self.diffs],
        }
