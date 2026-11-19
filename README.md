# RideOps Escalation Gate (v0)

A tool for L1 support agents. Before escalating a ticket to engineering, the agent sees what usually happened to similar tickets, completes a short checklist, and gets a ready handoff note. The aim is fewer avoidable escalations, so tickets stop bouncing between L1 and engineering.
Why this target: `docs/DIAGNOSIS.md`. How success is measured: `docs/METRICS.md`.

## Stack
Next.js 14 (App Router, TypeScript), Next.js API route handlers, Neon Postgres, Drizzle ORM. No custom server, so it deploys to Vercel as is.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env`, set `DATABASE_URL` (Neon connection string).
3. `npm run db:push` creates the `tickets` table from `server/db/schema.ts`.
4. `npm run db:seed` loads `data/rideops_support_tickets.csv`. Safe to re-run (existing ids are skipped).
5. `npm run dev`, open http://localhost:3000

## Deploy to Vercel
1. Run steps 3 and 4 above once against the Neon database you will use in production.
2. Push the repo to GitHub, import it in Vercel (framework: Next.js, no build settings to change).
3. Add the environment variable `DATABASE_URL` in the Vercel project settings, then deploy.

## Folder map
```
app/
  page.tsx            The whole UI (one client component). Change screens here.
  layout.tsx, globals.css
  api/
    catalog/route.ts  GET  dropdown data
    gate/route.ts     POST verdict for a ticket type
    handoff/route.ts  POST handoff note text
    metrics/route.ts  GET  weekly scorecard and backlog
server/
  config.ts           RULES YOU EDIT: thresholds, avoidable outcomes, checklists
  services/gate.ts    Verdict logic and handoff note format
  services/metrics.ts Weekly metric definitions
  services/tickets.ts Loads tickets from Neon (60s cache)
  db/schema.ts        Drizzle table (matches the CSV)
  db/client.ts        Neon connection
scripts/seed.ts       CSV -> Neon
data/                 Source CSVs
docs/                 DIAGNOSIS.md, METRICS.md
```
Route files only read the request and call a service. Keep them thin, put logic in `server/services`.

## How it works
1. Page loads: `GET /api/catalog` fills the dropdowns, `GET /api/metrics` fills the scorecard.
2. "Check this ticket": `POST /api/gate`. `assess()` in `gate.ts` takes past tickets with the same category and description (or the whole category if fewer than `MIN_SAMPLE`). It calculates the escalation rate, outcome counts, share fixed by engineering and median hours to close. Then:
   - no past escalations or too few tickets: **Resolve at L1**
   - fixed share at or above `FIXED_RATE_TO_ESCALATE`: **Escalate**
   - otherwise: **Finish the checklist first**, quoting the share of avoidable outcomes
   - if `KNOWN_ISSUE_HINT_AT` or more past escalations were duplicates of a known issue, a hint says to check the known-issue list
3. The agent ticks the checklist (from `CHECKLISTS` for that category) and enters details. `POST /api/handoff` formats the note.

## How to change things
| I want to... | Edit |
|---|---|
| Change when we say escalate vs checklist | `FIXED_RATE_TO_ESCALATE` in `server/config.ts` |
| Change which outcomes count as avoidable | `AVOIDABLE` in `server/config.ts` (must match `eng_outcome` text in the CSV) |
| Edit or add checklist items | `CHECKLISTS` in `server/config.ts` (keys must match category names exactly) |
| Change the handoff note layout | `buildHandoff` in `server/services/gate.ts` |
| Change or add a weekly metric | `metrics` in `server/services/metrics.ts`, then the table in `app/page.tsx` |
| Add a column to tickets | `server/db/schema.ts`, `npm run db:push`, update `scripts/seed.ts` |
| Add an endpoint | new `app/api/<name>/route.ts` calling a service |
| Show different data on screen | `app/page.tsx` |

## Assumptions and limits
- Checklists are my own drafts from the ticket descriptions, not validated with L1 or engineering.
- The verdict uses historical outcomes only, not free-text matching.
- Read-only for tickets: it does not yet save new tickets or log what the agent did.
- No auth, no tests. Not yet run against a live Neon database.
- Metrics treat 30 Sep 2026 23:59 IST as "now" (`NOW` in `metrics.ts`). Change it to `new Date()` for live data.
