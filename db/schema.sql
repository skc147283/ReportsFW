CREATE TABLE companies (
  company_id NUMBER PRIMARY KEY,
  company_name VARCHAR2(120) NOT NULL UNIQUE,
  ticker VARCHAR2(12) NOT NULL,
  sector VARCHAR2(80) NOT NULL,
  headquarters VARCHAR2(120) NOT NULL
);

CREATE TABLE employees (
  employee_id NUMBER PRIMARY KEY,
  company_id NUMBER NOT NULL,
  full_name VARCHAR2(120) NOT NULL,
  role_title VARCHAR2(120) NOT NULL,
  email VARCHAR2(160) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  salary NUMBER(12, 2) NOT NULL,
  CONSTRAINT employees_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE stock_plans (
  plan_id NUMBER PRIMARY KEY,
  company_id NUMBER NOT NULL,
  plan_name VARCHAR2(160) NOT NULL,
  plan_type VARCHAR2(60) NOT NULL,
  annual_contribution NUMBER(12, 2) NOT NULL,
  vested_pct NUMBER(5, 2) NOT NULL,
  status VARCHAR2(24) NOT NULL,
  CONSTRAINT stock_plans_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE financial_reports (
  report_id NUMBER PRIMARY KEY,
  company_id NUMBER NOT NULL,
  report_date DATE NOT NULL,
  portfolio_value NUMBER(14, 2) NOT NULL,
  target_value NUMBER(14, 2) NOT NULL,
  risk_score NUMBER(4, 2) NOT NULL,
  commentary VARCHAR2(400) NOT NULL,
  CONSTRAINT financial_reports_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

MERGE INTO companies target
USING (
  SELECT 1 AS company_id, 'Northstar Analytics' AS company_name, 'NSA' AS ticker, 'Financial Technology' AS sector, 'Boston, MA' AS headquarters FROM dual
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
  SELECT 1 AS employee_id, 1 AS company_id, 'Ava Thompson' AS full_name, 'Chief Financial Officer' AS role_title, 'ava.thompson@northstar.example' AS email, TO_DATE('2021-02-15', 'YYYY-MM-DD') AS start_date, 245000 AS salary FROM dual
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
