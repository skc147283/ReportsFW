"use client";

import { useEffect, useMemo, useState } from "react";

type Phase = {
  name: string;
  status: "ok" | "warn" | "fail";
  detail: string;
};

type ProfileStatus = {
  profile: string;
  sourceUrl: string;
  targetDbPath: string;
  exportDir: string;
  phases: Phase[];
  rowCount: number;
  lastRunAt: string | null;
  healthy: boolean;
};

type MonitorResponse = {
  generatedAt: string;
  overallHealthy: boolean;
  profiles: ProfileStatus[];
  suggestedSchedules: Array<{ name: string; cron: string; command: string }>;
};

const BADGE = {
  ok: "bg-emerald-400/20 text-emerald-200 border-emerald-300/40",
  warn: "bg-amber-400/20 text-amber-200 border-amber-300/40",
  fail: "bg-rose-400/20 text-rose-200 border-rose-300/40",
} as const;

export function EtlMonitorClient() {
  const [data, setData] = useState<MonitorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetch("/api/etl-monitor", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`monitor failed (${res.status})`);
        }
        const next = (await res.json()) as MonitorResponse;
        if (alive) {
          setData(next);
          setError(null);
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "unknown error");
        }
      }
    };

    void load();
    const id = window.setInterval(load, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const statusText = useMemo(() => {
    if (!data) {
      return "Loading";
    }
    return data.overallHealthy ? "Healthy" : "Needs attention";
  }, [data]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-white">ETL Live Monitor</h1>
          <span
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
              data?.overallHealthy
                ? "border-emerald-300/40 bg-emerald-400/20 text-emerald-200"
                : "border-amber-300/40 bg-amber-400/20 text-amber-200"
            }`}
          >
            {statusText}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300">Auto-refresh every 5s. {error ? `Error: ${error}` : ""}</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {data?.profiles.map((profile) => (
          <article key={profile.profile} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">{profile.profile}</h2>
            <p className="mt-1 text-xs text-slate-400">{profile.sourceUrl}</p>
            <p className="text-xs text-slate-400">Rows: {profile.rowCount}</p>
            <p className="text-xs text-slate-400">
              Last extract: {profile.lastRunAt ? new Date(profile.lastRunAt).toLocaleString() : "n/a"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.phases.map((phase) => (
                <span key={`${profile.profile}-${phase.name}`} className={`rounded-full border px-2 py-1 text-xs ${BADGE[phase.status]}`}>
                  {phase.name}: {phase.detail}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Suggested Daily Jobs</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-200">
          {data?.suggestedSchedules.map((job) => (
            <div key={job.name} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <p className="font-medium text-white">{job.name}</p>
              <p>Cron: {job.cron}</p>
              <p>Command: {job.command}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
