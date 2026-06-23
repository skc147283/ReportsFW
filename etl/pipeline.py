from __future__ import annotations

import argparse
import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import urlopen


@dataclass(frozen=True)
class PipelineConfig:
    name: str = "default"
    source_url: str = "http://localhost:3000/api/dashboard"
    target_db_path: str = "db/reportsfw_etl.sqlite"
    export_dir: str = "tests/reconciliation/data"
    expected_source: str = "oracle"
    enforce_source_guard: bool = True


class EtlPipeline:
    def __init__(self, config: PipelineConfig):
        self.config = config

    def run(self, mode: str = "full", payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if mode not in {"full", "incremental"}:
            raise ValueError("mode must be 'full' or 'incremental'")

        source_payload = payload or self._extract()
        self._validate_payload_shape(source_payload)
        self._enforce_source_guard(source_payload)

        target_db = Path(self.config.target_db_path)
        target_db.parent.mkdir(parents=True, exist_ok=True)
        export_dir = Path(self.config.export_dir)
        export_dir.mkdir(parents=True, exist_ok=True)

        with sqlite3.connect(target_db) as connection:
            connection.row_factory = sqlite3.Row
            self._create_schema(connection)
            run_id = self._start_audit(connection, mode, source_payload.get("generatedAt", ""))

            try:
                self._run_data_quality_checks(source_payload)
                generated_at = source_payload["generatedAt"]

                if mode == "incremental" and not self._should_run_incremental(connection, generated_at):
                    self._finish_audit(connection, run_id, "SUCCESS", source_payload, "Incremental skip: no newer source data")
                    return {
                        "status": "skipped",
                        "reason": "no_new_data",
                        "generatedAt": generated_at,
                    }

                self._load_stage(connection, source_payload)
                self._upsert_target(connection)
                self._upsert_watermark(connection, generated_at)
                self._export_extracts(connection, source_payload, export_dir)

                counts = self._collect_counts(connection)
                self._finish_audit(connection, run_id, "SUCCESS", source_payload, "")

                return {
                    "status": "success",
                    "profile": self.config.name,
                    "generatedAt": generated_at,
                    "source": source_payload.get("source", "unknown"),
                    "counts": counts,
                    "targetDb": str(target_db),
                    "exportDir": str(export_dir),
                }
            except Exception as error:
                self._finish_audit(connection, run_id, "FAILED", source_payload, str(error))
                raise

    def _extract(self) -> dict[str, Any]:
        with urlopen(self.config.source_url, timeout=20) as response:  # noqa: S310
            return json.loads(response.read().decode("utf-8"))

    def _validate_payload_shape(self, payload: dict[str, Any]) -> None:
        required_top_level = ["generatedAt", "companies", "employees", "stockPlans", "reports"]
        missing = [field for field in required_top_level if field not in payload]
        if missing:
            raise ValueError(f"Source payload is missing required fields: {missing}")

    def _enforce_source_guard(self, payload: dict[str, Any]) -> None:
        if not self.config.enforce_source_guard:
            return

        actual_source = str(payload.get("source", "")).strip().lower()
        expected_source = self.config.expected_source.strip().lower()
        if actual_source != expected_source:
            raise ValueError(
                f"Source guard violation: expected source '{self.config.expected_source}' but got '{payload.get('source', 'missing')}'."
            )

    def _run_data_quality_checks(self, payload: dict[str, Any]) -> None:
        self._check_unique_ids(payload["companies"], "companyId", "companies")
        self._check_unique_ids(payload["employees"], "employeeId", "employees")
        self._check_unique_ids(payload["stockPlans"], "planId", "stockPlans")
        self._check_unique_ids(payload["reports"], "reportId", "reports")

    def _check_unique_ids(self, rows: list[dict[str, Any]], key: str, label: str) -> None:
        seen: set[Any] = set()
        for row in rows:
            key_value = row.get(key)
            if key_value is None:
                raise ValueError(f"{label} row is missing key {key}: {row}")
            if key_value in seen:
                raise ValueError(f"Duplicate {label} key detected: {key}={key_value}")
            seen.add(key_value)

    def _create_schema(self, conn: sqlite3.Connection) -> None:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS etl_run_audit (
              run_id INTEGER PRIMARY KEY AUTOINCREMENT,
              started_at TEXT NOT NULL,
              ended_at TEXT,
              status TEXT NOT NULL,
              mode TEXT NOT NULL,
              source_generated_at TEXT,
              source_row_count INTEGER DEFAULT 0,
              target_row_count INTEGER DEFAULT 0,
              message TEXT
            );

            CREATE TABLE IF NOT EXISTS etl_watermark (
              pipeline_name TEXT PRIMARY KEY,
              last_generated_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS stg_companies (
              company_id INTEGER PRIMARY KEY,
              company_name TEXT NOT NULL,
              ticker TEXT NOT NULL,
              sector TEXT NOT NULL,
              headquarters TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS stg_employees (
              employee_id INTEGER PRIMARY KEY,
              company_id INTEGER NOT NULL,
              full_name TEXT NOT NULL,
              role_title TEXT NOT NULL,
              email TEXT NOT NULL,
              start_date TEXT NOT NULL,
              salary REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS stg_stock_plans (
              plan_id INTEGER PRIMARY KEY,
              company_id INTEGER NOT NULL,
              plan_name TEXT NOT NULL,
              plan_type TEXT NOT NULL,
              annual_contribution REAL NOT NULL,
              vested_pct REAL NOT NULL,
              status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS stg_financial_reports (
              report_id INTEGER PRIMARY KEY,
              company_id INTEGER NOT NULL,
              report_date TEXT NOT NULL,
              portfolio_value REAL NOT NULL,
              target_value REAL NOT NULL,
              risk_score REAL NOT NULL,
              commentary TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS dim_companies (
              company_id INTEGER PRIMARY KEY,
              company_name TEXT NOT NULL,
              ticker TEXT NOT NULL,
              sector TEXT NOT NULL,
              headquarters TEXT NOT NULL,
              etl_loaded_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS dim_employees (
              employee_id INTEGER PRIMARY KEY,
              company_id INTEGER NOT NULL,
              full_name TEXT NOT NULL,
              role_title TEXT NOT NULL,
              email TEXT NOT NULL,
              start_date TEXT NOT NULL,
              salary REAL NOT NULL,
              etl_loaded_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS fact_stock_plans (
              plan_id INTEGER PRIMARY KEY,
              company_id INTEGER NOT NULL,
              plan_name TEXT NOT NULL,
              plan_type TEXT NOT NULL,
              annual_contribution REAL NOT NULL,
              vested_pct REAL NOT NULL,
              status TEXT NOT NULL,
              etl_loaded_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS fact_financial_reports (
              report_id INTEGER PRIMARY KEY,
              company_id INTEGER NOT NULL,
              report_date TEXT NOT NULL,
              portfolio_value REAL NOT NULL,
              target_value REAL NOT NULL,
              risk_score REAL NOT NULL,
              commentary TEXT NOT NULL,
              etl_loaded_at TEXT NOT NULL
            );
            """
        )

    def _start_audit(self, conn: sqlite3.Connection, mode: str, source_generated_at: str) -> int:
        now = self._now_iso()
        cursor = conn.execute(
            """
            INSERT INTO etl_run_audit (started_at, status, mode, source_generated_at)
            VALUES (?, 'RUNNING', ?, ?)
            """,
            (now, mode, source_generated_at),
        )
        return int(cursor.lastrowid)

    def _finish_audit(
        self,
        conn: sqlite3.Connection,
        run_id: int,
        status: str,
        payload: dict[str, Any],
        message: str,
    ) -> None:
        source_rows = len(payload.get("companies", [])) + len(payload.get("employees", [])) + len(payload.get("stockPlans", [])) + len(payload.get("reports", []))
        target_counts = self._collect_counts(conn)
        target_rows = sum(target_counts.values())

        conn.execute(
            """
            UPDATE etl_run_audit
               SET ended_at = ?, status = ?, source_row_count = ?, target_row_count = ?, message = ?
             WHERE run_id = ?
            """,
            (self._now_iso(), status, source_rows, target_rows, message, run_id),
        )

    def _should_run_incremental(self, conn: sqlite3.Connection, generated_at: str) -> bool:
        row = conn.execute(
            "SELECT last_generated_at FROM etl_watermark WHERE pipeline_name = 'reportsfw_dashboard'"
        ).fetchone()

        if row is None:
            return True

        return generated_at > row["last_generated_at"]

    def _upsert_watermark(self, conn: sqlite3.Connection, generated_at: str) -> None:
        conn.execute(
            """
            INSERT INTO etl_watermark (pipeline_name, last_generated_at, updated_at)
            VALUES ('reportsfw_dashboard', ?, ?)
            ON CONFLICT(pipeline_name) DO UPDATE SET
              last_generated_at = excluded.last_generated_at,
              updated_at = excluded.updated_at
            """,
            (generated_at, self._now_iso()),
        )

    def _load_stage(self, conn: sqlite3.Connection, payload: dict[str, Any]) -> None:
        conn.executescript(
            """
            DELETE FROM stg_companies;
            DELETE FROM stg_employees;
            DELETE FROM stg_stock_plans;
            DELETE FROM stg_financial_reports;
            """
        )

        conn.executemany(
            """
            INSERT INTO stg_companies (company_id, company_name, ticker, sector, headquarters)
            VALUES (:companyId, :companyName, :ticker, :sector, :headquarters)
            """,
            payload["companies"],
        )

        conn.executemany(
            """
            INSERT INTO stg_employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
            VALUES (:employeeId, :companyId, :fullName, :roleTitle, :email, :startDate, :salary)
            """,
            payload["employees"],
        )

        conn.executemany(
            """
            INSERT INTO stg_stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
            VALUES (:planId, :companyId, :planName, :planType, :annualContribution, :vestedPct, :status)
            """,
            payload["stockPlans"],
        )

        conn.executemany(
            """
            INSERT INTO stg_financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
            VALUES (:reportId, :companyId, :reportDate, :portfolioValue, :targetValue, :riskScore, :commentary)
            """,
            payload["reports"],
        )

    def _upsert_target(self, conn: sqlite3.Connection) -> None:
        loaded_at = self._now_iso()

        conn.execute(
            """
                        INSERT OR REPLACE INTO dim_companies (company_id, company_name, ticker, sector, headquarters, etl_loaded_at)
            SELECT company_id, company_name, ticker, sector, headquarters, ?
              FROM stg_companies
            """,
            (loaded_at,),
        )

        conn.execute(
            """
                        INSERT OR REPLACE INTO dim_employees (employee_id, company_id, full_name, role_title, email, start_date, salary, etl_loaded_at)
            SELECT employee_id, company_id, full_name, role_title, email, start_date, salary, ?
              FROM stg_employees
            """,
            (loaded_at,),
        )

        conn.execute(
            """
                        INSERT OR REPLACE INTO fact_stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status, etl_loaded_at)
            SELECT plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status, ?
              FROM stg_stock_plans
            """,
            (loaded_at,),
        )

        conn.execute(
            """
                        INSERT OR REPLACE INTO fact_financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary, etl_loaded_at)
            SELECT report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary, ?
              FROM stg_financial_reports
            """,
            (loaded_at,),
        )

    def _collect_counts(self, conn: sqlite3.Connection) -> dict[str, int]:
        return {
            "companies": self._read_count(conn, "dim_companies"),
            "employees": self._read_count(conn, "dim_employees"),
            "stockPlans": self._read_count(conn, "fact_stock_plans"),
            "reports": self._read_count(conn, "fact_financial_reports"),
        }

    def _read_count(self, conn: sqlite3.Connection, table_name: str) -> int:
        row = conn.execute(f"SELECT COUNT(*) AS total FROM {table_name}").fetchone()
        if row is None:
            return 0
        return int(row["total"])

    def _export_extracts(self, conn: sqlite3.Connection, source_payload: dict[str, Any], export_dir: Path) -> None:
        source_reports = source_payload["reports"]
        target_reports = [
            {
                "reportId": row["report_id"],
                "companyId": row["company_id"],
                "reportDate": row["report_date"],
                "portfolioValue": row["portfolio_value"],
                "targetValue": row["target_value"],
                "riskScore": row["risk_score"],
                "commentary": row["commentary"],
            }
            for row in conn.execute(
                """
                SELECT report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary
                  FROM fact_financial_reports
                 ORDER BY report_id
                """
            ).fetchall()
        ]

        (export_dir / "reports_source.json").write_text(json.dumps(source_reports, indent=2), encoding="utf-8")
        (export_dir / "reports_target.json").write_text(json.dumps(target_reports, indent=2), encoding="utf-8")

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run ReportsFW ETL pipeline")
    parser.add_argument("--profile", choices=["INT", "UAT"], help="Use built-in INT/UAT profile config")
    parser.add_argument("--profiles-dir", default="etl/profiles", help="Directory containing profile json files")
    parser.add_argument("--source-url", default=PipelineConfig.source_url)
    parser.add_argument("--target-db", default=PipelineConfig.target_db_path)
    parser.add_argument("--export-dir", default=PipelineConfig.export_dir)
    parser.add_argument("--expected-source", default=PipelineConfig.expected_source)
    parser.add_argument("--allow-non-oracle-source", action="store_true", help="Disable source guard check")
    parser.add_argument("--mode", choices=["full", "incremental"], default="full")
    return parser


def load_profile(profile_name: str, profiles_dir: str) -> PipelineConfig:
    profile_path = Path(profiles_dir) / f"{profile_name.lower()}.json"
    if not profile_path.exists():
        raise FileNotFoundError(f"Profile file not found: {profile_path}")

    with profile_path.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    return PipelineConfig(
        name=str(payload.get("name", profile_name)),
        source_url=str(payload.get("source_url", PipelineConfig.source_url)),
        target_db_path=str(payload.get("target_db_path", PipelineConfig.target_db_path)),
        export_dir=str(payload.get("export_dir", PipelineConfig.export_dir)),
        expected_source=str(payload.get("expected_source", PipelineConfig.expected_source)),
        enforce_source_guard=bool(payload.get("enforce_source_guard", True)),
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.profile:
        config = load_profile(args.profile, args.profiles_dir)
    else:
        config = PipelineConfig(
            name="default",
            source_url=args.source_url,
            target_db_path=args.target_db,
            export_dir=args.export_dir,
            expected_source=args.expected_source,
            enforce_source_guard=not args.allow_non_oracle_source,
        )

    if args.allow_non_oracle_source:
        config = PipelineConfig(
            name=config.name,
            source_url=config.source_url,
            target_db_path=config.target_db_path,
            export_dir=config.export_dir,
            expected_source=config.expected_source,
            enforce_source_guard=False,
        )

    pipeline = EtlPipeline(config)
    result = pipeline.run(mode=args.mode)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
