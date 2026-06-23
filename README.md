# ReportsFW

## HTML README

Open `README.html` in a browser for a consolidated project document covering architecture, testing framework, and business use cases.

A compact Next.js dashboard for financial stock plan reports with:

- a browser UI dashboard
- a JSON API at `/api/dashboard`
- PostgreSQL schema and seed scripts
- optional Oracle fallback support
- demo fallback data when Oracle connection settings are not present

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- PostgreSQL via `pg`
- Oracle Database via `oracledb` (optional)

## PostgreSQL setup

Set these environment variables before running the app against PostgreSQL:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=wealth_mgmt
POSTGRES_USER=Sureshkc
POSTGRES_PASSWORD=Skc@2026
```

This workspace includes a local `.env.local` wired with your details.

## Oracle setup (optional fallback)

If you want Oracle instead of PostgreSQL, set:

```bash
ORACLE_USER=your_user
ORACLE_PASSWORD=your_password
ORACLE_CONNECTION_STRING=host:1521/service_name
```

The first request to the dashboard API creates the sample schema and seeds one company, five employees, three stock plans, and report rows if the tables are empty.

## Run locally

```bash
npm install
npm run dev
```

Open the app at `http://localhost:3000`.

## Notes

If database credentials are not configured or the database is unreachable, the app shows the built-in demo dataset so the UI still works.

## Architecture and Business Documents (HTML)

The following HTML documents are included:

- `docs/architecture.html` - system architecture, runtime flow, data model, and deployment inputs.
- `docs/e2e-testing-framework.html` - E2E framework design, folder layout, controls, and execution model.
- `docs/business-use-cases.html` - business use cases and traceability matrix mapped to automated tests.

Open any document directly in a browser.

## End-to-End Testing Framework

This repository now includes a pytest + Selenium E2E framework with Page Object support.

### Install E2E dependencies

```bash
python3 -m pip install -r tests/e2e/requirements-e2e.txt
```

### Configure test run (optional)

```bash
export E2E_BASE_URL=http://localhost:3000
export E2E_HEADLESS=true
export E2E_TIMEOUT_SECONDS=15
```

### Run tests

```bash
python3 -m pytest
```

Or run only the full business flow test:

```bash
python3 -m pytest tests/e2e/tests/test_business_flows.py
```

## ETL Pipeline (Source -> Target)

A small Python ETL pipeline is available to demonstrate ETL concepts in this repository:

- Extract from dashboard API (`/api/dashboard`)
- Stage + transform + load into SQLite target tables
- Row-level audit logging and watermark-based incremental mode
- Export source/target report extracts for reconciliation tests

### Run full load

```bash
python3 -m etl.pipeline --mode full
```

### Run incremental load

```bash
python3 -m etl.pipeline --mode incremental
```

### Run by environment profile (INT/UAT)

```bash
python3 -m etl.pipeline --profile INT --mode full
python3 -m etl.pipeline --profile UAT --mode full
```

### One command: INT + UAT + reconciliation

Run INT ETL, then UAT ETL, then reconcile INT vs UAT report extracts:

```bash
python3 -m etl.int_uat_reconcile --mode incremental
```

Or via npm script:

```bash
npm run etl:int-uat
```

Profile files live under `etl/profiles/` and currently define:

- `etl/profiles/int.json`
- `etl/profiles/uat.json`

### Source guard (hardened)

ETL now fails if the source payload does not report `source == oracle`.

To disable this explicitly (not recommended for INT/UAT):

```bash
python3 -m etl.pipeline --allow-non-oracle-source
```

Default target database: `db/reportsfw_etl.sqlite`.
Default exports: `tests/reconciliation/data/reports_source.json` and `tests/reconciliation/data/reports_target.json`.

### Validate ETL pipeline tests

```bash
python3 -m pytest tests/test_etl_pipeline.py
```
