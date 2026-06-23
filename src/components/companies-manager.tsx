"use client";

import { useEffect, useState } from "react";
import type { Company, DashboardData } from "@/lib/sample-data";

type CompanyDraft = {
  companyId?: number;
  companyName: string;
  ticker: string;
  sector: string;
  headquarters: string;
};

const emptyDraft: CompanyDraft = {
  companyName: "",
  ticker: "",
  sector: "",
  headquarters: "",
};

export function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [draft, setDraft] = useState<CompanyDraft>(emptyDraft);
  const [quickDraft, setQuickDraft] = useState<CompanyDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quickMessage, setQuickMessage] = useState<string | null>(null);

  async function loadCompanies() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const payload = (await response.json()) as DashboardData;
      setCompanies(payload.companies);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCompanies();
  }, []);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/companies", {
        method: draft.companyId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error("Could not save company");
      }

      const payload = (await response.json()) as DashboardData;
      setCompanies(payload.companies);
      setDraft(emptyDraft);
      setMessage(draft.companyId ? "Company updated." : "Company created.");
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
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickDraft),
      });

      if (!response.ok) {
        throw new Error("Could not save company");
      }

      const payload = (await response.json()) as DashboardData;
      setCompanies(payload.companies);
      setQuickDraft(emptyDraft);
      setQuickMessage("Company created and stored.");
    } catch (error) {
      setQuickMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setQuickSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageIntro
        eyebrow="Company records"
        title="Create and edit companies"
        description="Maintain the legal entities that own each equity plan and reporting series."
      />

      <QuickCreateCard title="Quick create company" description="Add a company in one compact step." message={quickMessage}>
        <form className="grid gap-4" onSubmit={submitQuickCreate}>
          <Field label="Company name">
            <input
              title="Company name"
              placeholder="Northstar Analytics"
              value={quickDraft.companyName}
              onChange={(event) => setQuickDraft((current) => ({ ...current, companyName: event.target.value }))}
              className="input"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ticker">
              <input
                title="Ticker"
                placeholder="NSA"
                value={quickDraft.ticker}
                onChange={(event) => setQuickDraft((current) => ({ ...current, ticker: event.target.value.toUpperCase() }))}
                className="input"
                required
                maxLength={12}
              />
            </Field>
            <Field label="Sector">
              <input
                title="Sector"
                placeholder="Financial Technology"
                value={quickDraft.sector}
                onChange={(event) => setQuickDraft((current) => ({ ...current, sector: event.target.value }))}
                className="input"
                required
              />
            </Field>
          </div>
          <Field label="Headquarters">
            <input
              title="Headquarters"
              placeholder="Boston, MA"
              value={quickDraft.headquarters}
              onChange={(event) => setQuickDraft((current) => ({ ...current, headquarters: event.target.value }))}
              className="input"
              required
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={quickSaving} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
              {quickSaving ? "Saving..." : "Create company"}
            </button>
            <button type="button" onClick={() => setQuickDraft(emptyDraft)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
              Reset
            </button>
          </div>
        </form>
      </QuickCreateCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <EntityFormCard title={draft.companyId ? "Edit company" : "Create company"} message={message}>
          <form className="grid gap-4" onSubmit={submitForm}>
            <Field label="Company name">
              <input title="Company name" placeholder="Northstar Analytics" value={draft.companyName} onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))} className="input" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ticker">
                <input title="Ticker" placeholder="NSA" value={draft.ticker} onChange={(event) => setDraft((current) => ({ ...current, ticker: event.target.value.toUpperCase() }))} className="input" required maxLength={12} />
              </Field>
              <Field label="Sector">
                <input title="Sector" placeholder="Financial Technology" value={draft.sector} onChange={(event) => setDraft((current) => ({ ...current, sector: event.target.value }))} className="input" required />
              </Field>
            </div>
            <Field label="Headquarters">
              <input title="Headquarters" placeholder="Boston, MA" value={draft.headquarters} onChange={(event) => setDraft((current) => ({ ...current, headquarters: event.target.value }))} className="input" required />
            </Field>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                {saving ? "Saving..." : draft.companyId ? "Update company" : "Create company"}
              </button>
              <button type="button" onClick={() => setDraft(emptyDraft)} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                Reset
              </button>
            </div>
          </form>
        </EntityFormCard>

        <EntityListCard title="Existing companies" loading={loading}>
          {companies.map((company) => (
            <button
              key={company.companyId}
              type="button"
              onClick={() => setDraft(company)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-left transition hover:border-emerald-400/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">{company.companyName}</div>
                  <div className="text-sm text-slate-400">{company.ticker} • {company.sector}</div>
                </div>
                <span className="text-xs text-slate-500">ID {company.companyId}</span>
              </div>
              <div className="mt-3 text-sm text-slate-300">{company.headquarters}</div>
            </button>
          ))}
        </EntityListCard>
      </div>
    </section>
  );
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">{eyebrow}</div>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-white">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function EntityFormCard({ title, children, message }: { title: string; children: React.ReactNode; message: string | null }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">{title}</h2>
      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function EntityListCard({ title, children, loading }: { title: string; children: React.ReactNode; loading: boolean }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/25">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-5 space-y-3">{loading ? <div className="text-sm text-slate-400">Loading...</div> : children}</div>
    </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}