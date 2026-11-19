# RideOps Escalation Gate

A small internal tool for **L1 support agents** at RideOps.

**The problem:** open support tickets keep rising. In Jul–Sep, 52% of the tickets L1 sent to engineering came back unsolved (missing details, config issues, known duplicates, how-to questions), and each round trip added about two days to close time.

**The tool:** before a ticket leaves L1, the agent sees what happened to similar past tickets, ticks a short checklist, and then either solves it or escalates it with a complete note. Every decision is saved, and a Scorecard shows each week whether the open-ticket number is coming down.

## Features
| Where | What it does |
|---|---|
| **Tickets → list** | Tickets waiting on L1, most urgent first. Filter to *Mine* or *Everyone*. |
| **Tickets → step 1** | Advice: *Solve at L1*, *Check first* or *Escalate*, plus the numbers behind it and three real past examples. |
| **Tickets → step 2** | Quick checks (what engineering usually asks for) and a note for engineering. |
| **Tickets → step 3** | *Solved – close ticket* or *Escalate to engineering*. Saved to the database. |
| **New ticket** | Log a ticket in plain words; the category is suggested from similar past tickets. |
| **Scorecard** | Open now, stuck > 3 days, % sent to engineering, % of escalations fixed, a weekly trend, and the decision log. |

## Run it
Requires Node.js 18+ and a [Neon](https://neon.tech) Postgres database.

```bash
npm install
cp .env.example .env        # then paste your Neon connection string into DATABASE_URL
npm run db:push             # creates the tables: tickets, gate_checks
npm run db:seed             # loads data/rideops_support_tickets.csv (1,444 tickets)
npm run dev                 # open http://localhost:3000
```

Deploy: import the repo into Vercel and add `DATABASE_URL` as an environment variable.

## Stack
Next.js 14 (TypeScript) · Tailwind CSS · Neon Postgres · Drizzle ORM. Matching similar tickets uses simple keyword similarity (TF-IDF) written in TypeScript, with no AI service.

## Project layout
```
app/          pages and API routes (routes only parse the request and call a service)
components/   the UI: tickets/, scorecard/, ui/ (shared building blocks)
client/       browser helpers: typed API client, formatting, labels
shared/       types and the handoff-note builder used by both browser and server
server/       config.ts (all rules), services/ (logic), lib/ (helpers), db/ (tables)
scripts/      seed.ts: CSV → database
data/         the case-study CSVs
docs/         DIAGNOSIS.md (what drives the problem), METRICS.md (how success is measured)
NoteBooks/    the exploratory analysis notebook
```

## Assumptions
- The data ends on 30 Sep 2026, so the app treats **1 Oct 2026 as "today"** and moves forward in real time from there (`DEMO_CLOCK` in `server/config.ts`; set `DEMO_CLOCK=off` to use the real date).
- Checklists are drafted from the ticket data, not yet validated with the support and engineering teams.
- No login: the "You are" picker stands in for it.
