from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from etl.pipeline import EtlPipeline, PipelineConfig, load_profile
from tests.reconciliation.compare import compare_datasets, load_dataset

DEFAULT_KEYS = ["reportId"]
DEFAULT_METRICS = ["companyId", "reportDate", "portfolioValue", "targetValue", "riskScore"]


def run_int_uat_and_reconcile(
    mode: str,
    profiles_dir: str,
    keys: list[str] | None = None,
    metrics: list[str] | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    keys = keys or DEFAULT_KEYS
    metrics = metrics or DEFAULT_METRICS

    int_config = load_profile("INT", profiles_dir)
    uat_config = load_profile("UAT", profiles_dir)

    int_result = EtlPipeline(int_config).run(mode=mode, payload=payload)
    uat_result = EtlPipeline(uat_config).run(mode=mode, payload=payload)

    int_extract_path = Path(int_config.export_dir) / "reports_target.json"
    uat_extract_path = Path(uat_config.export_dir) / "reports_target.json"

    if not int_extract_path.exists() or not uat_extract_path.exists():
        raise FileNotFoundError(
            "Expected INT/UAT target extracts were not created. "
            f"INT={int_extract_path}, UAT={uat_extract_path}"
        )

    int_rows = load_dataset(str(int_extract_path))
    uat_rows = load_dataset(str(uat_extract_path))
    comparison = compare_datasets(int_rows, uat_rows, key_columns=keys, metric_columns=metrics)

    return {
        "status": "success" if comparison.passed else "failed",
        "mode": mode,
        "intRun": int_result,
        "uatRun": uat_result,
        "reconciliation": comparison.to_dict(),
        "extracts": {
            "int": str(int_extract_path),
            "uat": str(uat_extract_path),
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run INT and UAT ETL, then reconcile INT vs UAT extracts")
    parser.add_argument("--mode", choices=["full", "incremental"], default="incremental")
    parser.add_argument("--profiles-dir", default="etl/profiles")
    parser.add_argument("--keys", default=",".join(DEFAULT_KEYS), help="Comma-separated key columns")
    parser.add_argument("--metrics", default=",".join(DEFAULT_METRICS), help="Comma-separated metric columns")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    keys = [item.strip() for item in args.keys.split(",") if item.strip()]
    metrics = [item.strip() for item in args.metrics.split(",") if item.strip()]

    result = run_int_uat_and_reconcile(
        mode=args.mode,
        profiles_dir=args.profiles_dir,
        keys=keys,
        metrics=metrics,
    )

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "success" else 1


if __name__ == "__main__":
    raise SystemExit(main())
