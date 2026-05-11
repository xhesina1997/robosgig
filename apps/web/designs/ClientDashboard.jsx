// ClientDashboard.jsx — RobosGig "ClientDashboard" page
// Single self-contained JSX module extracted from the design prototype.
// All shared deps (data, helpers, icons, logo, fonts) are inlined below.
// Default-exports <ClientDashboard />. Drop into any React project (Vite/Next/CRA).

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

// ─── Direction 11 body ──────────────────────────────────────────────────
  const W = 1240, H = 880;
  const P = { bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A", muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5", accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F", soft: "#F5F5F3", positive: "#15803D", warn: "#B45309", info: "#3B82F6" };

  const STATUS = {
    open:      { label: "Open",         dot: P.info,    bg: "#EFF6FF", fg: "#1D4ED8" },
    progress:  { label: "In progress",  dot: P.warn,    bg: "#FEF3C7", fg: "#92400E" },
    completed: { label: "Completed",    dot: P.muted,   bg: P.soft,    fg: P.muted   },
  };

  const JOBS_C = [
    {
      id: "cj1",
      title: "Kitchen sink leak repair",
      cat: "plumbing",
      city: "Tirana · Blloku",
      pay: { min: 15, max: 40 },
      posted: "2h ago",
      status: "open",
      desc: "Leaking kitchen sink — needs the source identified (drain, P-trap, faucet or supply lines) and replacement of faulty parts. Bring standard fittings; area should be left dry.",
      apps: [
        { id: "a1", name: "ches veliu", initials: "cv", jobs: 0,  rate: 20, bid: 12, rating: null,  note: "i can do this", verified: true },
        { id: "a2", name: "Marko Iliev", initials: "mi", jobs: 14, rate: 22, bid: 18, rating: 4.92, note: "Available today after 4pm. Bringing a new P-trap and supply hose just in case.", verified: true },
        { id: "a3", name: "Sara K.",    initials: "sk", jobs: 7,  rate: 25, bid: 25, rating: 4.78, note: "Plumber, 6 yrs exp. Free tomorrow morning.", verified: false },
      ],
    },
    {
      id: "cj2",
      title: "TV mount + cable hide",
      cat: "general",
      city: "Tirana · Don Bosko",
      pay: { min: 30, max: 60 },
      posted: "yesterday",
      status: "progress",
      assignedTo: "Erjon L.",
      desc: "Wall-mount a 55\" TV on drywall and conceal HDMI/power. Bracket already purchased.",
      apps: [],
      milestone: "Worker on the way · ETA 14:30",
    },
    {
      id: "cj3",
      title: "Move-out deep clean",
      cat: "cleaning",
      city: "Tirana · Astir",
      pay: { min: 80, max: 120 },
      posted: "3 days ago",
      status: "completed",
      assignedTo: "Priti S.",
      desc: "Two-bedroom apartment, post-move-out. Floors, windows, kitchen, bathrooms.",
      apps: [],
      paid: 110,
      rated: 5,
    },
  ];

  function StatusPill({ s }) {
    const st = STATUS[s];
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 999, background: st.bg, color: st.fg, fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em" }}>
        <span style={{ width: 5, height: 5, borderRadius: 3, background: st.dot }}/>{st.label}
      </span>
    );
  }

  function StatTab({ label, value, color, active, onClick }) {
    return (
      <button onClick={onClick} style={{
        flex: 1, padding: "16px 18px", textAlign: "left",
        background: active ? P.panel : "transparent",
        border: `1px solid ${active ? P.rule : "transparent"}`,
        borderBottom: active ? `1px solid ${P.panel}` : `1px solid ${P.rule}`,
        marginBottom: -1, borderRadius: "12px 12px 0 0", cursor: "pointer", fontFamily: FONT,
        position: "relative",
      }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: color || P.ink, letterSpacing: "-.025em", lineHeight: 1, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "baseline", gap: 8 }}>
          {value}
          {active && <span style={{ width: 6, height: 6, borderRadius: 3, background: color || P.ink }}/>}
        </div>
        <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, marginTop: 8 }}>{label}</div>
      </button>
    );
  }

  function ApplicantRow({ app, onAccept, onDecline, accepted, declined }) {
    const isAccepted = accepted;
    return (
      <div style={{
        padding: "14px 16px", border: `1px solid ${isAccepted ? P.ink : P.rule}`, borderRadius: 12,
        background: isAccepted ? P.soft : P.panel, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "start",
        opacity: declined ? .5 : 1,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{app.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: P.ink, letterSpacing: "-.005em" }}>{app.name}</span>
            {app.verified && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 7px", borderRadius: 999, background: "#F0FAE0", color: P.accentText, fontSize: 9.5, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>✓ ID</span>}
            {app.rating != null
              ? <span style={{ fontSize: 11.5, color: P.muted, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>★ {app.rating.toFixed(2)} · {app.jobs} jobs</span>
              : <span style={{ fontSize: 11.5, color: P.muted, fontFamily: MONO, fontStyle: "italic" }}>new · {app.jobs} jobs</span>}
            <span style={{ fontSize: 11, color: P.sub, fontFamily: MONO }}>· €{app.rate}/hr</span>
          </div>
          {app.note && (
            <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: isAccepted ? P.panel : P.soft, fontSize: 12.5, color: P.muted, fontStyle: "italic", lineHeight: 1.45, borderLeft: `2px solid ${P.rule}` }}>"{app.note}"</div>
          )}
          <button style={{ marginTop: 10, padding: 0, background: "transparent", border: "none", color: P.ink, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: P.rule }}>View full profile →</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", minWidth: 130 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: P.ink, letterSpacing: "-.025em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>€{app.bid}</div>
          <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".08em", textTransform: "uppercase" }}>their bid</div>
          {!isAccepted && !declined && (
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={onDecline} style={{ padding: "7px 12px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, color: P.muted, fontSize: 11.5, fontFamily: FONT, cursor: "pointer" }}>Pass</button>
              <button onClick={onAccept} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 11.5, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Accept</button>
            </div>
          )}
          {isAccepted && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, background: P.ink, color: "#fff", fontSize: 11, fontWeight: 500, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 4 }}>✓ Hired</span>
          )}
          {declined && <span style={{ fontSize: 11, color: P.sub, marginTop: 4 }}>passed</span>}
        </div>
      </div>
    );
  }

  function JobCard({ job, expanded, onToggle, hired, declined, onHire, onDecline }) {
    const cat = CATS[job.cat] || { label: job.cat, color: P.muted };
    return (
      <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, overflow: "hidden", transition: "border .12s" }}>
        <button onClick={onToggle} style={{ width: "100%", padding: "18px 22px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontFamily: FONT, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 18, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: cat.color }}/>
              <span style={{ fontSize: 15.5, fontWeight: 500, color: P.ink, letterSpacing: "-.012em" }}>{job.title}</span>
              <StatusPill s={job.status}/>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: P.muted, display: "flex", gap: 14, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
              <span>{cat.label.toLowerCase()}</span>
              <span>· {job.city}</span>
              <span>· €{job.pay.min}–{job.pay.max}</span>
              <span>· posted {job.posted}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {job.status === "open" && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: job.apps.length > 0 ? P.ink : P.soft, color: job.apps.length > 0 ? "#fff" : P.muted, fontSize: 11.5, fontWeight: 500 }}>
                {job.apps.length} application{job.apps.length === 1 ? "" : "s"}
              </div>
            )}
            {job.status === "progress" && (
              <div style={{ fontSize: 11.5, color: P.warn }}>{job.milestone}</div>
            )}
            {job.status === "completed" && (
              <div style={{ fontSize: 11.5, color: P.muted, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontFamily: MONO, color: P.positive }}>+€{job.paid} paid</span>
                <span>★ you rated {job.rated}</span>
              </div>
            )}
          </div>
          <div style={{ width: 26, height: 26, borderRadius: 999, border: `1px solid ${P.rule}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: P.muted, fontSize: 13, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }}>⌄</div>
        </button>

        {expanded && (
          <div style={{ padding: "0 22px 22px", borderTop: `1px solid ${P.rule}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, color: P.muted, lineHeight: 1.55, maxWidth: 880 }}>{job.desc}</div>

            {job.status === "progress" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", padding: "14px 16px", border: `1px solid ${P.rule}`, borderRadius: 12, background: P.soft }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 999, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>EL</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: P.ink }}>{job.assignedTo}</div>
                    <div style={{ fontSize: 11.5, color: P.muted, fontFamily: MONO }}>{job.milestone}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>Open chat</button>
                  <button style={{ padding: "8px 14px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Mark done · release escrow</button>
                </div>
              </div>
            )}

            {job.status === "open" && job.apps.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>
                    Applications · <span style={{ color: P.ink }}>{job.apps.length}</span>
                  </div>
                  <div style={{ fontSize: 11, color: P.sub, fontFamily: MONO }}>sorted by best match</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {job.apps.map((a) => (
                    <ApplicantRow key={a.id} app={a}
                      accepted={hired === a.id}
                      declined={declined.includes(a.id)}
                      onAccept={() => onHire(a.id)}
                      onDecline={() => onDecline(a.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {job.status === "completed" && (
              <div style={{ padding: "14px 16px", border: `1px solid ${P.rule}`, borderRadius: 12, background: P.soft, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12.5, color: P.muted }}>Completed by <span style={{ color: P.ink, fontWeight: 500 }}>{job.assignedTo}</span> · paid €{job.paid} · invoice issued</div>
                <button style={{ padding: "7px 12px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>Rebook →</button>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
              <button style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "transparent", fontSize: 12, fontFamily: FONT, color: "#B91C1C", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete job
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ padding: "7px 12px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>Edit</button>
                <button style={{ padding: "7px 12px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>Duplicate</button>
                <button style={{ padding: "7px 12px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.muted, cursor: "pointer" }}>Pause</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Direction11() {
    const [filter, setFilter] = React.useState("all");
    const [expandedId, setExpandedId] = React.useState("cj1");
    const [hired, setHired] = React.useState({});
    const [declined, setDeclined] = React.useState({});

    const counts = {
      all: JOBS_C.length,
      open: JOBS_C.filter((j) => j.status === "open").length,
      progress: JOBS_C.filter((j) => j.status === "progress").length,
      completed: JOBS_C.filter((j) => j.status === "completed").length,
    };
    const filtered = filter === "all" ? JOBS_C : JOBS_C.filter((j) => j.status === filter);

    return (
      <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RobosLogo accent={P.ink} size={24}/>
            <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
            <span style={{ marginLeft: 10, padding: "2px 8px", borderRadius: 999, background: P.soft, color: P.muted, fontSize: 10.5, fontFamily: MONO, letterSpacing: ".06em", textTransform: "uppercase" }}>Client</span>
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
            <span style={{ color: P.muted }}>Post a job</span>
            <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>My jobs<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
            <span style={{ color: P.muted }}>Pricing</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.muted, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: P.warn }}/>Escrow €60
            </button>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>C</div>
          </div>
        </div>

        {/* hero */}
        <div style={{ padding: "28px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>Client dashboard</div>
            <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: 0, lineHeight: 1, color: P.ink }}>My jobs</h1>
            <div style={{ fontSize: 13, color: P.muted, marginTop: 6, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "#F0FAE0", color: P.accentText, fontWeight: 500 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                ID Verified
              </span>
              <span>·</span>
              <span>4 jobs lifetime · €410 spent</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>My profile</button>
            <button style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 12.5, fontFamily: FONT, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: 999, background: P.accent, color: P.accentInk, fontSize: 11, lineHeight: 1, fontWeight: 700 }}>+</span>
              Post new job
            </button>
          </div>
        </div>

        {/* tabs */}
        <div style={{ padding: "20px 40px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, borderBottom: `1px solid ${P.rule}` }}>
            <StatTab label="All jobs" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")}/>
            <StatTab label="Open" value={counts.open} color={P.info} active={filter === "open"} onClick={() => setFilter("open")}/>
            <StatTab label="In progress" value={counts.progress} color={P.warn} active={filter === "progress"} onClick={() => setFilter("progress")}/>
            <StatTab label="Completed" value={counts.completed} color={P.muted} active={filter === "completed"} onClick={() => setFilter("completed")}/>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
              {filter === "all" ? "All jobs" : STATUS[filter].label}
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 18, padding: "0 6px", borderRadius: 999, background: P.ink, color: "#fff", fontSize: 10.5, fontWeight: 600, letterSpacing: 0 }}>{filtered.length}</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <input placeholder="Search jobs…" style={{ padding: "7px 12px 7px 30px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 12, fontFamily: FONT, color: P.ink, background: P.panel, outline: "none", width: 200 }}/>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: P.sub, fontSize: 11 }}>⌕</span>
              </div>
              <button style={{ padding: "7px 12px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.muted, cursor: "pointer" }}>Newest ↓</button>
            </div>
          </div>

          {filtered.map((job) => (
            <JobCard key={job.id} job={job}
              expanded={expandedId === job.id}
              onToggle={() => setExpandedId(expandedId === job.id ? null : job.id)}
              hired={hired[job.id]}
              declined={declined[job.id] || []}
              onHire={(appId) => setHired((h) => ({ ...h, [job.id]: appId }))}
              onDecline={(appId) => setDeclined((d) => ({ ...d, [job.id]: [...(d[job.id] || []), appId] }))}
            />
          ))}

          {/* empty-state hint */}
          {filtered.length === 0 && (
            <div style={{ padding: "40px 24px", border: `1px dashed ${P.rule}`, borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: P.ink }}>Nothing here yet.</div>
              <div style={{ fontSize: 12, color: P.muted, marginTop: 4 }}>Post a job and we'll match you with verified workers in minutes.</div>
            </div>
          )}
        </div>

        <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
          <span>my jobs · client</span><span>·</span>
          <span>{counts.all} total</span><span>·</span>
          <span>{counts.open} open</span><span>·</span>
          <span>escrow €60.00</span>
          <span style={{ marginLeft: "auto" }}>RobosGig · Client · v2.4</span>
        </div>
      </div>
    );
  }


// ─── Default export ─────────────────────────────────────────────────────────
export default Direction11;
