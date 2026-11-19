# Success measure

## The one number
**Open tickets stuck for more than 3 days (72h).** Leadership tracks open tickets; the ones that pile up are the slow tail, mostly tickets bouncing between L1 and engineering. Baseline on 30 Sep 2026: **25 of 48** open tickets.

## Weekly scorecard (the app's Scorecard tab)
| Number | Definition | Baseline | Good direction |
|---|---|---|---|
| Open tickets right now | Tickets with no `final_closed_at` | 48 | Down |
| Stuck for over 3 days | Open tickets older than 72h | 25 | Down |
| Sent to engineering | Escalated ÷ created, for tickets created in the last full week | 34% (Jul–Sep) | Down |
| Escalations engineering fixed | "Fixed" ÷ escalations with an outcome, same week | 43% (Jul–Sep) | Up |
| Open tickets at the end of each week | Created before week end and not closed by then | 11 (early Jul) → 43 (late Sep) | Down |

Weeks run Monday to Sunday in IST. Weekly rates use the week the ticket was *created*, so the latest week can still change as its tickets close.

## Is the tool being used? (decision log)
Every Solved / Escalate saved in the app writes a row to `gate_checks`. The Scorecard shows how many decisions were made, how many were solved at L1, and how often the agent followed the gate's advice. This moves the same day, while "escalations fixed" only moves when engineering finishes the work.

## Guardrail (tracked in data, not on screen in v0)
Reopen rate (baseline 10.5%). Closing faster must not mean closing badly.

## Where it is computed
`server/services/scorecard.ts` (`GET /api/scorecard`).
