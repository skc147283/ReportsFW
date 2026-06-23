export type Company = {
  companyId: number;
  companyName: string;
  ticker: string;
  sector: string;
  headquarters: string;
};

export type Employee = {
  employeeId: number;
  companyId: number;
  fullName: string;
  roleTitle: string;
  email: string;
  startDate: string;
  salary: number;
};

export type StockPlan = {
  planId: number;
  companyId: number;
  planName: string;
  planType: string;
  annualContribution: number;
  vestedPct: number;
  status: string;
};

export type FinancialReport = {
  reportId: number;
  companyId: number;
  reportDate: string;
  portfolioValue: number;
  targetValue: number;
  riskScore: number;
  commentary: string;
};

export type DashboardSummary = {
  totalCompanies: number;
  totalEmployees: number;
  activePlans: number;
  annualContribution: number;
  portfolioValue: number;
  targetValue: number;
  riskScore: number;
};

export type DashboardData = {
  source: "oracle" | "postgres" | "demo";
  generatedAt: string;
  summary: DashboardSummary;
  companies: Company[];
  employees: Employee[];
  stockPlans: StockPlan[];
  reports: FinancialReport[];
};

const company: Company = {
  companyId: 1,
  companyName: "Northstar Analytics",
  ticker: "NSA",
  sector: "Financial Technology",
  headquarters: "Boston, MA",
};

const companies: Company[] = [company];

const employees: Employee[] = [
  {
    employeeId: 1,
    companyId: 1,
    fullName: "Ava Thompson",
    roleTitle: "Chief Financial Officer",
    email: "ava.thompson@northstar.example",
    startDate: "2021-02-15",
    salary: 245000,
  },
  {
    employeeId: 2,
    companyId: 1,
    fullName: "Marcus Reed",
    roleTitle: "Equity Plan Manager",
    email: "marcus.reed@northstar.example",
    startDate: "2022-08-08",
    salary: 132000,
  },
  {
    employeeId: 3,
    companyId: 1,
    fullName: "Lina Patel",
    roleTitle: "Data Analyst",
    email: "lina.patel@northstar.example",
    startDate: "2023-04-03",
    salary: 118000,
  },
  {
    employeeId: 4,
    companyId: 1,
    fullName: "Jordan Kim",
    roleTitle: "Finance Operations Lead",
    email: "jordan.kim@northstar.example",
    startDate: "2020-11-19",
    salary: 158000,
  },
  {
    employeeId: 5,
    companyId: 1,
    fullName: "Sofia Alvarez",
    roleTitle: "Investor Relations Analyst",
    email: "sofia.alvarez@northstar.example",
    startDate: "2024-01-22",
    salary: 104000,
  },
];

const stockPlans: StockPlan[] = [
  {
    planId: 1,
    companyId: 1,
    planName: "Executive RSU Growth Plan",
    planType: "RSU",
    annualContribution: 125000,
    vestedPct: 68,
    status: "Active",
  },
  {
    planId: 2,
    companyId: 1,
    planName: "Employee Equity Match",
    planType: "ESPP",
    annualContribution: 52000,
    vestedPct: 42,
    status: "Active",
  },
  {
    planId: 3,
    companyId: 1,
    planName: "Retention Option Pool",
    planType: "Stock Options",
    annualContribution: 38000,
    vestedPct: 54,
    status: "Active",
  },
];

const reports: FinancialReport[] = [
  {
    reportId: 1,
    companyId: 1,
    reportDate: "2026-01-31",
    portfolioValue: 1580000,
    targetValue: 1720000,
    riskScore: 3.4,
    commentary: "Portfolio held steady with disciplined option exercise activity.",
  },
  {
    reportId: 2,
    companyId: 1,
    reportDate: "2026-02-28",
    portfolioValue: 1645000,
    targetValue: 1765000,
    riskScore: 3.2,
    commentary: "Contribution pacing improved after the February grant cycle.",
  },
  {
    reportId: 3,
    companyId: 1,
    reportDate: "2026-03-31",
    portfolioValue: 1728000,
    targetValue: 1820000,
    riskScore: 3.0,
    commentary: "Strong retention metrics and a stable vesting curve.",
  },
  {
    reportId: 4,
    companyId: 1,
    reportDate: "2026-04-30",
    portfolioValue: 1842000,
    targetValue: 1900000,
    riskScore: 2.8,
    commentary: "Quarter-end report shows the portfolio closing in on target.",
  },
];

export const demoDashboardData: DashboardData = {
  source: "demo",
  generatedAt: "2026-05-20T09:00:00.000Z",
  summary: {
    totalCompanies: companies.length,
    totalEmployees: employees.length,
    activePlans: stockPlans.length,
    annualContribution: stockPlans.reduce((total, plan) => total + plan.annualContribution, 0),
    portfolioValue: reports[reports.length - 1]?.portfolioValue ?? 0,
    targetValue: reports[reports.length - 1]?.targetValue ?? 0,
    riskScore: reports.reduce((total, report) => total + report.riskScore, 0) / reports.length,
  },
  companies,
  employees,
  stockPlans,
  reports,
};
