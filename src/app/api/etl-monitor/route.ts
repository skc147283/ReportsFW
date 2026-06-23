import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type ProfileConfig = {
  name: string;
  source_url: string;
  target_db_path: string;
  export_dir: string;
  expected_source?: string;
  enforce_source_guard?: boolean;
};

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

export const dynamic = "force-dynamic";

async function pathExists(absPath: string): Promise<boolean> {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(absPath: string): Promise<T> {
  const raw = await fs.readFile(absPath, "utf-8");
  return JSON.parse(raw) as T;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

async function buildProfileStatus(config: ProfileConfig): Promise<ProfileStatus> {
  const root = process.cwd();
  const dbPath = path.resolve(root, config.target_db_path);
  const exportDir = path.resolve(root, config.export_dir);
  const reportsFile = path.join(exportDir, "reports_target.json");

  const phases: Phase[] = [];

  const sourceGuardOk = !config.enforce_source_guard || (config.expected_source ?? "") === "oracle";
  phases.push({
    name: "Source Guard",
    status: sourceGuardOk ? "ok" : "warn",
    detail: sourceGuardOk
      ? `expected=${config.expected_source ?? "n/a"}`
      : "Guard enabled but expected_source is not oracle",
  });

  const dbExists = await pathExists(dbPath);
  phases.push({
    name: "Load",
    status: dbExists ? "ok" : "warn",
    detail: dbExists ? "Target DB found" : "Target DB missing",
  });

  const extractExists = await pathExists(reportsFile);
  let rowCount = 0;
  let lastRunAt: string | null = null;

  if (extractExists) {
    try {
      const rows = await readJsonFile<unknown[]>(reportsFile);
      rowCount = Array.isArray(rows) ? rows.length : 0;
      const stat = await fs.stat(reportsFile);
      lastRunAt = toIso(stat.mtimeMs);
      phases.push({
        name: "Extract/Transform",
        status: "ok",
        detail: `reports_target.json rows=${rowCount}`,
      });
    } catch {
      phases.push({
        name: "Extract/Transform",
        status: "fail",
        detail: "reports_target.json unreadable",
      });
    }
  } else {
    phases.push({
      name: "Extract/Transform",
      status: "warn",
      detail: "reports_target.json missing",
    });
  }

  const healthy = phases.every((phase) => phase.status === "ok");

  return {
    profile: config.name,
    sourceUrl: config.source_url,
    targetDbPath: config.target_db_path,
    exportDir: config.export_dir,
    phases,
    rowCount,
    lastRunAt,
    healthy,
  };
}

export async function GET() {
  try {
    const root = process.cwd();
    const profilesDir = path.resolve(root, "etl/profiles");
    const profileFiles = ["int.json", "uat.json"];

    const statuses: ProfileStatus[] = [];
    for (const fileName of profileFiles) {
      const config = await readJsonFile<ProfileConfig>(path.join(profilesDir, fileName));
      statuses.push(await buildProfileStatus(config));
    }

    const now = new Date().toISOString();
    return NextResponse.json({
      generatedAt: now,
      overallHealthy: statuses.every((s) => s.healthy),
      profiles: statuses,
      suggestedSchedules: [
        {
          name: "Morning cycle",
          cron: "0 7 * * *",
          command: "python3 -m etl.int_uat_reconcile --mode incremental",
        },
        {
          name: "Night cycle",
          cron: "0 19 * * *",
          command: "python3 -m etl.int_uat_reconcile --mode incremental",
        },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
