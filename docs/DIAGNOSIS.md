# Diagnosis (from rideops_support_tickets.csv, 1,444 tickets, 2 Jul - 30 Sep 2026)

- Volume: 390 (Jul) -> 462 (Aug) -> 592 (Sep), +52%. All 48 open tickets were created on/after 21 Sep (data pulled 30 Sep). Tickets open at week end rose from ~11-14 (early Jul) to 48; 25 are older than 72h; 34 (71%) are escalated.
- Escalated tickets are 34% of volume (486) but 71% of ticket-hours.
- Each engineering handoff adds ~50h. Median hours to close: 0 handoffs 12.6, 1 handoff 58.7, 2 handoffs 110.4, 3 handoffs 169.9. CSAT: 4.0, 3.6, 2.8, 2.1.
- Only 211 of 486 escalations (43%) ended "Fixed". Insufficient info 89, config issue 84, duplicate of known issue 56, how-to 24, not reproducible 22. The first four (253, 52%) look avoidable at L1.
- Roster sync, live tracking and report export are 54% of volume and ~78% of escalations. 201 distinct descriptions across 1,444 tickets, so issues repeat.
- Fast closing is not good closing: Karan B closes in a median 7.9h but 29.5% of his tickets reopen (others 7.1%), CSAT 3.1 vs 3.8, 42% of all reopens.
- Rahul T escalates 62% of tickets (100% of roster, 97% of GPS) and 75% of his escalations are not fixed.
- Limits: no engineering timestamps (cannot split L1 vs engineering time); CSAT given on only 45% of tickets; the "60% open increase" cannot be reproduced exactly from this file.
