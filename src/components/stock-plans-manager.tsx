"use client";

import { useEffect, useState } from "react";
import type { Company, DashboardData, StockPlan } from "@/lib/sample-data";

type StockPlanDraft = {
  planId?: number;
  companyId: number;
  planName: string;
  planType: string;
  annualContribution: number;
  vestedPct: number;
  status: string;
};

const emptyDraft: StockPlanDraft = {
  companyId: 1,
  planName: "",
  planType: "",
  annualContribution: 0,
  vestedPct: 0,
  status: "Active",
};

export function StockPlansManager() {
  const [plans, setPlans] = useState<StockPlan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [draft, setDraft] = useState<StockPlanDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadState();
  }, []);

  async function loadState() {
    setLoading(true);
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const payload = (await response.json()) as DashboardData;
    setPlans(payload.stockPlans);
    setCompanies(payload.companies);
    setDraft((current) => ({ ...current, companyId: payload.companies[0]?.companyId ?? 1 }));
    setLoading(false);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/stock-plans", {
        method: draft.planId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error("Could not save stock plan");
      }

      const payload = (await response.json()) as DashboardData;
      setPlans(payload.stockPlans);
      setCompanies(payload.companies);
      setDraft({ ...emptyDraft, companyId: payload.companies[0]?.companyId ?? 1 });
      setMessage(draft.planId ? "Stock plan updated." : "Stock plan created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Stock plan records</div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-white">Create and edit stock plans</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Manage equity programs, contribution budgets, and vesting status by company.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">{draft.planId ? "Edit stock plan" : "Create stock plan"}</h2>
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
                <span>Plan name</span>
                <input value={draft.planName} onChange={(event) => setDraft((current) => ({ ...current, planName: event.target.value }))} className="input" required />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Plan type</span>
                <input value={draft.planType} onChange={(event) => setDraft((current) => ({ ...current, planType: event.target.value }))} className="input" required />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Annual contribution</span>
                <input type="number" min="0" value={draft.annualContribution} onChange={(event) => setDraft((current) => ({ ...current, annualContribution: Number(event.target.value) }))} className="input" required />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Vested %</span>
                <input type="number" min="0" max="100" value={draft.vestedPct} onChange={(event) => setDraft((current) => ({ ...current, vestedPct: Number(event.target.value) }))} className="input" required />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Status</span>
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} className="input" required>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Planned">Planned</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">{saving ? "Saving..." : draft.planId ? "Update stock plan" : "Create stock plan"}</button>
              <button type="button" onClick={() => setDraft({ ...emptyDraft, companyId: companies[0]?.companyId ?? 1 })} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">Reset</button>
            </div>
          </form>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">Plan catalog</h2>
          <div className="mt-5 space-y-3">{loading ? <div className="text-sm text-slate-400">Loading...</div> : plans.map((plan) => (
            <button key={plan.planId} type="button" onClick={() => setDraft(plan)} className="w-full rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-left transition hover:border-emerald-400/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">{plan.planName}</div>
                  <div className="text-sm text-slate-400">{plan.planType}</div>
                </div>
                <span className="text-xs text-slate-500">ID {plan.planId}</span>
              </div>
              <div className="mt-3 flex justify-between text-sm text-slate-300">
                <span>{plan.status}</span>
                <span>{plan.vestedPct}% vested</span>
              </div>
            </button>
          ))}</div>
        </div>
      </div>
    </section>
  );
}