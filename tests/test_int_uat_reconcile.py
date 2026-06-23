from __future__ import annotations

import json
from pathlib import Path

from etl.int_uat_reconcile import run_int_uat_and_reconcile


def sample_payload() -> dict[str, object]:
    return {
        "source": "oracle",
        "generatedAt": "2026-06-23T03:50:00.000Z",
        "companies": [
            {
                "companyId": 1,
                "companyName": "Northstar Analytics",
                "ticker": "NSA",
                "sector": "Financial Technology",
                "headquarters": "Boston, MA",
            }
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
            }
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
            }
        ],
    }


def test_int_uat_orchestrator_runs_and_reconciles(tmp_path: Path) -> None:
    profiles_dir = tmp_path / "profiles"
    profiles_dir.mkdir(parents=True, exist_ok=True)

    (profiles_dir / "int.json").write_text(
        json.dumps(
            {
                "name": "INT",
                "source_url": "http://localhost:3000/api/dashboard",
                "target_db_path": str(tmp_path / "int.sqlite"),
                "export_dir": str(tmp_path / "int_exports"),
                "expected_source": "oracle",
                "enforce_source_guard": True,
            }
        ),
        encoding="utf-8",
    )

    (profiles_dir / "uat.json").write_text(
        json.dumps(
            {
                "name": "UAT",
                "source_url": "http://localhost:3000/api/dashboard",
                "target_db_path": str(tmp_path / "uat.sqlite"),
                "export_dir": str(tmp_path / "uat_exports"),
                "expected_source": "oracle",
                "enforce_source_guard": True,
            }
        ),
        encoding="utf-8",
    )

    result = run_int_uat_and_reconcile(
        mode="full",
        profiles_dir=str(profiles_dir),
        payload=sample_payload(),
    )

    assert result["status"] == "success"
    assert result["reconciliation"]["passed"] is True
    assert result["reconciliation"]["summary"]["source_row_count"] == 1
    assert result["reconciliation"]["summary"]["target_row_count"] == 1
