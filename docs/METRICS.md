# Success measure

Primary: median hours to final close (reopen-adjusted, uses final_closed_at) and open tickets older than 72h.
Supporting:
- Escalation yield = escalations ending "Fixed" / escalations with an outcome. Baseline 43%. Goal: raise it by cutting avoidable escalations.
- Escalation rate. Baseline 34%.
- Reopen rate. Baseline 10.5%. Guards against closing tickets too fast.
Weekly numbers are grouped by the week the ticket was created (IST, Monday start), so recent weeks look better until their tickets close. The page scorecard and GET /api/metrics use these definitions (server/services/metrics.ts).
