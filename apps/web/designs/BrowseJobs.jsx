// BrowseJobs.jsx — RobosGig "Browse jobs" page (Direction 4 · Light Modern)
// Single self-contained JSX module extracted from the design prototype.
// All shared deps (data, helpers, icons, logo, fonts) are inlined below.
// Default-exports <BrowseJobs />. Drop into any React project (Vite/Next/CRA).

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

// ─── Direction 4 body ───────────────────────────────────────────────────────
  const W = 1240, H = 880;
  const P = {
    bg: "#FAFAFA", panel: "#FFFFFF", panel2: "#F5F5F5", ink: "#0A0A0A", muted: "#737373",
    sub: "#A3A3A3", rule: "#E8E8E5", accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F",
  };

  function Card({ job, jstate, onOpen, onApply }) {
    const cat = CATS[job.cat], urg = URGENCY[job.urgency];
    const applied = jstate.isApplied(job.id), saved = jstate.isSaved(job.id);
    return (
      <div onClick={() => onOpen(job)} style={{
        background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14,
        padding: "22px 22px 18px", cursor: "pointer", display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden", transition: "all .15s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.background = P.panel; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = P.rule; e.currentTarget.style.background = P.panel; }}>
        {/* Top: cat + urgency */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: P.muted, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: cat.color }}/>
            {cat.label}
          </span>
          {job.urgency === "urgent" && (
            <span style={{ fontSize: 10, color: "#DC2626", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>● Urgent</span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 15.5, fontWeight: 500, lineHeight: 1.3, letterSpacing: "-.005em", color: P.ink, minHeight: 40 }}>{job.title}</div>

        {/* Description */}
        <div style={{ fontSize: 12.5, color: P.muted, lineHeight: 1.5, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{job.desc}</div>
        <div style={{ flex: 1 }}/>

        {/* Pay block */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${P.rule}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, color: P.sub, fontFamily: MONO, letterSpacing: ".1em" }}>EUR</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: P.ink, letterSpacing: "-.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmtEuro(job.pay)}</div>
            <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>{fmtDistance(job.distanceKm)} · {job.posted}</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={(e) => { e.stopPropagation(); jstate.toggleSaved(job.id); }} style={{
              width: 30, height: 30, border: `1px solid ${P.rule}`, borderRadius: 8,
              background: saved ? P.accent : "transparent", color: saved ? P.accentInk : P.muted, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><Icon name={saved ? "bookmark-fill" : "bookmark"} size={12}/></button>
            <button onClick={(e) => { e.stopPropagation(); !applied && onApply(job); }} disabled={applied} style={{
              height: 30, padding: "0 12px", borderRadius: 8, border: "none",
              background: applied ? "#16A34A" : P.accent, color: applied ? "#fff" : P.accentInk,
              fontSize: 12, fontWeight: 600, cursor: applied ? "default" : "pointer", fontFamily: FONT,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>{applied ? <><Icon name="check" size={11} stroke={2.4}/> Applied</> : <>Apply <Icon name="arrow-right" size={11}/></>}</button>
          </div>
        </div>
      </div>
    );
  }

  function StatBlock({ label, value, sub, mono, bg }) {
    return (
      <div style={{ flex: 1, padding: "14px 18px", borderRight: `1px solid ${P.rule}`, background: bg || "transparent" }}>
        <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: P.ink, marginTop: 4, letterSpacing: "-.015em", fontFamily: mono ? MONO : FONT, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{sub}</div>}
      </div>
    );
  }

  function Detail({ job, onClose, jstate, onApply }) {
    if (!job) return null;
    const cat = CATS[job.cat], urg = URGENCY[job.urgency];
    return (
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 30, display: "flex", justifyContent: "flex-end" }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: 480, background: P.panel, borderLeft: `1px solid ${P.rule}`, padding: "28px 32px", overflowY: "auto", color: P.ink,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: P.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: cat.color }}/>{cat.label} · <span style={{ color: urg.color }}>{urg.label}</span>
            </span>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: P.muted }}><Icon name="x" size={16}/></button>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.018em", lineHeight: 1.2, margin: "0 0 12px" }}>{job.title}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#3a3a3a", margin: 0 }}>{job.desc}</p>

          <div style={{ marginTop: 24, padding: "14px 18px", background: P.bg, borderRadius: 12, border: `1px solid ${P.rule}` }}>
            <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase" }}>Estimated pay</div>
            <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: "-.025em", color: P.accentText, marginTop: 4, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmtEuro(job.pay)}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 12 }}>
            {[["Distance", fmtDistance(job.distanceKm)], ["Posted", job.posted]].map(([k, v]) => (
              <div key={k} style={{ padding: "12px 14px", background: P.bg, borderRadius: 10, border: `1px solid ${P.rule}` }}>
                <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: P.ink, marginTop: 3, letterSpacing: "-.01em" }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", background: P.bg, borderRadius: 10, border: `1px solid ${P.rule}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: job.client.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>{job.client.short}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: P.ink }}>{job.client.name}</div>
              <div style={{ fontSize: 11.5, color: P.muted }}>{job.client.city} · {job.client.verified ? "Verified" : "New"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            <button onClick={() => jstate.toggleSaved(job.id)} style={{
              padding: "12px 16px", border: `1px solid ${P.rule}`, borderRadius: 10,
              background: P.bg, color: P.ink, cursor: "pointer", fontFamily: FONT, fontSize: 13,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}><Icon name={jstate.isSaved(job.id) ? "bookmark-fill" : "bookmark"} size={13}/>{jstate.isSaved(job.id) ? "Saved" : "Save"}</button>
            <button onClick={() => !jstate.isApplied(job.id) && onApply(job)} disabled={jstate.isApplied(job.id)} style={{
              flex: 1, padding: "12px 16px", borderRadius: 10, border: "none",
              background: jstate.isApplied(job.id) ? "#16A34A" : P.accent, color: jstate.isApplied(job.id) ? "#fff" : P.accentInk,
              cursor: jstate.isApplied(job.id) ? "default" : "pointer", fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>{jstate.isApplied(job.id) ? <><Icon name="check" size={13} stroke={2.2}/> Application sent</> : <>Apply now <Icon name="arrow-right" size={13}/></>}</button>
          </div>
        </div>
      </div>
    );
  }

  function ApplyModal({ job, onClose, onSubmit }) {
    if (!job) return null;
    return (
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 440, background: P.panel, borderRadius: 14, padding: "26px 28px", border: `1px solid ${P.rule}` }}>
          <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase" }}>Apply</div>
          <div style={{ fontSize: 19, fontWeight: 500, margin: "4px 0 14px", letterSpacing: "-.01em", color: P.ink }}>{job.title}</div>
          <textarea placeholder="A short message…" style={{ width: "100%", minHeight: 92, border: `1px solid ${P.rule}`, background: P.panel, borderRadius: 10, padding: 12, fontSize: 13.5, fontFamily: FONT, color: P.ink, resize: "none", outline: "none" }}/>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button onClick={onClose} style={{ background: "transparent", border: "none", padding: "10px 14px", color: P.muted, cursor: "pointer", fontFamily: FONT, fontSize: 13 }}>Cancel</button>
            <button onClick={onSubmit} style={{ background: P.accent, color: P.accentInk, border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT, fontSize: 13 }}>Send →</button>
          </div>
        </div>
      </div>
    );
  }

  function Direction4() {
    const j = useJobsState();
    const [cat, setCat] = React.useState("all");
    const [open, setOpen] = React.useState(null);
    const [apply, setApply] = React.useState(null);
    const [sort, setSort] = React.useState("newest");
    const filtered = JOBS.filter((x) => cat === "all" || x.cat === cat).sort((a, b) => {
      if (sort === "pay") return midPay(b.pay) - midPay(a.pay);
      if (sort === "near") return a.distanceKm - b.distanceKm;
      return 0;
    });

    const avg = Math.round(filtered.reduce((s, x) => s + midPay(x.pay), 0) / Math.max(filtered.length, 1));

    return (
      <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* topbar */}
        <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RobosLogo accent={P.accent} size={22}/>
              <span style={{ fontWeight: 600, fontSize: 14, color: P.ink, letterSpacing: "-.01em" }}>RobosGig</span>
            </div>
            <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: P.muted }}>
              <span style={{ color: P.ink, fontWeight: 500 }}>Browse</span>
              <span>Applications</span>
              <span>Earnings</span>
              <span>Profile</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>
              Online · Vienna
            </div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: P.accent, color: P.accentInk, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
          </div>
        </div>

        {/* hero */}
        <div style={{ padding: "32px 32px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 10 }}>Worker · Browse</div>
            <h1 style={{ fontSize: 48, fontWeight: 500, letterSpacing: "-.03em", lineHeight: 1, margin: 0, color: P.ink }}>
              {filtered.length} jobs near you,<br/>
              <span style={{ color: P.accentText }}>ready to claim.</span>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${P.rule}`, borderRadius: 12, background: P.panel }}>
            <StatBlock label="Avg pay" value={`€${avg}`} sub="median range" mono/>
            <StatBlock label="Urgent" value={filtered.filter((x) => x.urgency === "urgent").length} sub="need cover today"/>
            <div style={{ flex: 1, padding: "14px 18px" }}>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>Saved</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: P.ink, marginTop: 4, letterSpacing: "-.015em", fontVariantNumeric: "tabular-nums" }}>{j.saved.length}</div>
              <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{j.applied.length} applied</div>
            </div>
          </div>
        </div>

        {/* filter rail */}
        <div style={{ padding: "12px 32px", borderTop: `1px solid ${P.rule}`, borderBottom: `1px solid ${P.rule}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: P.panel }}>
          {["all", ...Object.keys(CATS)].map((k) => {
            const sel = cat === k;
            return (
              <button key={k} onClick={() => setCat(k)} style={{
                height: 28, padding: "0 12px", borderRadius: 8, border: `1px solid ${sel ? P.accent : P.rule}`,
                background: sel ? P.accent : "transparent", color: sel ? P.accentInk : P.ink,
                fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              }}>{k === "all" ? "All" : CATS[k].label}</button>
            );
          })}
          <span style={{ flex: 1 }}/>
          <span style={{ fontSize: 11.5, color: P.muted }}>Sort by</span>
          {[["newest", "Newest"], ["pay", "Pay"], ["near", "Distance"]].map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} style={{
              height: 26, padding: "0 10px", borderRadius: 6, border: "none",
              background: sort === k ? P.rule : "transparent", color: sort === k ? P.ink : P.muted,
              fontSize: 12, fontFamily: FONT, cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>

        {/* grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px 32px", background: P.bg }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {filtered.map((job) => <Card key={job.id} job={job} jstate={j} onOpen={setOpen} onApply={setApply}/>)}
          </div>
        </div>

        <Detail job={open} onClose={() => setOpen(null)} jstate={j} onApply={(jb) => { setOpen(null); setApply(jb); }}/>
        <ApplyModal job={apply} onClose={() => setApply(null)} onSubmit={() => { j.apply(apply.id); setApply(null); }}/>
      </div>
    );
  }


// ─── Default export ─────────────────────────────────────────────────────────
export default Direction4;
