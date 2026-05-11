// WorkerApplications.jsx — RobosGig "Worker · Applications (kanban pipeline)" page
// Single self-contained JSX module extracted from the design prototype.
// All shared deps (data, helpers, icons, logo, fonts) are inlined below.
// Default-exports <WorkerApplications />. Drop into any React project (Vite/Next/CRA).

import React from "react";

// ─── Inlined shared deps (from shared.jsx) ──────────────────────────────────
// shared.jsx — shared data, palette tokens, helpers (modern revision)

const JOBS = [
  { id: "j1", title: "General Handyman Task", desc: "Client submitted an unclear request with insufficient details. A general handyman will assess and discuss requirements directly.", cat: "general", pay: [30, 80], urgency: "low", posted: "26 Apr", distanceKm: 0.1, client: { name: "Client", short: "?", city: "Vienna", verified: true, color: "#5A56E0" }, pos: { x: 0.52, y: 0.46 } },
  { id: "j2", title: "Silicone Joint Renewal in Shower", desc: "Removal of old silicone sealing and application of new joints in a shower area. Cleaning, prep, fresh waterproof sealant.", cat: "plumbing", pay: [60, 120], urgency: "normal", posted: "26 Apr", distanceKm: 0.1, client: { name: "Andrea Grac", short: "AG", city: "Wien", verified: true, color: "#E54C84" }, pos: { x: 0.49, y: 0.48 } },
  { id: "j3", title: "Assemble IKEA PAX Wardrobe (3m)", desc: "Two-section PAX wardrobe with sliding doors and interior drawer system. All parts on site. Tools provided.", cat: "assembly", pay: [80, 140], urgency: "urgent", posted: "27 Apr", distanceKm: 1.2, client: { name: "Lukas M.", short: "LM", city: "Neubau", verified: true, color: "#0F8A5F" }, pos: { x: 0.42, y: 0.40 } },
  { id: "j4", title: "Fix Leaky Kitchen Faucet", desc: "Single-lever mixer drips at the base. Likely cartridge replacement. Client has a spare cartridge on hand.", cat: "plumbing", pay: [40, 90], urgency: "urgent", posted: "27 Apr", distanceKm: 0.8, client: { name: "Sophie K.", short: "SK", city: "Mariahilf", verified: false, color: "#C26A2A" }, pos: { x: 0.46, y: 0.55 } },
  { id: "j5", title: "Paint Living Room (35 m²)", desc: "Two-coat interior paint on prepped walls. Furniture moved to centre, covered. White ceiling untouched. Paint supplied.", cat: "painting", pay: [280, 450], urgency: "normal", posted: "25 Apr", distanceKm: 2.4, client: { name: "Familie Becker", short: "FB", city: "Hietzing", verified: true, color: "#7A5AE0" }, pos: { x: 0.30, y: 0.62 } },
  { id: "j6", title: "Replace 3 Bathroom Light Fixtures", desc: "Swap three ceiling fixtures for new IP44 LED units (supplied). Standard junction boxes. Power can be cut at the panel.", cat: "electrical", pay: [70, 140], urgency: "low", posted: "24 Apr", distanceKm: 1.5, client: { name: "Markus T.", short: "MT", city: "Leopoldstadt", verified: true, color: "#1E7A8C" }, pos: { x: 0.62, y: 0.38 } },
  { id: "j7", title: "Gallery Wall — Hang 12 Frames", desc: "Mixed-size frames already laid out on floor. Drywall, no concealed lines. Level + spacer guidance preferred.", cat: "mounting", pay: [45, 80], urgency: "normal", posted: "28 Apr", distanceKm: 0.6, client: { name: "Elena V.", short: "EV", city: "Josefstadt", verified: true, color: "#B83D5B" }, pos: { x: 0.55, y: 0.42 } },
  { id: "j8", title: "Assemble Patio Furniture (Café)", desc: "Six tables, twelve chairs, two parasols + bases. Boxed flatpack. Outside terrace, level paving. Café opens at 16:00.", cat: "assembly", pay: [180, 280], urgency: "urgent", posted: "28 Apr", distanceKm: 3.1, client: { name: "Café Stadtpark", short: "CS", city: "Landstraße", verified: true, color: "#D4762A" }, pos: { x: 0.71, y: 0.55 } },
];

const CATS = {
  general:    { label: "General",    glyph: "✦", color: "#737373" },
  plumbing:   { label: "Plumbing",   glyph: "≈", color: "#3B82F6" },
  assembly:   { label: "Assembly",   glyph: "▦", color: "#F59E0B" },
  painting:   { label: "Painting",   glyph: "◐", color: "#EC4899" },
  electrical: { label: "Electrical", glyph: "⚡", color: "#EAB308" },
  mounting:   { label: "Mounting",   glyph: "✚", color: "#10B981" },
};

const URGENCY = {
  low:    { label: "Low",    color: "#737373", dot: "#A3A3A3" },
  normal: { label: "Normal", color: "#525252", dot: "#525252" },
  urgent: { label: "Urgent", color: "#DC2626", dot: "#EF4444" },
};

const fmtEuro = (range) => `€${range[0]}–${range[1]}`;
const fmtDistance = (km) => (km < 1 ? `${(km * 1000) | 0} m` : `${km.toFixed(1)} km`);
const midPay = (range) => Math.round((range[0] + range[1]) / 2);

function useJobsState() {
  const KEY = "robosgig.jobsState.v2";
  const initial = React.useMemo(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch {}
    return { saved: [], applied: [] };
  }, []);
  const [saved, setSaved] = React.useState(initial.saved);
  const [applied, setApplied] = React.useState(initial.applied);
  React.useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ saved, applied })); } catch {} }, [saved, applied]);
  return {
    saved, applied,
    isSaved: (id) => saved.includes(id),
    isApplied: (id) => applied.includes(id),
    toggleSaved: (id) => setSaved((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]),
    apply: (id) => setApplied((a) => a.includes(id) ? a : [...a, id]),
  };
}

const Icon = ({ name, size = 16, stroke = 1.5, ...rest }) => {
  const base = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", ...rest };
  switch (name) {
    case "bookmark": return <svg {...base}><path d="M6 4h12v17l-6-4-6 4z"/></svg>;
    case "bookmark-fill": return <svg {...base} fill="currentColor"><path d="M6 4h12v17l-6-4-6 4z"/></svg>;
    case "map": return <svg {...base}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>;
    case "pin": return <svg {...base}><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case "arrow-right": return <svg {...base}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "arrow-up-right": return <svg {...base}><path d="M7 17 17 7M9 7h8v8"/></svg>;
    case "x": return <svg {...base}><path d="M6 6l12 12M6 18 18 6"/></svg>;
    case "check": return <svg {...base}><path d="M5 12.5 10 17 19 7"/></svg>;
    case "filter": return <svg {...base}><path d="M4 5h16M7 12h10M10 19h4"/></svg>;
    case "search": return <svg {...base}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
    case "plus": return <svg {...base}><path d="M12 5v14M5 12h14"/></svg>;
    case "chev": return <svg {...base}><path d="m9 6 6 6-6 6"/></svg>;
    case "sliders": return <svg {...base}><path d="M4 6h7M14 6h6M4 12h3M10 12h10M4 18h13M20 18h0"/><circle cx="12.5" cy="6" r="2"/><circle cx="8.5" cy="12" r="2"/><circle cx="18.5" cy="18" r="2"/></svg>;
    case "robot": return <svg {...base}><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4M9 4h6"/><circle cx="9.5" cy="13" r=".9" fill="currentColor"/><circle cx="14.5" cy="13" r=".9" fill="currentColor"/></svg>;
    default: return null;
  }
};

const RobosLogo = ({ accent = "#0A0A0A", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="9" width="24" height="17" rx="6" fill={accent}/>
    <rect x="14.5" y="3.5" width="3" height="6" rx="1.5" fill={accent}/>
    <circle cx="16" cy="3.5" r="1.4" fill={accent}/>
    <circle cx="11.5" cy="17" r="2.4" fill="#fff"/>
    <circle cx="20.5" cy="17" r="2.4" fill="#fff"/>
  </svg>
);

const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

// ─── Direction 6 body ───────────────────────────────────────────────────────
  const W = 1240, H = 880;
  const P = {
    bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A", muted: "#737373",
    sub: "#A3A3A3", rule: "#E8E8E5", accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F",
    columnBg: "#F5F5F3",
  };

  const buildApps = (applied) => {
    const lookup = (id) => JOBS.find((x) => x.id === id);
    const base = [
      { jobId: "j2", status: "applied",   offer: 95,  ts: "2h ago",  note: "Available this weekend, bring my own sealant." },
      { jobId: "j7", status: "applied",   offer: 60,  ts: "5h ago",  note: "Have laser level + spacers." },
      { jobId: "j4", status: "request",   offer: 60,  ts: "Today",   note: "Client requested you directly." },
      { jobId: "j5", status: "accepted",  offer: 360, ts: "Mon 09:00",note: "On the way · message client" },
      { jobId: "j8", status: "completed", offer: 240, ts: "26 Apr",  note: "★★★★★ \"Quick and tidy.\"" },
      { jobId: "j6", status: "completed", offer: 110, ts: "18 Apr",  note: "★★★★★ Paid." },
      { jobId: "j3", status: "declined",  offer: 130, ts: "23 Apr",  note: "Client picked another worker." },
    ];
    // Inject any user-applied jobs not already in the list
    const ids = new Set(base.map((b) => b.jobId));
    applied.forEach((id) => { if (!ids.has(id)) base.unshift({ jobId: id, status: "applied", offer: midPay(lookup(id)?.pay || [0,0]), appliedOn: "Today", note: "You applied just now." }); });
    return base.map((a) => ({ ...a, job: lookup(a.jobId) })).filter((a) => a.job);
  };

  const COLS = [
    { id: "request",   label: "Requests",  hint: "Client picked you — accept or pass.",         dot: "#84CC16" },
    { id: "applied",   label: "Applied",   hint: "Waiting on client decision.",                  dot: "#3B82F6" },
    { id: "accepted",  label: "Active",    hint: "Confirmed work — show up + message client.",   dot: "#0A0A0A", solid: true },
    { id: "completed", label: "Completed", hint: "Paid out · review history.",                    dot: "#737373" },
  ];

  function MiniCard({ app }) {
    const { job, status, offer, ts, note } = app;
    const cat = CATS[job.cat];
    const isActive = status === "accepted";
    return (
      <div style={{
        background: P.panel, border: isActive ? `1px solid ${P.ink}` : `1px solid ${P.rule}`,
        borderRadius: 12, padding: "12px 14px", cursor: "pointer", boxShadow: isActive ? "0 4px 14px rgba(10,10,10,.06)" : "none",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: P.muted, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase" }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: cat.color }}/>{cat.label}
          </span>
          <span style={{ fontSize: 10.5, color: P.sub, fontFamily: MONO }}>{ts}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.3, color: P.ink, letterSpacing: "-.005em" }}>{job.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: 11.5, color: P.muted }}>{job.client.city} · {fmtDistance(job.distanceKm)}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: status === "accepted" ? P.accentText : P.ink, fontVariantNumeric: "tabular-nums" }}>€{offer}</span>
        </div>
        {(isActive || status === "request") && (
          <div style={{ fontSize: 11, color: P.muted, marginTop: 2, fontStyle: "italic", borderTop: `1px solid ${P.rule}`, paddingTop: 8 }}>{note}</div>
        )}
        {status === "request" && (
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            <button style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.muted, cursor: "pointer" }}>Pass</button>
            <button style={{ flex: 2, padding: "6px", borderRadius: 6, border: "none", background: P.accent, fontSize: 11.5, fontFamily: FONT, color: P.accentInk, fontWeight: 600, cursor: "pointer" }}>Accept →</button>
          </div>
        )}
        {isActive && (
          <button style={{ marginTop: 4, padding: "7px", borderRadius: 6, border: "none", background: P.ink, fontSize: 11.5, fontFamily: FONT, color: "#fff", fontWeight: 500, cursor: "pointer" }}>Open chat →</button>
        )}
      </div>
    );
  }

  function Column({ col, apps }) {
    const sumPay = apps.reduce((s, a) => s + a.offer, 0);
    return (
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: P.columnBg, borderRadius: 14, padding: 12, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 8px", borderBottom: `1px solid ${P.rule}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: col.dot, boxShadow: col.solid ? `0 0 6px ${col.dot}` : "none" }}/>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, letterSpacing: "-.005em" }}>{col.label}</span>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 18, padding: "0 6px", borderRadius: 999, background: P.ink, color: "#fff", fontSize: 10.5, fontWeight: 600 }}>{apps.length}</span>
          </div>
          <span style={{ fontSize: 11, color: P.muted, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>€{sumPay}</span>
        </div>
        <div style={{ fontSize: 11, color: P.muted, padding: "0 4px", lineHeight: 1.4 }}>{col.hint}</div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 2 }}>
          {apps.map((a) => <MiniCard key={a.jobId + a.status} app={a}/>)}
          {apps.length === 0 && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${P.rule}`, borderRadius: 10, padding: 16, fontSize: 11.5, color: P.sub, textAlign: "center", lineHeight: 1.4, minHeight: 80 }}>
              Nothing here.
            </div>
          )}
        </div>
      </div>
    );
  }

  function HeroBar({ apps }) {
    const active = apps.filter((a) => a.status === "accepted");
    const earned = apps.filter((a) => a.status === "completed").reduce((s, a) => s + a.offer, 0);
    const pipeline = apps.filter((a) => a.status === "applied" || a.status === "request").reduce((s, a) => s + a.offer, 0);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, padding: "16px 28px", background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, margin: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 16, borderRight: `1px solid ${P.rule}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0A0A0A", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>{active.length > 0 ? `Next up · ${active[0].ts}` : "No active job"}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: P.ink, marginTop: 2, letterSpacing: "-.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {active.length > 0 ? active[0].job.title : "Take a request to get started"}
            </div>
          </div>
          {active.length > 0 && (
            <button style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 999, background: P.accent, color: P.accentInk, border: "none", fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer", whiteSpace: "nowrap" }}>I'm on the way</button>
          )}
        </div>
        {[
          ["This month", `€${earned}`, "earned"],
          ["Pipeline", `€${pipeline}`, `${apps.filter((a) => a.status !== "completed" && a.status !== "declined").length} open`],
          ["Response rate", "84%", "below avg 91%"],
        ].map(([k, v, sub]) => (
          <div key={k} style={{ paddingLeft: 4 }}>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>{k}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: P.ink, marginTop: 4, letterSpacing: "-.018em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{v}</div>
            <div style={{ fontSize: 11, color: P.sub, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>
    );
  }

  function ActionPill({ icon, label, primary, accent }) {
    return (
      <button style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 999,
        border: primary ? "none" : `1px solid ${accent ? P.accent : P.rule}`,
        background: primary ? P.ink : (accent ? "#F0FAE0" : P.panel),
        color: primary ? "#fff" : (accent ? P.accentText : P.ink),
        fontSize: 13, fontFamily: FONT, fontWeight: primary ? 600 : 500, cursor: "pointer",
      }}>{icon}{label}</button>
    );
  }

  function Direction6() {
    const j = useJobsState();
    const apps = React.useMemo(() => buildApps(j.applied), [j.applied]);
    const grouped = COLS.map((c) => ({ col: c, apps: apps.filter((a) => a.status === c.id) }));

    return (
      <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RobosLogo accent={P.ink} size={24}/>
            <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
            <span style={{ color: P.muted }}>Browse jobs</span>
            <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>
              Applications
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/>
            </span>
            <span style={{ color: P.muted }}>Profile</span>
            <span style={{ color: P.muted }}>Pricing</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>
              Online · Vienna
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
          </div>
        </div>

        <div style={{ padding: "26px 32px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Pipeline · Friday 8 May</div>
            <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: 0, lineHeight: 1, color: P.ink, display: "inline-flex", alignItems: "baseline", gap: 14 }}>
              Hey, ches.
              <span style={{ fontSize: 14, color: P.muted, fontWeight: 400 }}>{apps.filter((a) => a.status === "request").length} new request · {apps.filter((a) => a.status === "accepted").length} active</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <ActionPill label="Find jobs" icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>}/>
            <ActionPill label="Edit profile" icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>}/>
            <ActionPill primary label="Upgrade to Pro" icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={P.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></svg>}/>
          </div>
        </div>

        <HeroBar apps={apps}/>

        <div style={{ flex: 1, overflow: "hidden", padding: "16px 28px 24px", display: "flex", gap: 10 }}>
          {grouped.map(({ col, apps }) => <Column key={col.id} col={col} apps={apps}/>)}
        </div>

        <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
          <span>{apps.length} total</span><span>·</span>
          <span>{apps.filter((a) => a.status === "accepted").length} active</span><span>·</span>
          <span>response rate 84%</span>
          <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
        </div>
      </div>
    );
  }


// ─── Default export ─────────────────────────────────────────────────────────
export default Direction6;
