from __future__ import annotations

import argparse
import json
from pathlib import Path

from .compare import compare_datasets, load_dataset


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare source and target extracts for reconciliation testing.")
    parser.add_argument("--source", required=True, help="Path to the source extract (.csv or .json)")
    parser.add_argument("--target", required=True, help="Path to the target extract (.csv or .json)")
    parser.add_argument("--keys", required=True, help="Comma-separated key columns")
    parser.add_argument("--metrics", default="", help="Comma-separated metric columns")
    args = parser.parse_args()

    source_rows = load_dataset(args.source)
    target_rows = load_dataset(args.target)
    key_columns = [column.strip() for column in args.keys.split(",") if column.strip()]
    metric_columns = [column.strip() for column in args.metrics.split(",") if column.strip()]

    result = compare_datasets(source_rows, target_rows, key_columns, metric_columns)
    print(json.dumps(result.to_dict(), indent=2, sort_keys=True))
    return 0 if result.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
