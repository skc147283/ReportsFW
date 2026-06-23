from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from .extractors import load_rows
from .models import ComparisonResult, DiffRow, ReconciliationSummary


@dataclass(frozen=True)
class DatasetSpec:
    key_columns: tuple[str, ...]
    metric_columns: tuple[str, ...] = ()


def load_dataset(path: str) -> list[dict[str, Any]]:
    return load_rows(path)


def compare_datasets(
    source_rows: list[dict[str, Any]],
    target_rows: list[dict[str, Any]],
    key_columns: Iterable[str],
    metric_columns: Iterable[str] = (),
) -> ComparisonResult:
    key_columns = tuple(key_columns)
    metric_columns = tuple(metric_columns)

    source_index = _index_rows(source_rows, key_columns)
    target_index = _index_rows(target_rows, key_columns)

    source_keys = set(source_index)
    target_keys = set(target_index)
    common_keys = sorted(source_keys & target_keys)

    diffs: list[DiffRow] = []

    for key in sorted(source_keys - target_keys):
        diffs.append(
            DiffRow(
                category="missing_in_target",
                key=key,
                message="Row exists in source but not in target.",
            )
        )

    for key in sorted(target_keys - source_keys):
        diffs.append(
            DiffRow(
                category="missing_in_source",
                key=key,
                message="Row exists in target but not in source.",
            )
        )

    metric_mismatch_count = 0
    for key in common_keys:
        source_row = source_index[key]
        target_row = target_index[key]

        for column in metric_columns:
            source_value = _normalize(source_row.get(column))
            target_value = _normalize(target_row.get(column))
            if source_value != target_value:
                metric_mismatch_count += 1
                diffs.append(
                    DiffRow(
                        category="metric_mismatch",
                        key=key,
                        field_name=column,
                        source_value=source_row.get(column),
                        target_value=target_row.get(column),
                        message=f"{column} differs between source and target.",
                    )
                )

    summary = ReconciliationSummary(
        source_row_count=len(source_rows),
        target_row_count=len(target_rows),
        matched_row_count=len(common_keys),
        missing_in_target_count=len(source_keys - target_keys),
        missing_in_source_count=len(target_keys - source_keys),
        metric_mismatch_count=metric_mismatch_count,
    )

    return ComparisonResult(summary=summary, diffs=diffs)


def _index_rows(rows: list[dict[str, Any]], key_columns: tuple[str, ...]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for row in rows:
        key = _build_key(row, key_columns)
        if key in indexed:
            raise ValueError(f"Duplicate key detected: {key}")
        indexed[key] = row
    return indexed


def _build_key(row: dict[str, Any], key_columns: tuple[str, ...]) -> str:
    values = []
    for column in key_columns:
        if column not in row:
            raise KeyError(f"Missing key column '{column}' in row: {row}")
        values.append(str(row[column]))
    return "|".join(values)


def _normalize(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return None
        return stripped
    return value
