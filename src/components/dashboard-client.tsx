"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DashboardData, FinancialReport } from "@/lib/sample-data";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return dateFormatter.format(parsed);
}

function formatCurrency(value: number): string {
  return currency.format(value);
}

function getProgress(current: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((current / target) * 100));
}

function toPoints(reports: FinancialReport[], key: "portfolioValue" | "targetValue"): string {
  if (reports.length === 0) {
    return "";
  }

  const maxValue = Math.max(...reports.map((report) => Number(report[key])), 1);

  return reports
    .map((report, index) => {
      const x = reports.length === 1 ? 50 : (index / (reports.length - 1)) * 100;
      const y = 100 - (Number(report[key]) / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

type CompanyDraft = {
  companyName: string;
  ticker: string;
  sector: string;
  headquarters: string;
};

type EmployeeDraft = {
  companyId: number;
  fullName: string;
  roleTitle: string;
  email: string;
  startDate: string;
  salary: number;
};

const emptyCompanyDraft: CompanyDraft = {
  companyName: "",
  ticker: "",
  sector: "",
  headquarters: "",
};

const emptyEmployeeDraft: EmployeeDraft = {
  companyId: 1,
  fullName: "",
  roleTitle: "",
  email: "",
  startDate: new Date().toISOString().slice(0, 10),
  salary: 0,
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchText, setSearchText] = useState("");
  const [companyDraft, setCompanyDraft] = useState<CompanyDraft>(emptyCompanyDraft);
  const [employeeDraft, setEmployeeDraft] = useState<EmployeeDraft>(emptyEmployeeDraft);
  const [savingEntity, setSavingEntity] = useState<"company" | "employee" | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as DashboardData;
      setData(payload);
      setEmployeeDraft((current) => ({
        ...current,
        companyId: payload.companies[0]?.companyId ?? current.companyId,
      }));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function submitCompanyForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingEntity("company");
    setActionMessage(null);

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyDraft),
      });

      if (!response.ok) {
        throw new Error("Could not save company");
      }

      const payload = (await response.json()) as DashboardData;
      setData(payload);
      setCompanyDraft(emptyCompanyDraft);
      setEmployeeDraft((current) => ({
        ...current,
        companyId: payload.companies.at(-1)?.companyId ?? current.companyId,
      }));
      setActionMessage("Company created and dashboard refreshed.");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unknown error";
      setActionMessage(message);
    } finally {
      setSavingEntity(null);
    }
  }

  async function submitEmployeeForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingEntity("employee");
    setActionMessage(null);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeDraft),
      });

      if (!response.ok) {
        throw new Error("Could not save employee");
      }

      const payload = (await response.json()) as DashboardData;
      setData(payload);
      setEmployeeDraft((current) => ({
        ...emptyEmployeeDraft,
        companyId: current.companyId,
      }));
      setActionMessage("Employee created and dashboard refreshed.");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unknown error";
      setActionMessage(message);
    } finally {
      setSavingEntity(null);
    }
  }

  const filteredReports = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.reports.filter((report) => {
      const riskMatches =
        riskFilter === "all"
          ? true
          : riskFilter === "low"
            ? report.riskScore < 3
            : riskFilter === "medium"
              ? report.riskScore >= 3 && report.riskScore < 3.5
              : report.riskScore >= 3.5;

      const query = searchText.trim().toLowerCase();
      const textMatches =
        query.length === 0 ||
        report.commentary.toLowerCase().includes(query) ||
        formatDate(report.reportDate).toLowerCase().includes(query);

      return riskMatches && textMatches;
    });
  }, [data, riskFilter, searchText]);

  const chartReports = filteredReports.length > 0 ? filteredReports : data?.reports ?? [];
  const portfolioPoints = toPoints(chartReports, "portfolioValue");
  const targetPoints = toPoints(chartReports, "targetValue");
  const summary = data?.summary;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(11,18,32,0.94),rgba(11,18,32,0.78))] p-6 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(77,214,168,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(242,169,107,0.16),transparent_32%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
              Financial stock plan dashboard
            </div>
            <div className="space-y-3">
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Monitor company equity plans with live API data and database-backed storage.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Track portfolio value, target coverage, plan contributions, and employee assignments from a compact dashboard built for finance teams.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Refresh dashboard
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {loading
                ? "Loading data..."
                : data?.source === "postgres"
                  ? "PostgreSQL connected"
                  : data?.source === "oracle"
                    ? "Oracle connected"
                    : "Demo data fallback"}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4 text-rose-100">
          Could not load the API response: {error}
        </section>
      ) : null}

      {loading && !data ? (
        <section className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          ))}
        </section>
      ) : null}

      {summary && data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Companies" value={summary.totalCompanies.toString()} detail="Tracked legal entities" />
            <MetricCard label="Employees" value={summary.totalEmployees.toString()} detail="Roster assigned to plans" />
            <MetricCard label="Active plans" value={summary.activePlans.toString()} detail="Programs currently in motion" />
            <MetricCard label="Annual contribution" value={formatCurrency(summary.annualContribution)} detail="Current plan funding total" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <QuickCreateCard
              title="Quick create company"
              description="Add a new issuer record without leaving the dashboard."
              message={actionMessage}
            >
              <form className="grid gap-4" onSubmit={submitCompanyForm}>
                <Field label="Company name">
                  <input
                    title="Company name"
                    value={companyDraft.companyName}
                    onChange={(event) => setCompanyDraft((current) => ({ ...current, companyName: event.target.value }))}
                    className="input"
                    placeholder="Northstar Analytics"
                    required
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ticker">
                    <input
                      title="Ticker"
                      value={companyDraft.ticker}
                      onChange={(event) => setCompanyDraft((current) => ({ ...current, ticker: event.target.value.toUpperCase() }))}
                      className="input"
                      placeholder="NSA"
                      maxLength={12}
                      required
                    />
                  </Field>
                  <Field label="Sector">
                    <input
                      title="Sector"
                      value={companyDraft.sector}
                      onChange={(event) => setCompanyDraft((current) => ({ ...current, sector: event.target.value }))}
                      className="input"
                      placeholder="Financial Technology"
                      required
                    />
                  </Field>
                </div>
                <Field label="Headquarters">
                  <input
                    title="Headquarters"
                    value={companyDraft.headquarters}
                    onChange={(event) => setCompanyDraft((current) => ({ ...current, headquarters: event.target.value }))}
                    className="input"
                    placeholder="Boston, MA"
                    required
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingEntity === "company"}
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEntity === "company" ? "Saving..." : "Create company"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyDraft(emptyCompanyDraft)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400/30"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </QuickCreateCard>

            <QuickCreateCard
              title="Quick create employee"
              description="Assign a person to any loaded company and store the record immediately."
              message={actionMessage}
            >
              <form className="grid gap-4" onSubmit={submitEmployeeForm}>
                <Field label="Company">
                  <select
                    title="Company"
                    value={employeeDraft.companyId}
                    onChange={(event) => setEmployeeDraft((current) => ({ ...current, companyId: Number(event.target.value) }))}
                    className="select"
                    required
                  >
                    {data.companies.map((company) => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.companyName}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name">
                    <input
                      title="Full name"
                      value={employeeDraft.fullName}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, fullName: event.target.value }))}
                      className="input"
                      placeholder="Jordan Hale"
                      required
                    />
                  </Field>
                  <Field label="Role title">
                    <input
                      title="Role title"
                      value={employeeDraft.roleTitle}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, roleTitle: event.target.value }))}
                      className="input"
                      placeholder="Operations Analyst"
                      required
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email">
                    <input
                      title="Email"
                      type="email"
                      value={employeeDraft.email}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, email: event.target.value }))}
                      className="input"
                      placeholder="jordan.hale@example.com"
                      required
                    />
                  </Field>
                  <Field label="Start date">
                    <input
                      title="Start date"
                      type="date"
                      value={employeeDraft.startDate}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, startDate: event.target.value }))}
                      className="input"
                      required
                    />
                  </Field>
                </div>
                <Field label="Salary">
                  <input
                    title="Salary"
                    type="number"
                    min="0"
                    value={employeeDraft.salary}
                    onChange={(event) => setEmployeeDraft((current) => ({ ...current, salary: Number(event.target.value) }))}
                    className="input"
                    placeholder="97000"
                    required
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingEntity === "employee"}
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEntity === "employee" ? "Saving..." : "Create employee"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeDraft((current) => ({ ...emptyEmployeeDraft, companyId: current.companyId }))}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400/30"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </QuickCreateCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Portfolio chart</h2>
                  <p className="text-sm text-slate-400">Filter financial report periods and compare portfolio value against target value.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-300">
                    <span>Risk filter</span>
                    <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)} className="input">
                      <option value="all">All reports</option>
                      <option value="low">Low risk</option>
                      <option value="medium">Medium risk</option>
                      <option value="high">High risk</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-slate-300">
                    <span>Search commentary</span>
                    <input value={searchText} onChange={(event) => setSearchText(event.target.value)} className="input" placeholder="quarter, grant, retention..." />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-4">
                <svg viewBox="0 0 100 100" className="h-72 w-full" aria-label="Portfolio chart">
                  <line x1="0" y1="100" x2="100" y2="100" stroke="#30415d" strokeWidth="1" />
                  <line x1="0" y1="0" x2="0" y2="100" stroke="#30415d" strokeWidth="1" />
                  <polyline fill="none" stroke="#4dd6a8" strokeWidth="3" points={portfolioPoints} />
                  <polyline fill="none" stroke="#f2a96b" strokeWidth="3" points={targetPoints} />
                  {chartReports.map((report, index) => {
                    const x = chartReports.length === 1 ? 50 : (index / (chartReports.length - 1)) * 100;
                    const maxValue = Math.max(...chartReports.map((item) => Math.max(item.portfolioValue, item.targetValue)), 1);
                    const portfolioY = 100 - (report.portfolioValue / maxValue) * 100;
                    const targetY = 100 - (report.targetValue / maxValue) * 100;

                    return (
                      <g key={report.reportId}>
                        <circle cx={x} cy={portfolioY} r="1.8" fill="#4dd6a8" />
                        <circle cx={x} cy={targetY} r="1.8" fill="#f2a96b" />
                      </g>
                    );
                  })}
                </svg>

                <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-300">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-300" />Portfolio</div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-300" />Target</div>
                  <div className="text-slate-400">Showing {chartReports.length} report periods</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Management shortcuts</h2>
                <div className="mt-4 grid gap-3">
                  <Shortcut href="/companies" title="Companies" description="Create or update issuer records." />
                  <Shortcut href="/employees" title="Employees" description="Assign staff and maintain compensation data." />
                  <Shortcut href="/stock-plans" title="Stock plans" description="Manage contributions, vesting, and plan status." />
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Coverage summary</h2>
                <div className="mt-4 space-y-3">
                  {chartReports.map((report) => {
                    const progress = getProgress(report.portfolioValue, report.targetValue);

                    return (
                      <article key={report.reportId} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{formatDate(report.reportDate)}</p>
                            <p className="text-xs text-slate-400">Risk {report.riskScore.toFixed(1)}</p>
                          </div>
                          <div className="text-sm text-slate-300">{progress}%</div>
                        </div>
                        <svg className="mt-3 h-3 w-full overflow-hidden rounded-full" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                          <defs>
                            <linearGradient id={`progress-gradient-${report.reportId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4dd6a8" />
                              <stop offset="100%" stopColor="#62a6ff" />
                            </linearGradient>
                          </defs>
                          <rect x="0" y="0" width="100" height="12" rx="6" fill="#1d2940" />
                          <rect x="0" y="0" width={progress} height="12" rx="6" fill={`url(#progress-gradient-${report.reportId})`} />
                        </svg>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Company snapshot</h2>
                  <p className="text-sm text-slate-400">Issuer, head office, and employee assignment overview.</p>
                </div>
                <div className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  Risk score {summary.riskScore.toFixed(1)}
                </div>
              </div>

              <div className="space-y-3">
                {data.companies.map((company) => {
                  const companyEmployeeCount = data.employees.filter((employee) => employee.companyId === company.companyId).length;

                  return (
                    <div key={company.companyId} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-white">{company.companyName}</p>
                          <p className="text-sm text-slate-400">{company.ticker} • {company.sector}</p>
                        </div>
                        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          {company.headquarters}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-300">{companyEmployeeCount} employees linked</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Stock plan allocations</h2>
                  <p className="text-sm text-slate-400">Stored in Oracle and summarized for the dashboard.</p>
                </div>
                <div className="text-sm text-slate-300">Last sync {new Date(data.generatedAt).toLocaleString()}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.stockPlans.map((plan) => (
                  <article key={plan.planId} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{plan.planName}</p>
                        <p className="text-sm text-slate-400">{plan.planType}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {plan.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>
                        <div className="text-slate-500">Annual contribution</div>
                        <div className="font-semibold text-white">{formatCurrency(plan.annualContribution)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Vested</div>
                        <div className="font-semibold text-white">{plan.vestedPct}%</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/20">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </article>
  );
}

function QuickCreateCard({
  title,
  description,
  message,
  children,
}: {
  title: string;
  description: string;
  message: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Shortcut({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 transition hover:border-emerald-400/30">
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{description}</div>
    </Link>
  );
}