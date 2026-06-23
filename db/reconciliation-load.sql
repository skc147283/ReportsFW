-- Reconciliation load script for enriching the live Oracle dataset.
-- Idempotent MERGE statements so the file can be rerun safely.

MERGE INTO companies target
USING (
  SELECT 4 AS company_id, 'Orion Bridge Capital' AS company_name, 'OBC' AS ticker, 'Private Equity' AS sector, 'Chicago, IL' AS headquarters FROM dual
) source
ON (target.company_id = source.company_id)
WHEN MATCHED THEN UPDATE SET
  target.company_name = source.company_name,
  target.ticker = source.ticker,
  target.sector = source.sector,
  target.headquarters = source.headquarters
WHEN NOT MATCHED THEN INSERT (company_id, company_name, ticker, sector, headquarters)
VALUES (source.company_id, source.company_name, source.ticker, source.sector, source.headquarters);

MERGE INTO companies target
USING (
  SELECT 5 AS company_id, 'Harbor Crest Advisors' AS company_name, 'HCA' AS ticker, 'Asset Management' AS sector, 'Denver, CO' AS headquarters FROM dual
) source
ON (target.company_id = source.company_id)
WHEN MATCHED THEN UPDATE SET
  target.company_name = source.company_name,
  target.ticker = source.ticker,
  target.sector = source.sector,
  target.headquarters = source.headquarters
WHEN NOT MATCHED THEN INSERT (company_id, company_name, ticker, sector, headquarters)
VALUES (source.company_id, source.company_name, source.ticker, source.sector, source.headquarters);

MERGE INTO companies target
USING (
  SELECT 6 AS company_id, 'Cedar Peak Holdings' AS company_name, 'CPH' AS ticker, 'Holdings' AS sector, 'Seattle, WA' AS headquarters FROM dual
) source
ON (target.company_id = source.company_id)
WHEN MATCHED THEN UPDATE SET
  target.company_name = source.company_name,
  target.ticker = source.ticker,
  target.sector = source.sector,
  target.headquarters = source.headquarters
WHEN NOT MATCHED THEN INSERT (company_id, company_name, ticker, sector, headquarters)
VALUES (source.company_id, source.company_name, source.ticker, source.sector, source.headquarters);

MERGE INTO employees target
USING (
  SELECT 8 AS employee_id, 3 AS company_id, 'Ethan Cole' AS full_name, 'Client Reporting Manager' AS role_title, 'ethan.cole@harborcrest.example' AS email, TO_DATE('2020-06-11','YYYY-MM-DD') AS start_date, 138000 AS salary FROM dual
) source
ON (target.employee_id = source.employee_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.full_name = source.full_name,
  target.role_title = source.role_title,
  target.email = source.email,
  target.start_date = source.start_date,
  target.salary = source.salary
WHEN NOT MATCHED THEN INSERT (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (source.employee_id, source.company_id, source.full_name, source.role_title, source.email, source.start_date, source.salary);

MERGE INTO employees target
USING (
  SELECT 9 AS employee_id, 3 AS company_id, 'Maya Lin' AS full_name, 'Performance Analyst' AS role_title, 'maya.lin@harborcrest.example' AS email, TO_DATE('2023-10-02','YYYY-MM-DD') AS start_date, 121000 AS salary FROM dual
) source
ON (target.employee_id = source.employee_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.full_name = source.full_name,
  target.role_title = source.role_title,
  target.email = source.email,
  target.start_date = source.start_date,
  target.salary = source.salary
WHEN NOT MATCHED THEN INSERT (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (source.employee_id, source.company_id, source.full_name, source.role_title, source.email, source.start_date, source.salary);

MERGE INTO employees target
USING (
  SELECT 10 AS employee_id, 4 AS company_id, 'Lucas Bennett' AS full_name, 'Treasury Specialist' AS role_title, 'lucas.bennett@cedarpeak.example' AS email, TO_DATE('2019-04-18','YYYY-MM-DD') AS start_date, 149000 AS salary FROM dual
) source
ON (target.employee_id = source.employee_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.full_name = source.full_name,
  target.role_title = source.role_title,
  target.email = source.email,
  target.start_date = source.start_date,
  target.salary = source.salary
WHEN NOT MATCHED THEN INSERT (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (source.employee_id, source.company_id, source.full_name, source.role_title, source.email, source.start_date, source.salary);

MERGE INTO employees target
USING (
  SELECT 11 AS employee_id, 4 AS company_id, 'Aisha Khan' AS full_name, 'Finance Systems Analyst' AS role_title, 'aisha.khan@cedarpeak.example' AS email, TO_DATE('2024-05-20','YYYY-MM-DD') AS start_date, 117000 AS salary FROM dual
) source
ON (target.employee_id = source.employee_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.full_name = source.full_name,
  target.role_title = source.role_title,
  target.email = source.email,
  target.start_date = source.start_date,
  target.salary = source.salary
WHEN NOT MATCHED THEN INSERT (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (source.employee_id, source.company_id, source.full_name, source.role_title, source.email, source.start_date, source.salary);

MERGE INTO employees target
USING (
  SELECT 12 AS employee_id, 5 AS company_id, 'Samantha Ortiz' AS full_name, 'Client Success Director' AS role_title, 'samantha.ortiz@harborcrest.example' AS email, TO_DATE('2021-07-12','YYYY-MM-DD') AS start_date, 154000 AS salary FROM dual
) source
ON (target.employee_id = source.employee_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.full_name = source.full_name,
  target.role_title = source.role_title,
  target.email = source.email,
  target.start_date = source.start_date,
  target.salary = source.salary
WHEN NOT MATCHED THEN INSERT (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (source.employee_id, source.company_id, source.full_name, source.role_title, source.email, source.start_date, source.salary);

MERGE INTO employees target
USING (
  SELECT 13 AS employee_id, 6 AS company_id, 'Daniel Park' AS full_name, 'Valuation Analyst' AS role_title, 'daniel.park@cedarpeak.example' AS email, TO_DATE('2022-02-21','YYYY-MM-DD') AS start_date, 132000 AS salary FROM dual
) source
ON (target.employee_id = source.employee_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.full_name = source.full_name,
  target.role_title = source.role_title,
  target.email = source.email,
  target.start_date = source.start_date,
  target.salary = source.salary
WHEN NOT MATCHED THEN INSERT (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (source.employee_id, source.company_id, source.full_name, source.role_title, source.email, source.start_date, source.salary);

MERGE INTO stock_plans target
USING (
  SELECT 4 AS plan_id, 2 AS company_id, 'Orion Leadership Carry Plan' AS plan_name, 'Carry' AS plan_type, 195000 AS annual_contribution, 61 AS vested_pct, 'Active' AS status FROM dual
) source
ON (target.plan_id = source.plan_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.plan_name = source.plan_name,
  target.plan_type = source.plan_type,
  target.annual_contribution = source.annual_contribution,
  target.vested_pct = source.vested_pct,
  target.status = source.status
WHEN NOT MATCHED THEN INSERT (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (source.plan_id, source.company_id, source.plan_name, source.plan_type, source.annual_contribution, source.vested_pct, source.status);

MERGE INTO stock_plans target
USING (
  SELECT 5 AS plan_id, 3 AS company_id, 'Harbor Deferred Bonus Plan' AS plan_name, 'Deferred Comp' AS plan_type, 91000 AS annual_contribution, 47 AS vested_pct, 'Active' AS status FROM dual
) source
ON (target.plan_id = source.plan_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.plan_name = source.plan_name,
  target.plan_type = source.plan_type,
  target.annual_contribution = source.annual_contribution,
  target.vested_pct = source.vested_pct,
  target.status = source.status
WHEN NOT MATCHED THEN INSERT (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (source.plan_id, source.company_id, source.plan_name, source.plan_type, source.annual_contribution, source.vested_pct, source.status);

MERGE INTO stock_plans target
USING (
  SELECT 6 AS plan_id, 4 AS company_id, 'Cedar Equity Preservation Plan' AS plan_name, 'Restricted Stock' AS plan_type, 72000 AS annual_contribution, 38 AS vested_pct, 'Paused' AS status FROM dual
) source
ON (target.plan_id = source.plan_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.plan_name = source.plan_name,
  target.plan_type = source.plan_type,
  target.annual_contribution = source.annual_contribution,
  target.vested_pct = source.vested_pct,
  target.status = source.status
WHEN NOT MATCHED THEN INSERT (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (source.plan_id, source.company_id, source.plan_name, source.plan_type, source.annual_contribution, source.vested_pct, source.status);

MERGE INTO financial_reports target
USING (
  SELECT 5 AS report_id, 2 AS company_id, TO_DATE('2026-01-31','YYYY-MM-DD') AS report_date, 2240000 AS portfolio_value, 2300000 AS target_value, 3.6 AS risk_score, 'Initial close shows slight variance after carry accrual adjustments.' AS commentary FROM dual
) source
ON (target.report_id = source.report_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.report_date = source.report_date,
  target.portfolio_value = source.portfolio_value,
  target.target_value = source.target_value,
  target.risk_score = source.risk_score,
  target.commentary = source.commentary
WHEN NOT MATCHED THEN INSERT (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (source.report_id, source.company_id, source.report_date, source.portfolio_value, source.target_value, source.risk_score, source.commentary);

MERGE INTO financial_reports target
USING (
  SELECT 6 AS report_id, 2 AS company_id, TO_DATE('2026-04-30','YYYY-MM-DD') AS report_date, 2365000 AS portfolio_value, 2390000 AS target_value, 3.1 AS risk_score, 'Target variance narrowed after reconciliation of partner allocations.' AS commentary FROM dual
) source
ON (target.report_id = source.report_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.report_date = source.report_date,
  target.portfolio_value = source.portfolio_value,
  target.target_value = source.target_value,
  target.risk_score = source.risk_score,
  target.commentary = source.commentary
WHEN NOT MATCHED THEN INSERT (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (source.report_id, source.company_id, source.report_date, source.portfolio_value, source.target_value, source.risk_score, source.commentary);

MERGE INTO financial_reports target
USING (
  SELECT 7 AS report_id, 3 AS company_id, TO_DATE('2026-02-28','YYYY-MM-DD') AS report_date, 1825000 AS portfolio_value, 1800000 AS target_value, 2.7 AS risk_score, 'Target exceeded after updated fee accruals and management adjustments.' AS commentary FROM dual
) source
ON (target.report_id = source.report_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.report_date = source.report_date,
  target.portfolio_value = source.portfolio_value,
  target.target_value = source.target_value,
  target.risk_score = source.risk_score,
  target.commentary = source.commentary
WHEN NOT MATCHED THEN INSERT (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (source.report_id, source.company_id, source.report_date, source.portfolio_value, source.target_value, source.risk_score, source.commentary);

MERGE INTO financial_reports target
USING (
  SELECT 8 AS report_id, 3 AS company_id, TO_DATE('2026-05-31','YYYY-MM-DD') AS report_date, 1912000 AS portfolio_value, 1945000 AS target_value, 3.0 AS risk_score, 'Month-end close aligned with downstream reporting controls.' AS commentary FROM dual
) source
ON (target.report_id = source.report_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.report_date = source.report_date,
  target.portfolio_value = source.portfolio_value,
  target.target_value = source.target_value,
  target.risk_score = source.risk_score,
  target.commentary = source.commentary
WHEN NOT MATCHED THEN INSERT (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (source.report_id, source.company_id, source.report_date, source.portfolio_value, source.target_value, source.risk_score, source.commentary);

MERGE INTO financial_reports target
USING (
  SELECT 9 AS report_id, 4 AS company_id, TO_DATE('2026-03-31','YYYY-MM-DD') AS report_date, 1540000 AS portfolio_value, 1600000 AS target_value, 3.8 AS risk_score, 'Treasury balances remain below target pending equity refresh.' AS commentary FROM dual
) source
ON (target.report_id = source.report_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.report_date = source.report_date,
  target.portfolio_value = source.portfolio_value,
  target.target_value = source.target_value,
  target.risk_score = source.risk_score,
  target.commentary = source.commentary
WHEN NOT MATCHED THEN INSERT (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (source.report_id, source.company_id, source.report_date, source.portfolio_value, source.target_value, source.risk_score, source.commentary);

MERGE INTO financial_reports target
USING (
  SELECT 10 AS report_id, 4 AS company_id, TO_DATE('2026-06-30','YYYY-MM-DD') AS report_date, 1668000 AS portfolio_value, 1680000 AS target_value, 3.4 AS risk_score, 'Quarter close is nearly aligned after upstream ETL corrections.' AS commentary FROM dual
) source
ON (target.report_id = source.report_id)
WHEN MATCHED THEN UPDATE SET
  target.company_id = source.company_id,
  target.report_date = source.report_date,
  target.portfolio_value = source.portfolio_value,
  target.target_value = source.target_value,
  target.risk_score = source.risk_score,
  target.commentary = source.commentary
WHEN NOT MATCHED THEN INSERT (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (source.report_id, source.company_id, source.report_date, source.portfolio_value, source.target_value, source.risk_score, source.commentary);

COMMIT;
