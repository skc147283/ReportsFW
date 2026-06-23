from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from etl.pipeline import EtlPipeline, PipelineConfig, load_profile


def sample_payload() -> dict[str, object]:
    return {
        "source": "oracle",
        "generatedAt": "2026-06-23T03:15:00.000Z",
        "companies": [
            {
                "companyId": 1,
                "companyName": "Northstar Analytics",
                "ticker": "NSA",
                "sector": "Financial Technology",
                "headquarters": "Boston, MA",
            },
            {
                "companyId": 2,
                "companyName": "Orion Bridge Capital",
                "ticker": "OBC",
                "sector": "Private Equity",
                "headquarters": "Chicago, IL",
            },
        ],
        "employees": [
            {
                "employeeId": 1,
                "companyId": 1,
                "fullName": "Ava Thompson",
                "roleTitle": "Chief Financial Officer",
                "email": "ava.thompson@northstar.example",
                "startDate": "2021-02-15",
                "salary": 245000,
            },
            {
                "employeeId": 2,
                "companyId": 2,
                "fullName": "Noah Brooks",
                "roleTitle": "Portfolio Controller",
                "email": "noah.brooks@orionbridge.example",
                "startDate": "2022-03-14",
                "salary": 146000,
            },
        ],
        "stockPlans": [
            {
                "planId": 1,
                "companyId": 1,
                "planName": "Executive RSU Growth Plan",
                "planType": "RSU",
                "annualContribution": 125000,
                "vestedPct": 68,
                "status": "Active",
            }
        ],
        "reports": [
            {
                "reportId": 1,
                "companyId": 1,
                "reportDate": "2026-01-31",
                "portfolioValue": 1580000,
                "targetValue": 1720000,
                "riskScore": 3.4,
                "commentary": "Portfolio held steady.",
            },
            {
                "reportId": 2,
                "companyId": 2,
                "reportDate": "2026-01-31",
                "portfolioValue": 2240000,
                "targetValue": 2300000,
                "riskScore": 3.6,
                "commentary": "Initial close variance.",
            },
        ],
    }


def test_etl_full_run_builds_target_tables_and_exports(tmp_path: Path) -> None:
    db_path = tmp_path / "etl.sqlite"
    export_dir = tmp_path / "exports"

    pipeline = EtlPipeline(PipelineConfig(target_db_path=str(db_path), export_dir=str(export_dir)))
    result = pipeline.run(mode="full", payload=sample_payload())

    assert result["status"] == "success"
    assert result["counts"]["companies"] == 2
    assert result["counts"]["employees"] == 2
    assert result["counts"]["stockPlans"] == 1
    assert result["counts"]["reports"] == 2

    with sqlite3.connect(db_path) as conn:
        total_runs = conn.execute("SELECT COUNT(*) FROM etl_run_audit").fetchone()[0]
        assert total_runs == 1

    source_extract = export_dir / "reports_source.json"
    target_extract = export_dir / "reports_target.json"
    assert source_extract.exists()
    assert target_extract.exists()

    source_rows = json.loads(source_extract.read_text(encoding="utf-8"))
    target_rows = json.loads(target_extract.read_text(encoding="utf-8"))
    assert len(source_rows) == 2
    assert len(target_rows) == 2


def test_etl_incremental_mode_skips_when_no_new_data(tmp_path: Path) -> None:
    db_path = tmp_path / "etl.sqlite"
    export_dir = tmp_path / "exports"

    pipeline = EtlPipeline(PipelineConfig(target_db_path=str(db_path), export_dir=str(export_dir)))
    pipeline.run(mode="full", payload=sample_payload())

    result = pipeline.run(mode="incremental", payload=sample_payload())
    assert result["status"] == "skipped"
    assert result["reason"] == "no_new_data"


def test_etl_source_guard_blocks_non_oracle_payload(tmp_path: Path) -> None:
    db_path = tmp_path / "etl.sqlite"
    export_dir = tmp_path / "exports"
    pipeline = EtlPipeline(PipelineConfig(target_db_path=str(db_path), export_dir=str(export_dir)))

    payload = sample_payload()
    payload["source"] = "demo"

    try:
        pipeline.run(mode="full", payload=payload)
        raise AssertionError("Expected source guard to fail for non-oracle source")
    except ValueError as error:
        assert "Source guard violation" in str(error)


def test_profile_loader_reads_int_and_uat_configs() -> None:
    int_profile = load_profile("INT", "etl/profiles")
    uat_profile = load_profile("UAT", "etl/profiles")

    assert int_profile.name.upper() == "INT"
    assert uat_profile.name.upper() == "UAT"
    assert int_profile.expected_source == "oracle"
    assert uat_profile.expected_source == "oracle"
    assert int_profile.enforce_source_guard is True
    assert uat_profile.enforce_source_guard is True
