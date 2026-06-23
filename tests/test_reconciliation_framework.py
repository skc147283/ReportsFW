from __future__ import annotations

import json
from pathlib import Path

from tests.reconciliation.compare import compare_datasets, load_dataset


def write_json(path: Path, rows: list[dict[str, object]]) -> None:
    path.write_text(json.dumps(rows), encoding="utf-8")


def test_compare_datasets_flags_row_and_metric_mismatches(tmp_path: Path) -> None:
    source_path = tmp_path / "source.json"
    target_path = tmp_path / "target.json"

    write_json(
        source_path,
        [
            {"company_id": 1, "company_name": "Northstar", "portfolio_value": 1000, "target_value": 1100},
            {"company_id": 2, "company_name": "Orion", "portfolio_value": 2000, "target_value": 2100},
            {"company_id": 3, "company_name": "Harbor", "portfolio_value": 3000, "target_value": 3200},
        ],
    )
    write_json(
        target_path,
        [
            {"company_id": 1, "company_name": "Northstar", "portfolio_value": 1000, "target_value": 1110},
            {"company_id": 3, "company_name": "Harbor", "portfolio_value": 3000, "target_value": 3200},
            {"company_id": 4, "company_name": "Cedar", "portfolio_value": 4000, "target_value": 4050},
        ],
    )

    source_rows = load_dataset(str(source_path))
    target_rows = load_dataset(str(target_path))
    result = compare_datasets(source_rows, target_rows, key_columns=["company_id"], metric_columns=["portfolio_value", "target_value"])

    assert result.summary.source_row_count == 3
    assert result.summary.target_row_count == 3
    assert result.summary.matched_row_count == 2
    assert result.summary.missing_in_target_count == 1
    assert result.summary.missing_in_source_count == 1
    assert result.summary.metric_mismatch_count == 1
    assert not result.passed

    categories = [diff.category for diff in result.diffs]
    assert categories.count("missing_in_target") == 1
    assert categories.count("missing_in_source") == 1
    assert categories.count("metric_mismatch") == 1


def test_compare_datasets_passes_on_matching_extracts(tmp_path: Path) -> None:
    source_path = tmp_path / "source.csv"
    target_path = tmp_path / "target.csv"

    source_path.write_text(
        "company_id,company_name,portfolio_value,target_value\n"
        "1,Northstar,1000,1100\n"
        "2,Orion,2000,2100\n",
        encoding="utf-8",
    )
    target_path.write_text(
        "company_id,company_name,portfolio_value,target_value\n"
        "1,Northstar,1000,1100\n"
        "2,Orion,2000,2100\n",
        encoding="utf-8",
    )

    result = compare_datasets(
        load_dataset(str(source_path)),
        load_dataset(str(target_path)),
        key_columns=["company_id"],
        metric_columns=["portfolio_value", "target_value"],
    )

    assert result.passed
    assert result.summary.metric_mismatch_count == 0
