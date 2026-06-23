# ReportsFW — Deployment & Future Plan

## 1. Deploy Next.js app (free)
- Platform: **Vercel** (zero config for Next.js)
- Steps:
  ```bash
  npm i -g vercel
  vercel --prod
  ```
- Add deployed URL to GitHub → Settings → About → Website

## 2. Oracle (local Mac) → Internet access
- **Option A**: Use ngrok to tunnel local app publicly
  ```bash
  brew install ngrok
  ngrok http 3000
  ```
- **Option B** (recommended): Keep Oracle local for real ETL cron jobs; deployed app uses cloud DB for demo

## 3. Free Cloud Databases (replace Oracle for demo)

| DB | Free Tier | Notes |
|---|---|---|
| Neon (Postgres) | 0.5 GB | Best fit — app already supports Postgres |
| Supabase (Postgres) | 500 MB | Has REST API |
| Turso (SQLite) | 500 DBs | Matches ETL SQLite target |
| Aiven (Postgres) | 1 free service | Production-grade |

## 4. Recommended next steps
1. Create Neon Postgres DB at https://neon.tech
2. Add to `.env.local`:
   ```
   DATABASE_URL=postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require
   ```
3. Add same env var in Vercel dashboard
4. Deploy to Vercel — app auto-uses Postgres (already wired in `src/lib/oracle.ts`)
5. Oracle stays local; cron jobs run ETL locally twice daily

## 5. GitHub Actions (already live)
- URL: https://github.com/skc147283/ReportsFW/actions
- Runs daily at 07:00 UTC (morning) and 19:00 UTC (night)
- Can be triggered manually via "Run workflow"

## 6. Architecture summary
```
Local Mac            Cloud
─────────────        ──────────────────
Oracle DB ──ETL──>   SQLite extracts
cron (7AM/7PM)       Vercel app ──> Neon Postgres (demo data)
                     GitHub Actions (seed tests + ETL CI)
```
