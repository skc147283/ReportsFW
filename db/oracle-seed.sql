-- ============================================================
-- ReportsFW Oracle Seed Script
-- Compatible with Oracle Database Free 23c (gvenzl/oracle-free)
-- Runs inside FREEPDB1 as the APP_USER (reports_user)
-- ============================================================

-- Tables
CREATE TABLE companies (
  company_id   NUMBER PRIMARY KEY,
  company_name VARCHAR2(120) NOT NULL UNIQUE,
  ticker       VARCHAR2(12)  NOT NULL,
  sector       VARCHAR2(80)  NOT NULL,
  headquarters VARCHAR2(120) NOT NULL
);

CREATE TABLE employees (
  employee_id NUMBER PRIMARY KEY,
  company_id  NUMBER        NOT NULL,
  full_name   VARCHAR2(120) NOT NULL,
  role_title  VARCHAR2(120) NOT NULL,
  email       VARCHAR2(160) NOT NULL UNIQUE,
  start_date  DATE          NOT NULL,
  salary      NUMBER(12, 2) NOT NULL,
  CONSTRAINT employees_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE stock_plans (
  plan_id             NUMBER PRIMARY KEY,
  company_id          NUMBER        NOT NULL,
  plan_name           VARCHAR2(160) NOT NULL,
  plan_type           VARCHAR2(60)  NOT NULL,
  annual_contribution NUMBER(12, 2) NOT NULL,
  vested_pct          NUMBER(5, 2)  NOT NULL,
  status              VARCHAR2(24)  NOT NULL,
  CONSTRAINT stock_plans_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE financial_reports (
  report_id       NUMBER PRIMARY KEY,
  company_id      NUMBER         NOT NULL,
  report_date     DATE           NOT NULL,
  portfolio_value NUMBER(14, 2)  NOT NULL,
  target_value    NUMBER(14, 2)  NOT NULL,
  risk_score      NUMBER(4, 2)   NOT NULL,
  commentary      VARCHAR2(400)  NOT NULL,
  CONSTRAINT financial_reports_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- ============================================================
-- Seed: Companies
-- ============================================================
INSERT INTO companies (company_id, company_name, ticker, sector, headquarters)
VALUES (1, 'Northstar Analytics', 'NSA', 'Financial Technology', 'Boston, MA');

INSERT INTO companies (company_id, company_name, ticker, sector, headquarters)
VALUES (2, 'Orion Bridge Capital', 'OBC', 'Private Equity', 'Chicago, IL');

INSERT INTO companies (company_id, company_name, ticker, sector, headquarters)
VALUES (3, 'Harbor Crest Advisors', 'HCA', 'Asset Management', 'Denver, CO');

INSERT INTO companies (company_id, company_name, ticker, sector, headquarters)
VALUES (4, 'Cedar Peak Holdings', 'CPH', 'Holdings', 'Seattle, WA');

COMMIT;

-- ============================================================
-- Seed: Employees
-- ============================================================
INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (1, 1, 'Ava Thompson', 'Chief Financial Officer', 'ava.thompson@northstar.example', TO_DATE('2021-02-15','YYYY-MM-DD'), 245000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (2, 1, 'Marcus Reed', 'Equity Plan Manager', 'marcus.reed@northstar.example', TO_DATE('2022-08-08','YYYY-MM-DD'), 132000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (3, 1, 'Lina Patel', 'Data Analyst', 'lina.patel@northstar.example', TO_DATE('2023-04-03','YYYY-MM-DD'), 118000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (4, 1, 'Jordan Kim', 'Finance Operations Lead', 'jordan.kim@northstar.example', TO_DATE('2020-11-19','YYYY-MM-DD'), 158000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (5, 1, 'Sofia Alvarez', 'Investor Relations Analyst', 'sofia.alvarez@northstar.example', TO_DATE('2024-01-22','YYYY-MM-DD'), 104000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (6, 2, 'Noah Brooks', 'Portfolio Controller', 'noah.brooks@orionbridge.example', TO_DATE('2022-03-14','YYYY-MM-DD'), 146000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (7, 2, 'Priya Shah', 'Investment Operations Lead', 'priya.shah@orionbridge.example', TO_DATE('2021-09-27','YYYY-MM-DD'), 162000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (8, 3, 'Ethan Cole', 'Client Reporting Manager', 'ethan.cole@harborcrest.example', TO_DATE('2020-06-11','YYYY-MM-DD'), 138000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (9, 3, 'Maya Lin', 'Performance Analyst', 'maya.lin@harborcrest.example', TO_DATE('2023-10-02','YYYY-MM-DD'), 121000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (10, 4, 'Lucas Bennett', 'Treasury Specialist', 'lucas.bennett@cedarpeak.example', TO_DATE('2019-04-18','YYYY-MM-DD'), 149000);

INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
VALUES (11, 4, 'Aisha Khan', 'Finance Systems Analyst', 'aisha.khan@cedarpeak.example', TO_DATE('2024-05-20','YYYY-MM-DD'), 117000);

COMMIT;

-- ============================================================
-- Seed: Stock Plans
-- ============================================================
INSERT INTO stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (1, 1, 'Executive RSU Growth Plan', 'RSU', 125000, 68, 'Active');

INSERT INTO stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (2, 1, 'Employee Equity Match', 'ESPP', 52000, 42, 'Active');

INSERT INTO stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (3, 1, 'Retention Option Pool', 'Stock Options', 38000, 54, 'Active');

INSERT INTO stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (4, 2, 'Orion Leadership Carry Plan', 'Carry', 195000, 61, 'Active');

INSERT INTO stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (5, 3, 'Harbor Deferred Bonus Plan', 'Deferred Comp', 91000, 47, 'Active');

INSERT INTO stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
VALUES (6, 4, 'Cedar Equity Preservation Plan', 'Restricted Stock', 72000, 38, 'Paused');

COMMIT;

-- ============================================================
-- Seed: Financial Reports
-- ============================================================
INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (1, 1, TO_DATE('2026-01-31','YYYY-MM-DD'), 1580000, 1720000, 3.4, 'Portfolio held steady with disciplined option exercise activity.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (2, 1, TO_DATE('2026-02-28','YYYY-MM-DD'), 1645000, 1765000, 3.2, 'Contribution pacing improved after the February grant cycle.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (3, 1, TO_DATE('2026-03-31','YYYY-MM-DD'), 1728000, 1820000, 3.0, 'Strong retention metrics and a stable vesting curve.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (4, 1, TO_DATE('2026-04-30','YYYY-MM-DD'), 1842000, 1900000, 2.8, 'Quarter-end report shows the portfolio closing in on target.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (5, 2, TO_DATE('2026-01-31','YYYY-MM-DD'), 2240000, 2300000, 3.6, 'Initial close shows slight variance after carry accrual adjustments.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (6, 2, TO_DATE('2026-04-30','YYYY-MM-DD'), 2365000, 2390000, 3.1, 'Target variance narrowed after reconciliation of partner allocations.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (7, 3, TO_DATE('2026-02-28','YYYY-MM-DD'), 1825000, 1800000, 2.7, 'Target exceeded after updated fee accruals and management adjustments.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (8, 3, TO_DATE('2026-05-31','YYYY-MM-DD'), 1912000, 1945000, 3.0, 'Month-end close aligned with downstream reporting controls.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (9, 4, TO_DATE('2026-03-31','YYYY-MM-DD'), 1540000, 1600000, 3.8, 'Treasury balances remain below target pending equity refresh.');

INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
VALUES (10, 4, TO_DATE('2026-06-30','YYYY-MM-DD'), 1668000, 1680000, 3.4, 'Quarter close is nearly aligned after upstream ETL corrections.');

COMMIT;
