"use client";
import { useEffect, useState } from "react";

type Gate = { verdict: string; reason: string; basis: string; sample: number; escalationRate: number; fixedRate: number | null; outcomes: Record<string, number>; knownIssueHint: string | null; medianHoursL1: number | null; medianHoursEscalated: number | null; checklist: string[] };
type Metrics = { weekly: { week: string; created: number; medianHoursToClose: number | null; escalationRate: number; escalationYield: number | null; reopenRate: number }[]; backlog: { open: number; openEscalated: number; olderThan72h: number } };
const TITLES: Record<string, string> = { resolve_l1: "Resolve at L1", checklist_first: "Finish the checklist before escalating", escalate_ok: "Escalate to engineering" };
const pct = (x: number | null) => (x === null ? "-" : `${Math.round(x * 100)}%`);
const h = (x: number | null) => (x === null ? "-" : `${Math.round(x)}h`);
const post = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

export default function Page() {
  const [catalog, setCatalog] = useState<Record<string, string[]>>({});
  const [category, setCategory] = useState(""); const [description, setDescription] = useState("");
  const [client, setClient] = useState(""); const [priority, setPriority] = useState("P3"); const [ticketId, setTicketId] = useState("");
  const [gate, setGate] = useState<Gate | null>(null); const [checked, setChecked] = useState<string[]>([]);
  const [notes, setNotes] = useState(""); const [note, setNote] = useState(""); const [m, setM] = useState<Metrics | null>(null); const [err, setErr] = useState("");

  useEffect(() => { fetch("/api/catalog").then((r) => r.json()).then(setCatalog).catch(() => setErr("Cannot load tickets. Check DATABASE_URL and run npm run db:seed.")); fetch("/api/metrics").then((r) => r.json()).then(setM).catch(() => {}); }, []);

  const check = async () => { setNote(""); setChecked([]); setGate(await post("/api/gate", { category, description })); };
  const toggle = (c: string) => setChecked((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]));
  const allDone = !!gate && checked.length === gate.checklist.length;
  const build = async () => setNote((await post("/api/handoff", { category, description, clientName: client || "(client)", priority, ticketId, checked, notes })).note);

  return (
    <main>
      <h1>Escalation Gate</h1>
      <p className="mute">Check a ticket before sending it to engineering. Based on 1,444 past tickets.</p>
      {err && <p role="alert" style={{ color: "var(--stop)" }}>{err}</p>}
      <section>
        <div className="row">
          <div><label>Category<select value={category} onChange={(e) => { setCategory(e.target.value); setDescription(""); setGate(null); }}><option value="">Select category</option>{Object.keys(catalog).map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Issue<select value={description} onChange={(e) => { setDescription(e.target.value); setGate(null); }} disabled={!category}><option value="">Select issue</option>{(catalog[category] ?? []).map((d) => <option key={d}>{d}</option>)}</select></label></div>
          <div><label>Ticket ID<input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="SUP-10001" /></label>
            <label>Client name<input value={client} onChange={(e) => setClient(e.target.value)} /></label>
            <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value)}>{["P1", "P2", "P3", "P4"].map((p) => <option key={p}>{p}</option>)}</select></label></div>
        </div>
        <button onClick={check} disabled={!description}>Check this ticket</button>
      </section>

      {gate && (<>
        <div className={`verdict ${gate.verdict}`} style={{ marginTop: 16 }} role="status">{TITLES[gate.verdict]}<p>{gate.reason}</p>{gate.knownIssueHint && <p>{gate.knownIssueHint}</p>}</div>
        <section><h2>What happened to similar tickets</h2>
          <p className="mute">Based on {gate.sample} past tickets ({gate.basis}). Escalated: {pct(gate.escalationRate)}. Fixed by engineering: {pct(gate.fixedRate)}. Median time to close: {h(gate.medianHoursL1)} at L1, {h(gate.medianHoursEscalated)} if escalated.</p>
          <table><tbody>{Object.entries(gate.outcomes).sort((a, b) => b[1] - a[1]).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table></section>
        <section><h2>Checklist</h2>{gate.checklist.map((c) => <label className="chk" key={c}><input type="checkbox" checked={checked.includes(c)} onChange={() => toggle(c)} />{c}</label>)}
          <label>Details for engineering (IDs, times, expected vs actual)<textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          <button onClick={build} disabled={!allDone || !notes.trim()}>Build handoff note</button>{!allDone && <span className="mute"> Complete the checklist to continue.</span>}
          {note && <pre>{note}</pre>}</section>
      </>)}

      {m && (<section><h2>Weekly scorecard</h2>
        <p className="mute">Open now: {m.backlog.open} ({m.backlog.openEscalated} escalated). Older than 72h: {m.backlog.olderThan72h}.</p>
        <div style={{ overflowX: "auto" }}><table><thead><tr><th>Week of</th><th>Tickets</th><th>Median hours to close</th><th>Escalated</th><th>Escalation fixed</th><th>Reopened</th></tr></thead>
          <tbody>{m.weekly.map((w) => <tr key={w.week}><td>{w.week}</td><td>{w.created}</td><td>{h(w.medianHoursToClose)}</td><td>{pct(w.escalationRate)}</td><td>{pct(w.escalationYield)}</td><td>{pct(w.reopenRate)}</td></tr>)}</tbody></table></div></section>)}
    </main>
  );
}
