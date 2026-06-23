"use client";

import { useEffect, useState } from "react";
import type { Company, DashboardData, Employee } from "@/lib/sample-data";

type EmployeeDraft = {
  employeeId?: number;
  companyId: number;
  fullName: string;
  roleTitle: string;
  email: string;
  startDate: string;
  salary: number;
};

const emptyDraft: EmployeeDraft = {
  companyId: 1,
  fullName: "",
  roleTitle: "",
  email: "",
  startDate: "",
  salary: 0,
};

export function EmployeesManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [draft, setDraft] = useState<EmployeeDraft>(emptyDraft);
  const [quickDraft, setQuickDraft] = useState<EmployeeDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [quickMessage, setQuickMessage] = useState<string | null>(null);

  async function loadState() {
    setLoading(true);
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const payload = (await response.json()) as DashboardData;
    setEmployees(payload.employees);
    setCompanies(payload.companies);
    setDraft((current) => ({ ...current, companyId: payload.companies[0]?.companyId ?? 1 }));
    setLoading(false);
  }

  useEffect(() => {
    void loadState();
  }, []);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/employees", {
        method: draft.employeeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error("Could not save employee");
      }

      const payload = (await response.json()) as DashboardData;
      setEmployees(payload.employees);
      setCompanies(payload.companies);
      setDraft({ ...emptyDraft, companyId: payload.companies[0]?.companyId ?? 1 });
      setMessage(draft.employeeId ? "Employee updated." : "Employee created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function submitQuickCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuickSaving(true);
    setQuickMessage(null);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickDraft),
      });

      if (!response.ok) {
        throw new Error("Could not save employee");
      }

      const payload = (await response.json()) as DashboardData;
      setEmployees(payload.employees);
      setCompanies(payload.companies);
      setQuickDraft((current) => ({ ...emptyDraft, companyId: current.companyId }));
      setQuickMessage("Employee created and stored.");
    } catch (error) {
      setQuickMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setQuickSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Employee records</div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-white">Create and edit employees</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Assign people to the correct company and keep compensation data ready for financial reporting.</p>
      </div>

      <QuickCreateCard title="Quick create employee" description="Add an employee in one compact step." message={quickMessage}>
        <form className="grid gap-4" onSubmit={submitQuickCreate}>
          <Field label="Company">
            <select
              title="Company"
              value={quickDraft.companyId}
              onChange={(event) => setQuickDraft((current) => ({ ...current, companyId: Number(event.target.value) }))}
              className="input"
              required
            >
              {companies.map((company) => (
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
                value={quickDraft.fullName}
                onChange={(event) => setQuickDraft((current) => ({ ...current, fullName: event.target.value }))}
                className="input"
                placeholder="Jordan Hale"
                required
              />
            </Field>
            <Field label="Role title">
              <input
                title="Role title"
                value={quickDraft.roleTitle}
                onChange={(event) => setQuickDraft((current) => ({ ...current, roleTitle: event.target.value }))}
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
                value={quickDraft.email}
                onChange={(event) => setQuickDraft((current) => ({ ...current, email: event.target.value }))}
                className="input"
                placeholder="jordan.hale@example.com"
                required
              />
            </Field>
            <Field label="Start date">
              <input
                title="Start date"
                type="date"
                value={quickDraft.startDate}
                onChange={(event) => setQuickDraft((current) => ({ ...current, startDate: event.target.value }))}
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
              value={quickDraft.salary}
              onChange={(event) => setQuickDraft((current) => ({ ...current, salary: Number(event.target.value) }))}
              className="input"
              placeholder="97000"
              required
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={quickSaving} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
              {quickSaving ? "Saving..." : "Create employee"}
            </button>
            <button type="button" onClick={() => setQuickDraft((current) => ({ ...emptyDraft, companyId: current.companyId }))} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
              Reset
            </button>
          </div>
        </form>
      </QuickCreateCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">{draft.employeeId ? "Edit employee" : "Create employee"}</h2>
          {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
          <form className="mt-5 grid gap-4" onSubmit={submitForm}>
            <label className="grid gap-2 text-sm text-slate-300">
              <span>Company</span>
              <select value={draft.companyId} onChange={(event) => setDraft((current) => ({ ...current, companyId: Number(event.target.value) }))} className="input" required>
                {companies.map((company) => (
                  <option key={company.companyId} value={company.companyId}>{company.companyName}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Full name</span>
                <input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} className="input" required />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Role title</span>
                <input value={draft.roleTitle} onChange={(event) => setDraft((current) => ({ ...current, roleTitle: event.target.value }))} className="input" required />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Email</span>
                <input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="input" required />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Start date</span>
                <input type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} className="input" required />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-slate-300">
              <span>Salary</span>
              <input type="number" min="0" value={draft.salary} onChange={(event) => setDraft((current) => ({ ...current, salary: Number(event.target.value) }))} className="input" required />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">{saving ? "Saving..." : draft.employeeId ? "Update employee" : "Create employee"}</button>
              <button type="button" onClick={() => setDraft({ ...emptyDraft, companyId: companies[0]?.companyId ?? 1 })} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">Reset</button>
            </div>
          </form>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Employee directory</h2>
          <div className="mt-5 space-y-3">{loading ? <div className="text-sm text-slate-400">Loading...</div> : employees.map((employee) => (
            <button key={employee.employeeId} type="button" onClick={() => setDraft(employee)} className="w-full rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-left transition hover:border-emerald-400/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">{employee.fullName}</div>
                  <div className="text-sm text-slate-400">{employee.roleTitle}</div>
                </div>
                <span className="text-xs text-slate-500">ID {employee.employeeId}</span>
              </div>
              <div className="mt-3 text-sm text-slate-300">{employee.email}</div>
            </button>
          ))}</div>
        </div>
      </div>
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
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}