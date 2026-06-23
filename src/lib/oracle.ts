"server-only";

import oracledb, { type Connection } from "oracledb";
import { Pool, type PoolClient } from "pg";
import {
  demoDashboardData,
  type Company,
  type DashboardData,
  type Employee,
  type FinancialReport,
  type StockPlan,
} from "@/lib/sample-data";

type OracleConfig = {
  user: string;
  password: string;
  connectionString: string;
};

type PostgresConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

type DashboardState = Omit<DashboardData, "generatedAt" | "source" | "summary">;

export type CompanyInput = Omit<Company, "companyId"> & {
  companyId?: number;
};

export type EmployeeInput = Omit<Employee, "employeeId"> & {
  employeeId?: number;
};

export type StockPlanInput = Omit<StockPlan, "planId"> & {
  planId?: number;
};

const seedState: DashboardState = {
  companies: structuredClone(demoDashboardData.companies),
  employees: structuredClone(demoDashboardData.employees),
  stockPlans: structuredClone(demoDashboardData.stockPlans),
  reports: structuredClone(demoDashboardData.reports),
};

const demoState: DashboardState = structuredClone(seedState);
let postgresPool: Pool | null = null;

function getOracleConfig(): OracleConfig | null {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectionString = process.env.ORACLE_CONNECTION_STRING;

  if (!user || !password || !connectionString) {
    return null;
  }

  return { user, password, connectionString };
}

function getPostgresConfig(): PostgresConfig | null {
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT;
  const database = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!host || !port || !database || !user || !password) {
    return null;
  }

  return {
    host,
    port: Number(port),
    database,
    user,
    password,
  };
}

function getPostgresPool(config: PostgresConfig): Pool {
  if (!postgresPool) {
    postgresPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  return postgresPool;
}

function isMissingTableError(error: unknown): boolean {
  return error instanceof Error && /ORA-00955|ORA-00942/i.test(error.message);
}

function calculateSummary(state: DashboardState): DashboardData["summary"] {
  return {
    totalCompanies: state.companies.length,
    totalEmployees: state.employees.length,
    activePlans: state.stockPlans.filter((plan) => plan.status === "Active").length,
    annualContribution: state.stockPlans.reduce((total, plan) => total + Number(plan.annualContribution), 0),
    portfolioValue: state.reports.at(-1)?.portfolioValue ?? 0,
    targetValue: state.reports.at(-1)?.targetValue ?? 0,
    riskScore:
      state.reports.length > 0
        ? state.reports.reduce((total, report) => total + Number(report.riskScore), 0) / state.reports.length
        : 0,
  };
}

function buildDashboardData(source: DashboardData["source"], state: DashboardState): DashboardData {
  return {
    source,
    generatedAt: new Date().toISOString(),
    summary: calculateSummary(state),
    companies: structuredClone(state.companies),
    employees: structuredClone(state.employees),
    stockPlans: structuredClone(state.stockPlans),
    reports: structuredClone(state.reports),
  };
}

function getNextId<T>(rows: T[], readId: (row: T) => number): number {
  return rows.reduce((maxValue, row) => Math.max(maxValue, readId(row)), 0) + 1;
}

function upsertDemoCompany(input: CompanyInput): Company {
  const row: Company = {
    companyId: input.companyId ?? getNextId(demoState.companies, (company) => company.companyId),
    companyName: input.companyName,
    ticker: input.ticker,
    sector: input.sector,
    headquarters: input.headquarters,
  };

  const index = demoState.companies.findIndex((company) => company.companyId === row.companyId);
  if (index >= 0) {
    demoState.companies[index] = row;
  } else {
    demoState.companies.push(row);
  }

  return row;
}

function upsertDemoEmployee(input: EmployeeInput): Employee {
  const row: Employee = {
    employeeId: input.employeeId ?? getNextId(demoState.employees, (employee) => employee.employeeId),
    companyId: Number(input.companyId),
    fullName: input.fullName,
    roleTitle: input.roleTitle,
    email: input.email,
    startDate: input.startDate,
    salary: Number(input.salary),
  };

  const index = demoState.employees.findIndex((employee) => employee.employeeId === row.employeeId);
  if (index >= 0) {
    demoState.employees[index] = row;
  } else {
    demoState.employees.push(row);
  }

  return row;
}

function upsertDemoStockPlan(input: StockPlanInput): StockPlan {
  const row: StockPlan = {
    planId: input.planId ?? getNextId(demoState.stockPlans, (plan) => plan.planId),
    companyId: Number(input.companyId),
    planName: input.planName,
    planType: input.planType,
    annualContribution: Number(input.annualContribution),
    vestedPct: Number(input.vestedPct),
    status: input.status,
  };

  const index = demoState.stockPlans.findIndex((plan) => plan.planId === row.planId);
  if (index >= 0) {
    demoState.stockPlans[index] = row;
  } else {
    demoState.stockPlans.push(row);
  }

  return row;
}

async function createIfMissing(connection: Connection, ddl: string): Promise<void> {
  try {
    await connection.execute(ddl);
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }
}

async function ensureOracleSchema(connection: Connection): Promise<void> {
  await createIfMissing(
    connection,
    `CREATE TABLE companies (
      company_id NUMBER PRIMARY KEY,
      company_name VARCHAR2(120) NOT NULL UNIQUE,
      ticker VARCHAR2(12) NOT NULL,
      sector VARCHAR2(80) NOT NULL,
      headquarters VARCHAR2(120) NOT NULL
    )`,
  );

  await createIfMissing(
    connection,
    `CREATE TABLE employees (
      employee_id NUMBER PRIMARY KEY,
      company_id NUMBER NOT NULL,
      full_name VARCHAR2(120) NOT NULL,
      role_title VARCHAR2(120) NOT NULL,
      email VARCHAR2(160) NOT NULL UNIQUE,
      start_date DATE NOT NULL,
      salary NUMBER(12, 2) NOT NULL,
      CONSTRAINT employees_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
    )`,
  );

  await createIfMissing(
    connection,
    `CREATE TABLE stock_plans (
      plan_id NUMBER PRIMARY KEY,
      company_id NUMBER NOT NULL,
      plan_name VARCHAR2(160) NOT NULL,
      plan_type VARCHAR2(60) NOT NULL,
      annual_contribution NUMBER(12, 2) NOT NULL,
      vested_pct NUMBER(5, 2) NOT NULL,
      status VARCHAR2(24) NOT NULL,
      CONSTRAINT stock_plans_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
    )`,
  );

  await createIfMissing(
    connection,
    `CREATE TABLE financial_reports (
      report_id NUMBER PRIMARY KEY,
      company_id NUMBER NOT NULL,
      report_date DATE NOT NULL,
      portfolio_value NUMBER(14, 2) NOT NULL,
      target_value NUMBER(14, 2) NOT NULL,
      risk_score NUMBER(4, 2) NOT NULL,
      commentary VARCHAR2(400) NOT NULL,
      CONSTRAINT financial_reports_company_fk FOREIGN KEY (company_id) REFERENCES companies(company_id)
    )`,
  );
}

async function mergeCompanyOracle(connection: Connection, row: Company): Promise<void> {
  await connection.execute(
    `MERGE INTO companies target
     USING (SELECT :companyId AS company_id, :companyName AS company_name, :ticker AS ticker, :sector AS sector, :headquarters AS headquarters FROM dual) source
     ON (target.company_id = source.company_id)
     WHEN MATCHED THEN UPDATE SET
       target.company_name = source.company_name,
       target.ticker = source.ticker,
       target.sector = source.sector,
       target.headquarters = source.headquarters
     WHEN NOT MATCHED THEN INSERT (company_id, company_name, ticker, sector, headquarters)
       VALUES (source.company_id, source.company_name, source.ticker, source.sector, source.headquarters)`,
    {
      companyId: row.companyId,
      companyName: row.companyName,
      ticker: row.ticker,
      sector: row.sector,
      headquarters: row.headquarters,
    },
  );
}

async function mergeEmployeeOracle(connection: Connection, row: Employee): Promise<void> {
  await connection.execute(
    `MERGE INTO employees target
     USING (
       SELECT :employeeId AS employee_id, :companyId AS company_id, :fullName AS full_name, :roleTitle AS role_title, :email AS email, :startDate AS start_date, :salary AS salary FROM dual
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
       VALUES (source.employee_id, source.company_id, source.full_name, source.role_title, source.email, source.start_date, source.salary)`,
    {
      employeeId: row.employeeId,
      companyId: row.companyId,
      fullName: row.fullName,
      roleTitle: row.roleTitle,
      email: row.email,
      startDate: new Date(row.startDate),
      salary: row.salary,
    },
  );
}

async function mergePlanOracle(connection: Connection, row: StockPlan): Promise<void> {
  await connection.execute(
    `MERGE INTO stock_plans target
     USING (
       SELECT :planId AS plan_id, :companyId AS company_id, :planName AS plan_name, :planType AS plan_type, :annualContribution AS annual_contribution, :vestedPct AS vested_pct, :status AS status FROM dual
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
       VALUES (source.plan_id, source.company_id, source.plan_name, source.plan_type, source.annual_contribution, source.vested_pct, source.status)`,
    {
      planId: row.planId,
      companyId: row.companyId,
      planName: row.planName,
      planType: row.planType,
      annualContribution: row.annualContribution,
      vestedPct: row.vestedPct,
      status: row.status,
    },
  );
}

async function mergeReportOracle(connection: Connection, row: FinancialReport): Promise<void> {
  await connection.execute(
    `MERGE INTO financial_reports target
     USING (
       SELECT :reportId AS report_id, :companyId AS company_id, :reportDate AS report_date, :portfolioValue AS portfolio_value, :targetValue AS target_value, :riskScore AS risk_score, :commentary AS commentary FROM dual
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
       VALUES (source.report_id, source.company_id, source.report_date, source.portfolio_value, source.target_value, source.risk_score, source.commentary)`,
    {
      reportId: row.reportId,
      companyId: row.companyId,
      reportDate: new Date(row.reportDate),
      portfolioValue: row.portfolioValue,
      targetValue: row.targetValue,
      riskScore: row.riskScore,
      commentary: row.commentary,
    },
  );
}

async function seedDemoRowsOracle(connection: Connection): Promise<void> {
  const result = await connection.execute<{ TOTAL: number }>("SELECT COUNT(*) AS TOTAL FROM companies", [], {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
  });

  const count = Number(result.rows?.[0]?.TOTAL ?? 0);
  if (count > 0) {
    return;
  }

  for (const row of seedState.companies) {
    await mergeCompanyOracle(connection, row);
  }

  for (const row of seedState.employees) {
    await mergeEmployeeOracle(connection, row);
  }

  for (const row of seedState.stockPlans) {
    await mergePlanOracle(connection, row);
  }

  for (const row of seedState.reports) {
    await mergeReportOracle(connection, row);
  }

  await connection.commit();
}

async function queryRowsOracle<T extends Record<string, unknown>>(connection: Connection, sql: string): Promise<T[]> {
  const result = await connection.execute<T>(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return (result.rows ?? []) as T[];
}

async function queryNextIdOracle(connection: Connection, tableName: string, columnName: string): Promise<number> {
  const result = await connection.execute<{ NEXT_ID: number }>(
    `SELECT NVL(MAX(${columnName}), 0) + 1 AS NEXT_ID FROM ${tableName}`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT },
  );

  return Number(result.rows?.[0]?.NEXT_ID ?? 1);
}

async function getOracleState(connection: Connection): Promise<DashboardState> {
  const companies = await queryRowsOracle<Company>(
    connection,
    `SELECT company_id AS "companyId", company_name AS "companyName", ticker AS "ticker", sector AS "sector", headquarters AS "headquarters" FROM companies ORDER BY company_id`,
  );
  const employees = await queryRowsOracle<Employee>(
    connection,
    `SELECT employee_id AS "employeeId", company_id AS "companyId", full_name AS "fullName", role_title AS "roleTitle", email AS "email", TO_CHAR(start_date, 'YYYY-MM-DD') AS "startDate", salary AS "salary" FROM employees ORDER BY employee_id`,
  );
  const stockPlans = await queryRowsOracle<StockPlan>(
    connection,
    `SELECT plan_id AS "planId", company_id AS "companyId", plan_name AS "planName", plan_type AS "planType", annual_contribution AS "annualContribution", vested_pct AS "vestedPct", status AS "status" FROM stock_plans ORDER BY plan_id`,
  );
  const reports = await queryRowsOracle<FinancialReport>(
    connection,
    `SELECT report_id AS "reportId", company_id AS "companyId", TO_CHAR(report_date, 'YYYY-MM-DD') AS "reportDate", portfolio_value AS "portfolioValue", target_value AS "targetValue", risk_score AS "riskScore", commentary AS "commentary" FROM financial_reports ORDER BY report_id`,
  );

  return { companies, employees, stockPlans, reports };
}

async function withOracleConnection<T>(work: (connection: Connection) => Promise<T>): Promise<T> {
  const config = getOracleConfig();

  if (!config) {
    throw new Error("Oracle configuration is missing.");
  }

  const connection = await oracledb.getConnection(config);

  try {
    await ensureOracleSchema(connection);
    await seedDemoRowsOracle(connection);
    return await work(connection);
  } finally {
    await connection.close();
  }
}

async function ensurePostgresSchema(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS companies (
      company_id INTEGER PRIMARY KEY,
      company_name VARCHAR(120) NOT NULL UNIQUE,
      ticker VARCHAR(12) NOT NULL,
      sector VARCHAR(80) NOT NULL,
      headquarters VARCHAR(120) NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id INTEGER PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(company_id),
      full_name VARCHAR(120) NOT NULL,
      role_title VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      start_date DATE NOT NULL,
      salary NUMERIC(12,2) NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS stock_plans (
      plan_id INTEGER PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(company_id),
      plan_name VARCHAR(160) NOT NULL,
      plan_type VARCHAR(60) NOT NULL,
      annual_contribution NUMERIC(12,2) NOT NULL,
      vested_pct NUMERIC(5,2) NOT NULL,
      status VARCHAR(24) NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS financial_reports (
      report_id INTEGER PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(company_id),
      report_date DATE NOT NULL,
      portfolio_value NUMERIC(14,2) NOT NULL,
      target_value NUMERIC(14,2) NOT NULL,
      risk_score NUMERIC(4,2) NOT NULL,
      commentary VARCHAR(400) NOT NULL
    )
  `);
}

async function mergeCompanyPostgres(client: PoolClient, row: Company): Promise<void> {
  await client.query(
    `INSERT INTO companies (company_id, company_name, ticker, sector, headquarters)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (company_id) DO UPDATE SET
       company_name = EXCLUDED.company_name,
       ticker = EXCLUDED.ticker,
       sector = EXCLUDED.sector,
       headquarters = EXCLUDED.headquarters`,
    [row.companyId, row.companyName, row.ticker, row.sector, row.headquarters],
  );
}

async function mergeEmployeePostgres(client: PoolClient, row: Employee): Promise<void> {
  await client.query(
    `INSERT INTO employees (employee_id, company_id, full_name, role_title, email, start_date, salary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (employee_id) DO UPDATE SET
       company_id = EXCLUDED.company_id,
       full_name = EXCLUDED.full_name,
       role_title = EXCLUDED.role_title,
       email = EXCLUDED.email,
       start_date = EXCLUDED.start_date,
       salary = EXCLUDED.salary`,
    [row.employeeId, row.companyId, row.fullName, row.roleTitle, row.email, row.startDate, row.salary],
  );
}

async function mergePlanPostgres(client: PoolClient, row: StockPlan): Promise<void> {
  await client.query(
    `INSERT INTO stock_plans (plan_id, company_id, plan_name, plan_type, annual_contribution, vested_pct, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (plan_id) DO UPDATE SET
       company_id = EXCLUDED.company_id,
       plan_name = EXCLUDED.plan_name,
       plan_type = EXCLUDED.plan_type,
       annual_contribution = EXCLUDED.annual_contribution,
       vested_pct = EXCLUDED.vested_pct,
       status = EXCLUDED.status`,
    [row.planId, row.companyId, row.planName, row.planType, row.annualContribution, row.vestedPct, row.status],
  );
}

async function mergeReportPostgres(client: PoolClient, row: FinancialReport): Promise<void> {
  await client.query(
    `INSERT INTO financial_reports (report_id, company_id, report_date, portfolio_value, target_value, risk_score, commentary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (report_id) DO UPDATE SET
       company_id = EXCLUDED.company_id,
       report_date = EXCLUDED.report_date,
       portfolio_value = EXCLUDED.portfolio_value,
       target_value = EXCLUDED.target_value,
       risk_score = EXCLUDED.risk_score,
       commentary = EXCLUDED.commentary`,
    [row.reportId, row.companyId, row.reportDate, row.portfolioValue, row.targetValue, row.riskScore, row.commentary],
  );
}

async function seedDemoRowsPostgres(client: PoolClient): Promise<void> {
  const countResult = await client.query<{ total: string }>("SELECT COUNT(*)::text AS total FROM companies");
  const count = Number(countResult.rows[0]?.total ?? 0);

  if (count > 0) {
    return;
  }

  for (const row of seedState.companies) {
    await mergeCompanyPostgres(client, row);
  }

  for (const row of seedState.employees) {
    await mergeEmployeePostgres(client, row);
  }

  for (const row of seedState.stockPlans) {
    await mergePlanPostgres(client, row);
  }

  for (const row of seedState.reports) {
    await mergeReportPostgres(client, row);
  }
}

async function queryNextIdPostgres(client: PoolClient, tableName: string, columnName: string): Promise<number> {
  const result = await client.query<{ next_id: string }>(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS next_id FROM ${tableName}`,
  );

  return Number(result.rows[0]?.next_id ?? 1);
}

async function getPostgresState(client: PoolClient): Promise<DashboardState> {
  const companies = (
    await client.query<Company>(
      'SELECT company_id AS "companyId", company_name AS "companyName", ticker, sector, headquarters FROM companies ORDER BY company_id',
    )
  ).rows;

  const employees = (
    await client.query<Employee>(
      'SELECT employee_id AS "employeeId", company_id AS "companyId", full_name AS "fullName", role_title AS "roleTitle", email, TO_CHAR(start_date, \'YYYY-MM-DD\') AS "startDate", salary::float8 AS salary FROM employees ORDER BY employee_id',
    )
  ).rows;

  const stockPlans = (
    await client.query<StockPlan>(
      'SELECT plan_id AS "planId", company_id AS "companyId", plan_name AS "planName", plan_type AS "planType", annual_contribution::float8 AS "annualContribution", vested_pct::float8 AS "vestedPct", status FROM stock_plans ORDER BY plan_id',
    )
  ).rows;

  const reports = (
    await client.query<FinancialReport>(
      'SELECT report_id AS "reportId", company_id AS "companyId", TO_CHAR(report_date, \'YYYY-MM-DD\') AS "reportDate", portfolio_value::float8 AS "portfolioValue", target_value::float8 AS "targetValue", risk_score::float8 AS "riskScore", commentary FROM financial_reports ORDER BY report_id',
    )
  ).rows;

  return { companies, employees, stockPlans, reports };
}

async function withPostgresClient<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const config = getPostgresConfig();

  if (!config) {
    throw new Error("PostgreSQL configuration is missing.");
  }

  const pool = getPostgresPool(config);
  const client = await pool.connect();

  try {
    await ensurePostgresSchema(client);
    await seedDemoRowsPostgres(client);
    return await work(client);
  } finally {
    client.release();
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const postgresConfig = getPostgresConfig();

  if (postgresConfig) {
    try {
      const state = await withPostgresClient((client) => getPostgresState(client));
      return buildDashboardData("postgres", state);
    } catch {
      // Fall through to Oracle and then demo if PostgreSQL is unreachable.
    }
  }

  const oracleConfig = getOracleConfig();

  if (oracleConfig) {
    try {
      const state = await withOracleConnection((connection) => getOracleState(connection));
      return buildDashboardData("oracle", state);
    } catch {
      return buildDashboardData("demo", demoState);
    }
  }

  return buildDashboardData("demo", demoState);
}

export async function saveCompany(input: CompanyInput): Promise<DashboardData> {
  const postgresConfig = getPostgresConfig();

  if (postgresConfig) {
    try {
      const state = await withPostgresClient(async (client) => {
        await client.query("BEGIN");

        try {
          const companyId = input.companyId ?? (await queryNextIdPostgres(client, "companies", "company_id"));
          await mergeCompanyPostgres(client, {
            companyId,
            companyName: input.companyName,
            ticker: input.ticker,
            sector: input.sector,
            headquarters: input.headquarters,
          });
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }

        return getPostgresState(client);
      });

      return buildDashboardData("postgres", state);
    } catch {
      // Fall through to Oracle before using the in-memory demo fallback.
    }
  }

  const oracleConfig = getOracleConfig();

  if (!oracleConfig) {
    upsertDemoCompany(input);
    return buildDashboardData("demo", demoState);
  }

  try {
    const state = await withOracleConnection(async (connection) => {
      const companyId = input.companyId ?? (await queryNextIdOracle(connection, "companies", "company_id"));

      await mergeCompanyOracle(connection, {
        companyId,
        companyName: input.companyName,
        ticker: input.ticker,
        sector: input.sector,
        headquarters: input.headquarters,
      });
      await connection.commit();
      return getOracleState(connection);
    });

    return buildDashboardData("oracle", state);
  } catch {
    upsertDemoCompany(input);
    return buildDashboardData("demo", demoState);
  }
}

export async function saveEmployee(input: EmployeeInput): Promise<DashboardData> {
  const postgresConfig = getPostgresConfig();

  if (postgresConfig) {
    try {
      const state = await withPostgresClient(async (client) => {
        await client.query("BEGIN");

        try {
          const employeeId = input.employeeId ?? (await queryNextIdPostgres(client, "employees", "employee_id"));
          await mergeEmployeePostgres(client, {
            employeeId,
            companyId: Number(input.companyId),
            fullName: input.fullName,
            roleTitle: input.roleTitle,
            email: input.email,
            startDate: input.startDate,
            salary: Number(input.salary),
          });
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }

        return getPostgresState(client);
      });

      return buildDashboardData("postgres", state);
    } catch {
      // Fall through to Oracle before using the in-memory demo fallback.
    }
  }

  const oracleConfig = getOracleConfig();

  if (!oracleConfig) {
    upsertDemoEmployee(input);
    return buildDashboardData("demo", demoState);
  }

  try {
    const state = await withOracleConnection(async (connection) => {
      const employeeId = input.employeeId ?? (await queryNextIdOracle(connection, "employees", "employee_id"));

      await mergeEmployeeOracle(connection, {
        employeeId,
        companyId: Number(input.companyId),
        fullName: input.fullName,
        roleTitle: input.roleTitle,
        email: input.email,
        startDate: input.startDate,
        salary: Number(input.salary),
      });
      await connection.commit();
      return getOracleState(connection);
    });

    return buildDashboardData("oracle", state);
  } catch {
    upsertDemoEmployee(input);
    return buildDashboardData("demo", demoState);
  }
}

export async function saveStockPlan(input: StockPlanInput): Promise<DashboardData> {
  const postgresConfig = getPostgresConfig();

  if (postgresConfig) {
    try {
      const state = await withPostgresClient(async (client) => {
        await client.query("BEGIN");

        try {
          const planId = input.planId ?? (await queryNextIdPostgres(client, "stock_plans", "plan_id"));
          await mergePlanPostgres(client, {
            planId,
            companyId: Number(input.companyId),
            planName: input.planName,
            planType: input.planType,
            annualContribution: Number(input.annualContribution),
            vestedPct: Number(input.vestedPct),
            status: input.status,
          });
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }

        return getPostgresState(client);
      });

      return buildDashboardData("postgres", state);
    } catch {
      // Fall through to Oracle before using the in-memory demo fallback.
    }
  }

  const oracleConfig = getOracleConfig();

  if (!oracleConfig) {
    upsertDemoStockPlan(input);
    return buildDashboardData("demo", demoState);
  }

  try {
    const state = await withOracleConnection(async (connection) => {
      const planId = input.planId ?? (await queryNextIdOracle(connection, "stock_plans", "plan_id"));

      await mergePlanOracle(connection, {
        planId,
        companyId: Number(input.companyId),
        planName: input.planName,
        planType: input.planType,
        annualContribution: Number(input.annualContribution),
        vestedPct: Number(input.vestedPct),
        status: input.status,
      });
      await connection.commit();
      return getOracleState(connection);
    });

    return buildDashboardData("oracle", state);
  } catch {
    upsertDemoStockPlan(input);
    return buildDashboardData("demo", demoState);
  }
}
