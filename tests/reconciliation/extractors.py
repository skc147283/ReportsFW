from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


def load_rows(path: str | Path) -> list[dict[str, Any]]:
    file_path = Path(path)
    suffix = file_path.suffix.lower()

    if suffix == ".csv":
        return _load_csv(file_path)
    if suffix == ".json":
        return _load_json(file_path)

    raise ValueError(f"Unsupported extract format: {file_path.suffix}")


def _load_csv(path: Path) -> list[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def _load_json(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    if isinstance(payload, list):
        return [dict(row) for row in payload]

    if isinstance(payload, dict):
        for key in ("rows", "data", "records"):
            value = payload.get(key)
            if isinstance(value, list):
                return [dict(row) for row in value]

    raise ValueError(f"JSON extract must be a list or contain rows/data/records: {path}")
