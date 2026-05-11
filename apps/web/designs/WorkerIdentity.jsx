// WorkerIdentity.jsx — RobosGig "WorkerIdentity" page
// Single self-contained JSX module extracted from the design prototype.
// All shared deps (data, helpers, icons, logo, fonts) are inlined below.
// Default-exports <WorkerIdentity />. Drop into any React project (Vite/Next/CRA).

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

// ─── Direction 9 body ──────────────────────────────────────────────────
  const W = 1240, H = 880;
  const P = { bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A", muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5", accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F", soft: "#F5F5F3", positive: "#15803D", warn: "#B45309" };

  const STEPS = [
    { id: "email",    label: "Email confirmed",     status: "done",      hint: "xhesinaveliuu@gmail.com" },
    { id: "phone",    label: "Phone verified",      status: "done",      hint: "+355 692 980 057" },
    { id: "id",       label: "Government ID",       status: "in-review", hint: "Submitted Tue · usually 1–2 hours" },
    { id: "selfie",   label: "Selfie + liveness",   status: "todo",      hint: "30-second face match" },
    { id: "address",  label: "Proof of address",    status: "todo",      hint: "Utility bill or bank statement, < 90 days" },
    { id: "skills",   label: "Skills verification", status: "optional",  hint: "Optional · unlocks Pro badge" },
  ];

  const STATUS_STYLE = {
    done:        { bg: "#F0FAE0", fg: P.accentText, dot: P.accent,   label: "Verified" },
    "in-review": { bg: "#FEF3C7", fg: "#92400E",   dot: "#F59E0B",   label: "In review" },
    todo:        { bg: "#FFFFFF", fg: P.muted,     dot: P.rule,      label: "Required" },
    optional:    { bg: "#F5F5F5", fg: P.muted,     dot: P.sub,       label: "Optional" },
  };

  function StepDot({ status, n }) {
    const s = STATUS_STYLE[status];
    if (status === "done") {
      return <div style={{ width: 22, height: 22, borderRadius: 12, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={P.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
      </div>;
    }
    if (status === "in-review") {
      return <div style={{ width: 22, height: 22, borderRadius: 12, background: "#FEF3C7", color: "#92400E", display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${s.dot}` }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: s.dot, animation: "pulse 1.6s infinite" }}/>
      </div>;
    }
    return <div style={{ width: 22, height: 22, borderRadius: 12, border: `1.5px dashed ${P.rule}`, color: P.muted, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 500, fontFamily: MONO, background: P.panel }}>{n}</div>;
  }

  function Direction9() {
    const done = STEPS.filter((s) => s.status === "done").length;
    const required = STEPS.filter((s) => s.status !== "optional").length;
    const pct = Math.round((done / required) * 100);
    return (
      <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: .4 } }`}</style>
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RobosLogo accent={P.ink} size={24}/>
            <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
            <span style={{ color: P.muted }}>Browse jobs</span>
            <span style={{ color: P.muted }}>Applications</span>
            <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Profile<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
            <span style={{ color: P.muted }}>Pricing</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>Online · Vienna
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
          </div>
        </div>

        {/* page header */}
        <div style={{ padding: "26px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Worker profile</div>
            <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: 0, lineHeight: 1, color: P.ink }}>Identity verification</h1>
            <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>Verified workers get the green badge, more requests, and instant payouts.</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>Save &amp; finish later</button>
            <button style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 12.5, fontFamily: FONT, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>Continue verification →</button>
          </div>
        </div>

        {/* tab strip */}
        <div style={{ padding: "20px 40px 0", flexShrink: 0, borderBottom: `1px solid ${P.rule}` }}>
          <div style={{ display: "flex", gap: 22 }}>
            {[
              { id: "profile",  label: "Profile",  active: false },
              { id: "identity", label: "Identity", active: true  },
              { id: "security", label: "Security", active: false },
              { id: "earnings", label: "Earnings", external: true },
            ].map((t) => (
              <button key={t.id} style={{
                padding: "10px 0", border: "none", background: "transparent",
                borderBottom: `2px solid ${t.active ? P.ink : "transparent"}`,
                color: t.active ? P.ink : P.muted, fontWeight: t.active ? 500 : 400,
                fontSize: 13, fontFamily: FONT, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                {t.label}
                {t.external && <span style={{ fontSize: 10, color: P.sub }}>↗</span>}
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px 28px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
          {/* LEFT: progress + checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* progress card */}
            <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>Verification progress</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-.03em", color: P.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{done}<span style={{ color: P.muted }}>/{required}</span></span>
                    <span style={{ fontSize: 12, color: P.muted }}>steps complete</span>
                  </div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "#F59E0B", animation: "pulse 1.6s infinite" }}/>1 step in review
                </div>
              </div>
              <div style={{ marginTop: 14, height: 6, borderRadius: 999, background: P.soft, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: P.ink }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: P.muted, fontFamily: MONO }}>
                <span>{pct}% complete</span>
                <span>~5 min remaining</span>
              </div>
            </div>

            {/* checklist */}
            <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${P.rule}`, fontSize: 12, fontWeight: 500, color: P.ink }}>Checklist</div>
              {STEPS.map((s, i) => {
                const st = STATUS_STYLE[s.status];
                const isFocus = s.status === "in-review" || (s.status === "todo" && !STEPS.slice(0, i).some((p) => p.status === "todo"));
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < STEPS.length - 1 ? `1px solid ${P.rule}` : "none", background: isFocus && s.status === "todo" ? P.soft : P.panel }}>
                    <StepDot status={s.status} n={i + 1}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: P.ink, fontWeight: 500, letterSpacing: "-.005em" }}>{s.label}</div>
                      <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2 }}>{s.hint}</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: st.bg, color: st.fg, fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em", border: s.status === "todo" ? `1px solid ${P.rule}` : "none" }}>
                      {st.label}
                    </span>
                    {s.status === "todo" && isFocus && (
                      <button style={{ padding: "6px 12px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 11.5, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Start →</button>
                    )}
                    {s.status === "in-review" && (
                      <button style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, color: P.muted, fontSize: 11.5, fontFamily: FONT, cursor: "pointer" }}>View</button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* trust footer */}
            <div style={{ padding: "14px 20px", border: `1px solid ${P.rule}`, borderRadius: 14, background: P.panel, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: P.soft, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9.4 8 10 4.5-.6 8-5 8-10V6l-8-4z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: P.ink, fontWeight: 500 }}>Bank-grade encryption</div>
                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>Documents are stored encrypted, reviewed by a human, and deleted 30 days after verification.</div>
              </div>
              <a style={{ fontSize: 11.5, color: P.muted, textDecoration: "underline", cursor: "pointer" }}>Privacy policy</a>
            </div>
          </div>

          {/* RIGHT: ID upload focus */}
          <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "22px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>Step 3 of 5</div>
                <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-.012em", color: P.ink, marginTop: 6 }}>Government-issued ID</div>
                <div style={{ fontSize: 12, color: P.muted, marginTop: 4, lineHeight: 1.5 }}>Upload a clear photo of your passport, national ID, or driver's licence. Both sides if applicable.</div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "#F59E0B", animation: "pulse 1.6s infinite" }}/>In review
              </span>
            </div>

            {/* doc-type tabs */}
            <div style={{ display: "flex", gap: 6 }}>
              {["Passport", "National ID", "Driver's licence"].map((t, i) => (
                <button key={t} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10,
                  border: i === 1 ? `1px solid ${P.ink}` : `1px solid ${P.rule}`,
                  background: i === 1 ? P.ink : P.panel,
                  color: i === 1 ? "#fff" : P.ink, fontSize: 12, fontFamily: FONT, fontWeight: i === 1 ? 500 : 400, cursor: "pointer",
                }}>{t}</button>
              ))}
            </div>

            {/* uploaded preview */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Front side", uploaded: true,  filename: "id-front.jpg", size: "1.4 MB" },
                { label: "Back side",  uploaded: false, filename: null, size: null },
              ].map((d) => (
                <div key={d.label} style={{
                  borderRadius: 12, border: d.uploaded ? `1px solid ${P.rule}` : `1.5px dashed ${P.rule}`,
                  background: d.uploaded ? P.panel : P.soft, padding: d.uploaded ? 10 : 18, minHeight: 150, display: "flex", flexDirection: "column",
                }}>
                  {d.uploaded ? (
                    <>
                      {/* fake ID preview */}
                      <div style={{ flex: 1, borderRadius: 8, background: "linear-gradient(135deg, #1F2937 0%, #374151 100%)", padding: 12, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 100% 0%, ${P.accent}22, transparent 60%)` }}/>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                          <div style={{ fontSize: 8, fontFamily: MONO, letterSpacing: ".18em", opacity: .7 }}>REPUBLIKA E SHQIPËRISË</div>
                          <div style={{ width: 22, height: 28, borderRadius: 3, background: "rgba(255,255,255,.12)" }}/>
                        </div>
                        <div style={{ position: "relative" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "-.005em" }}>VELIU, CHES</div>
                          <div style={{ fontSize: 7.5, fontFamily: MONO, opacity: .7, marginTop: 3, letterSpacing: ".06em" }}>I•••••••2 · DOB 08.05.2008</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 7, background: P.accent, color: P.accentInk, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, color: P.ink, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.filename}</div>
                          <div style={{ fontSize: 10.5, color: P.sub, fontFamily: MONO }}>{d.label} · {d.size}</div>
                        </div>
                        <button style={{ padding: 4, border: "none", background: "transparent", color: P.muted, cursor: "pointer" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: P.muted, textAlign: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: P.panel, border: `1px solid ${P.rule}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16M4 12h16"/></svg>
                      </div>
                      <div style={{ fontSize: 12, color: P.ink, fontWeight: 500 }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: P.muted }}>Drag &amp; drop or <span style={{ color: P.ink, textDecoration: "underline" }}>browse</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* requirements */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", borderRadius: 10, background: P.soft }}>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>Photo requirements</div>
              {[
                "All four corners visible",
                "No glare or blur",
                "Original document — no photocopies or screenshots",
                "Files: JPG, PNG, or PDF · max 10 MB each",
              ].map((r) => (
                <div key={r} style={{ display: "flex", gap: 8, fontSize: 11.5, color: P.muted, alignItems: "flex-start" }}>
                  <span style={{ marginTop: 5, width: 4, height: 4, borderRadius: 2, background: P.muted, flexShrink: 0 }}/>{r}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>Replace front</button>
              <button style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: P.accent, color: P.accentInk, fontSize: 12.5, fontFamily: FONT, fontWeight: 600, cursor: "pointer" }}>Upload back side →</button>
            </div>
          </div>
        </div>

        <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
          <span>verification {pct}%</span><span>·</span>
          <span>{done}/{required} required</span><span>·</span>
          <span>last update 2h ago</span>
          <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
        </div>
      </div>
    );
  }


// ─── Default export ─────────────────────────────────────────────────────────
export default Direction9;
