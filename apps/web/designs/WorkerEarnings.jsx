// WorkerEarnings.jsx — RobosGig "WorkerEarnings" page
// Single self-contained JSX module extracted from the design prototype.
// All shared deps (data, helpers, icons, logo, fonts) are inlined below.
// Default-exports <WorkerEarnings />. Drop into any React project (Vite/Next/CRA).

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

// ─── Direction 8 body ──────────────────────────────────────────────────
  const W = 1240, H = 880;
  const P = { bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A", muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5", accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F", soft: "#F5F5F3", positive: "#15803D", warn: "#B45309" };

  // 12-week sparkline data (mock)
  const SERIES = [0, 0, 80, 120, 90, 240, 180, 320, 260, 410, 480, 360];
  const TX = [
    { id: "t1", label: "Bathroom retiling — Daniel B.",      cat: "plumbing",   date: "26 Apr 2026", amount: +240, status: "paid",     ref: "TXN-8819" },
    { id: "t2", label: "Apartment deep clean — Priti S.",    cat: "cleaning",   date: "18 Apr 2026", amount: +110, status: "paid",     ref: "TXN-8634" },
    { id: "t3", label: "Service fee (15%)",                  cat: "fee",        date: "18 Apr 2026", amount:  -16, status: "paid",     ref: "FEE-8634" },
    { id: "t4", label: "Lamp install (5 fixtures) — Erjon L.", cat: "electrical", date: "11 May 2026", amount: +360, status: "escrow",   ref: "ESC-9001" },
    { id: "t5", label: "Withdrawal · Raiffeisen ****4421",   cat: "payout",     date: "01 Apr 2026", amount: -300, status: "withdrawn", ref: "WDR-7720" },
  ];

  function Spark({ data, w = 280, h = 60, color = "#0A0A0A", fill = "rgba(132,204,22,.18)" }) {
    const max = Math.max(...data, 1), min = 0;
    const step = w / (data.length - 1);
    const pts = data.map((v, i) => [i * step, h - ((v - min) / (max - min)) * (h - 6) - 3]);
    const pathD = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const areaD = pathD + ` L${w},${h} L0,${h} Z`;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <path d={areaD} fill={fill} stroke="none"/>
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => i === pts.length - 1 && <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color}/>)}
      </svg>
    );
  }

  const TX_DOT = { plumbing: "#3B82F6", cleaning: "#10B981", electrical: "#F59E0B", general: "#737373", fee: "#A3A3A3", payout: "#0A0A0A" };
  const TX_BG  = { paid: "#F0FAE0", escrow: "#FEF3C7", withdrawn: "#F5F5F5" };
  const TX_FG  = { paid: P.accentText, escrow: "#92400E", withdrawn: P.muted };

  function Stat({ label, value, sub, big, accent, mono }) {
    return (
      <div style={{ flex: 1, padding: "16px 18px", background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 12 }}>
        <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: big ? 32 : 22, fontWeight: 500, color: accent || P.ink, marginTop: 8, letterSpacing: "-.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums", fontFamily: mono ? MONO : FONT }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: P.sub, marginTop: 6 }}>{sub}</div>}
      </div>
    );
  }

  function Direction8() {
    const totalEarned = SERIES.reduce((s, v) => s + v, 0);
    return (
      <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RobosLogo accent={P.ink} size={24}/>
            <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
            <span style={{ color: P.muted }}>Browse jobs</span>
            <span style={{ color: P.muted }}>Applications</span>
            <span style={{ color: P.muted }}>Profile</span>
            <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Earnings<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>Online · Vienna
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
          </div>
        </div>

        {/* page header + range filter */}
        <div style={{ padding: "26px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Earnings &amp; activity</div>
            <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: 0, lineHeight: 1, color: P.ink }}>Wallet</h1>
            <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>Where your money sits, lands, and leaves.</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel }}>
              {["7d", "30d", "90d", "All"].map((r, i) => (
                <button key={r} style={{
                  padding: "6px 12px", borderRadius: 999, border: "none",
                  background: i === 1 ? P.ink : "transparent",
                  color: i === 1 ? "#fff" : P.muted, fontSize: 11.5, fontFamily: FONT, fontWeight: i === 1 ? 500 : 400, cursor: "pointer",
                }}>{r}</button>
              ))}
            </div>
            <button style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12.5, fontFamily: FONT, color: P.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/></svg>Export CSV
            </button>
            <button style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 12.5, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Withdraw →</button>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* hero balance card */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
            <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "22px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>Total earned · last 90 days</div>
                  <div style={{ fontSize: 56, fontWeight: 500, color: P.ink, letterSpacing: "-.035em", lineHeight: 1, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
                    €{totalEarned.toLocaleString()}<span style={{ fontSize: 18, color: P.muted, fontWeight: 400, marginLeft: 4 }}>.00</span>
                  </div>
                  <div style={{ fontSize: 12, color: P.positive, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    ↑ +€420 vs prior 90d <span style={{ color: P.muted }}>· 4.2× growth</span>
                  </div>
                </div>
                <Spark data={SERIES}/>
              </div>
              {/* split bar */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", background: P.soft }}>
                  <div style={{ width: "62%", background: P.ink }}/>
                  <div style={{ width: "20%", background: P.accent }}/>
                  <div style={{ width: "12%", background: "#F59E0B" }}/>
                  <div style={{ width: "6%",  background: "#A3A3A3" }}/>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: P.muted, letterSpacing: ".02em" }}>
                  <span><span style={{ color: P.ink }}>●</span> Plumbing 62%</span>
                  <span><span style={{ color: P.accent }}>●</span> Cleaning 20%</span>
                  <span><span style={{ color: "#F59E0B" }}>●</span> Electrical 12%</span>
                  <span><span style={{ color: "#A3A3A3" }}>●</span> General 6%</span>
                </div>
              </div>
            </div>

            {/* secondary balance breakdowns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10 }}>
              <Stat label="Available to withdraw" value="€840.00" sub="payout in 1 business day" big accent={P.positive} mono/>
              <Stat label="In escrow" value="€360.00" sub="1 active job" accent={P.warn} mono/>
              <Stat label="Lifetime payout" value="€1,920" sub="across 14 jobs" mono/>
              <Stat label="Avg per job" value="€137" sub="vs €112 platform avg" mono/>
            </div>
          </div>

          {/* activity stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            <Stat label="Jobs done" value="14" sub="3 this month"/>
            <Stat label="Rating" value={<span>4.92<span style={{ color: P.accent, marginLeft: 4 }}>★</span></span>} sub="12 reviews"/>
            <Stat label="Acceptance rate" value="84%" sub="below avg 91%"/>
            <Stat label="Applications sent" value="38" sub="12 last 30d"/>
            <Stat label="Repeat clients" value="6" sub="43% rebooking"/>
          </div>

          {/* transactions + payout method */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${P.rule}` }}>
                <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-.005em", color: P.ink, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Transactions
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 18, padding: "0 6px", borderRadius: 999, background: P.ink, color: "#fff", fontSize: 10.5, fontWeight: 600 }}>{TX.length}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.ink}`, background: P.ink, color: "#fff", fontSize: 11, fontFamily: FONT, cursor: "pointer" }}>All</button>
                  <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, color: P.muted, fontSize: 11, fontFamily: FONT, cursor: "pointer" }}>Income</button>
                  <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, color: P.muted, fontSize: 11, fontFamily: FONT, cursor: "pointer" }}>Payouts</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", padding: "0 22px", fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, height: 30, alignItems: "center", borderBottom: `1px solid ${P.rule}`, columnGap: 14 }}>
                <span>Date</span><span>Item</span><span>Status</span><span style={{ textAlign: "right" }}>Amount</span><span style={{ fontFamily: MONO }}>Ref</span>
              </div>
              {TX.map((t, i) => (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", padding: "12px 22px", alignItems: "center", borderBottom: i < TX.length - 1 ? `1px solid ${P.rule}` : "none", fontSize: 12, columnGap: 14 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: P.muted, fontVariantNumeric: "tabular-nums" }}>{t.date}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: TX_DOT[t.cat], flexShrink: 0 }}/>
                    <span style={{ color: P.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 999, background: TX_BG[t.status], color: TX_FG[t.status], fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em" }}>{t.status}</span>
                  <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", fontWeight: 500, color: t.amount > 0 ? P.positive : P.ink, textAlign: "right" }}>
                    {t.amount > 0 ? "+" : "−"}€{Math.abs(t.amount).toFixed(2)}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.sub }}>{t.ref}</span>
                </div>
              ))}
            </div>

            {/* payout method */}
            <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: P.ink, letterSpacing: "-.005em" }}>Payout method</div>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#0A0A0A", color: "#fff", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 100% 0%, ${P.accent}33, transparent 60%)` }}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                  <span style={{ fontSize: 10.5, color: "#A3A3A3", letterSpacing: ".14em", textTransform: "uppercase" }}>Bank account</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: P.accent, color: P.accentInk, fontWeight: 600 }}>Default</span>
                </div>
                <div style={{ fontSize: 14, fontFamily: MONO, letterSpacing: ".06em", position: "relative" }}>•••• •••• •••• 4421</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#A3A3A3", position: "relative" }}>
                  <span>RAIFFEISEN BANK</span><span>CHES VELIU</span>
                </div>
              </div>
              <button style={{ padding: "8px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>+ Add another method</button>

              <div style={{ borderTop: `1px solid ${P.rule}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>Auto-payout</div>
                <div style={{ fontSize: 11.5, color: P.muted, lineHeight: 1.5 }}>Funds clear from escrow 24h after job completion. Auto-withdraw sweeps your balance every Monday.</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                  <span style={{ fontSize: 12, color: P.ink }}>Auto-withdraw weekly</span>
                  <button style={{ width: 34, height: 20, borderRadius: 999, border: "none", background: P.ink, position: "relative", cursor: "pointer", padding: 0 }}>
                    <span style={{ position: "absolute", top: 3, left: 17, width: 14, height: 14, borderRadius: 999, background: P.accent }}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
          <span>balance €1,200</span><span>·</span>
          <span>14 jobs</span><span>·</span>
          <span>4.92★</span><span>·</span>
          <span>last payout 01 Apr</span>
          <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
        </div>
      </div>
    );
  }


// ─── Default export ─────────────────────────────────────────────────────────
export default Direction8;
