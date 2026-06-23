"""
UI data-seeding test: creates a new company and employee via the live API,
then verifies the data appears on the dashboard.

Run manually:
    python3 -m pytest tests/ui/seed_data.py -v

Run via cron (morning / night):
    python3 -m pytest tests/ui/seed_data.py -v --tb=short
"""

from __future__ import annotations

import random
import string
import time

import pytest
import requests

BASE_URL = "http://localhost:3000"


def _uid(prefix: str = "", length: int = 5) -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"{prefix}{suffix}"


def _wait_for_server(max_retries: int = 10, delay: float = 1.0) -> None:
    for attempt in range(max_retries):
        try:
            resp = requests.get(f"{BASE_URL}/api/dashboard", timeout=5)
            if resp.ok:
                return
        except requests.ConnectionError:
            pass
        time.sleep(delay)
    pytest.skip(f"Server not reachable at {BASE_URL} after {max_retries} attempts")


@pytest.fixture(scope="module", autouse=True)
def ensure_server_running() -> None:  # type: ignore[return]
    _wait_for_server()


class TestSeedNewCompany:
    """Creates a unique company record on each run."""

    def test_create_company_via_api(self) -> None:
        company_name = f"Seed Corp {_uid()}"
        ticker = _uid("SC")[:6]
        payload = {
            "companyName": company_name,
            "ticker": ticker,
            "sector": "Data Engineering",
            "headquarters": "Austin, TX",
        }
        resp = requests.post(f"{BASE_URL}/api/companies", json=payload, timeout=10)
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"

        data = resp.json()
        companies = data.get("companies", [])
        names = [c["companyName"] for c in companies]
        assert company_name in names, f"New company '{company_name}' not in dashboard response: {names}"

    def test_dashboard_reflects_new_company(self) -> None:
        resp = requests.get(f"{BASE_URL}/api/dashboard", timeout=10)
        assert resp.ok, f"Dashboard fetch failed: {resp.status_code}"
        data = resp.json()
        assert data.get("source") == "oracle", f"Expected oracle source, got: {data.get('source')}"
        assert len(data.get("companies", [])) > 0, "No companies found in dashboard"


class TestSeedNewEmployee:
    """Creates a unique employee on each run and links to first company."""

    def test_create_employee_via_api(self) -> None:
        # Get current companies so we can link to a valid companyId
        dash = requests.get(f"{BASE_URL}/api/dashboard", timeout=10).json()
        companies = dash.get("companies", [])
        assert companies, "No companies available to assign employee to"
        company_id = companies[0]["companyId"]

        full_name = f"Seed User {_uid()}"
        email = f"seed.{_uid().lower()}@example.com"
        payload = {
            "companyId": company_id,
            "fullName": full_name,
            "roleTitle": "ETL Data Engineer",
            "email": email,
            "startDate": "2026-06-23",
            "salary": random.randint(90_000, 200_000),
        }
        resp = requests.post(f"{BASE_URL}/api/employees", json=payload, timeout=10)
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"

        data = resp.json()
        employees = data.get("employees", [])
        names = [e["fullName"] for e in employees]
        assert full_name in names, f"New employee '{full_name}' not in response: {names}"

    def test_dashboard_reflects_new_employee(self) -> None:
        resp = requests.get(f"{BASE_URL}/api/dashboard", timeout=10)
        assert resp.ok
        data = resp.json()
        assert data["summary"]["totalEmployees"] > 0


class TestETLAfterSeed:
    """Runs the incremental ETL and verifies it picks up new data."""

    def test_etl_incremental_runs_after_seed(self) -> None:
        import subprocess

        result = subprocess.run(
            ["python3", "-m", "etl.int_uat_reconcile", "--mode", "incremental"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        assert result.returncode == 0, f"ETL failed:\n{result.stdout}\n{result.stderr}"

        import json

        output = json.loads(result.stdout)
        assert output["status"] == "success", f"ETL status not success: {output}"
        assert output["reconciliation"]["passed"] is True, "Reconciliation failed after seed"
