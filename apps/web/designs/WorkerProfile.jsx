// WorkerProfile.jsx — RobosGig "WorkerProfile" page
// Single self-contained JSX module extracted from the design prototype.
// All shared deps (data, helpers, icons, logo, fonts) are inlined below.
// Default-exports <WorkerProfile />. Drop into any React project (Vite/Next/CRA).

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

// ─── Direction 7 body ──────────────────────────────────────────────────
  const W = 1240, H = 880;
  const P = { bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A", muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5", accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F", soft: "#F5F5F3" };

  const SKILL_GROUPS = [
    { cat: "cleaning",   skills: ["Deep cleaning", "Move-out cleaning", "Window cleaning"] },
    { cat: "electrical", skills: ["Lamp installation", "Outlet installation", "Wiring repair"] },
    { cat: "plumbing",   skills: ["Appliance installation", "Drain unblocking", "Pipe repair"] },
    { cat: "general",    skills: ["Furniture assembly", "TV mounting", "Heavy lifting"] },
  ];

  function Field({ label, hint, children, full }) {
    return (
      <div style={{ gridColumn: full ? "1 / -1" : "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <label style={{ fontSize: 11.5, fontWeight: 500, color: P.ink, letterSpacing: "-.005em" }}>{label}</label>
          {hint && <span style={{ fontSize: 10.5, color: P.sub }}>{hint}</span>}
        </div>
        {children}
      </div>
    );
  }
  const inputStyle = { padding: "10px 12px", border: `1px solid ${P.rule}`, borderRadius: 8, fontSize: 13, fontFamily: FONT, color: P.ink, background: P.panel, outline: "none" };

  function SkillChip({ label, active, onClick, removable }) {
    return (
      <button onClick={onClick} style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999,
        border: active ? `1px solid ${P.ink}` : `1px solid ${P.rule}`,
        background: active ? P.ink : P.panel, color: active ? "#fff" : P.ink,
        fontSize: 11.5, fontFamily: FONT, fontWeight: active ? 500 : 400, cursor: "pointer",
      }}>
        {active && <span style={{ color: P.accent, fontSize: 10 }}>✓</span>}
        {label}
        {removable && <span style={{ opacity: .6, marginLeft: 2 }}>×</span>}
      </button>
    );
  }

  function Direction7() {
    const [skills, setSkills] = React.useState(["Deep cleaning", "Lamp installation"]);
    const [available, setAvailable] = React.useState(true);
    const [tab, setTab] = React.useState("profile");
    const toggleSkill = (s) => setSkills((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);

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
            <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Profile<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
            <span style={{ color: P.muted }}>Pricing</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: available ? P.accent : P.sub, boxShadow: available ? `0 0 6px ${P.accent}` : "none" }}/>
              {available ? "Online · Vienna" : "Offline"}
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
          </div>
        </div>

        {/* page header */}
        <div style={{ padding: "26px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Worker profile</div>
            <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: 0, lineHeight: 1, color: P.ink }}>My profile</h1>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: P.muted, marginRight: 8 }}>Public preview</span>
            <button style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>Preview as client →</button>
            <button style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 12.5, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Save changes</button>
          </div>
        </div>

        {/* tab strip */}
        <div style={{ padding: "20px 40px 0", flexShrink: 0, borderBottom: `1px solid ${P.rule}` }}>
          <div style={{ display: "flex", gap: 22 }}>
            {[
              { id: "profile", label: "Profile" },
              { id: "identity", label: "Identity" },
              { id: "security", label: "Security" },
              { id: "earnings", label: "Earnings", external: true },
            ].map((t) => (
              <button key={t.id} onClick={() => !t.external && setTab(t.id)} style={{
                padding: "10px 0", border: "none", background: "transparent",
                borderBottom: `2px solid ${tab === t.id ? P.ink : "transparent"}`,
                color: tab === t.id ? P.ink : P.muted, fontWeight: tab === t.id ? 500 : 400,
                fontSize: 13, fontFamily: FONT, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                {t.label}
                {t.external && <span style={{ fontSize: 10, color: P.sub }}>↗</span>}
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* left: identity card */}
          <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 22 }}>
            {/* avatar + name */}
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, letterSpacing: "-.02em" }}>cv</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-.012em", color: P.ink }}>ches veliu</div>
                <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>xhesinaveliuu@gmail.com</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "3px 9px", borderRadius: 999, background: "#F0FAE0", color: P.accentText, fontSize: 11, fontWeight: 500 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  Verified
                </div>
              </div>
              <button style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.muted, cursor: "pointer" }}>Change photo</button>
            </div>

            <div style={{ borderTop: `1px solid ${P.rule}`, paddingTop: 20 }}>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>Personal info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="First name"><input style={inputStyle} defaultValue="ches"/></Field>
                <Field label="Last name"><input style={inputStyle} defaultValue="veliu"/></Field>
                <Field label="Phone" full>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: P.sub, fontSize: 12 }}>☏</span>
                    <input style={{ ...inputStyle, paddingLeft: 30, width: "100%", boxSizing: "border-box" }} defaultValue="0692980057"/>
                  </div>
                </Field>
                <Field label="Date of birth" hint="Clients see your age, not the date" full>
                  <input type="date" style={inputStyle} defaultValue="2008-05-08"/>
                </Field>
                <Field label="Bio" hint="Visible on your public profile" full>
                  <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: FONT }} defaultValue="i am the best there is"/>
                </Field>
                <Field label="Hourly rate (€)">
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: P.sub, fontSize: 12, fontFamily: MONO }}>€</span>
                    <input style={{ ...inputStyle, paddingLeft: 28, width: "100%", boxSizing: "border-box" }} defaultValue="20"/>
                  </div>
                </Field>
                <Field label="Location" hint="Used for distance">
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: P.sub, fontSize: 12 }}>◉</span>
                    <input style={{ ...inputStyle, paddingLeft: 28, width: "100%", boxSizing: "border-box" }} defaultValue="Tirana"/>
                  </div>
                </Field>
                <Field full>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: `1px solid ${P.rule}`, borderRadius: 10, background: P.soft }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: P.ink }}>Available for work</div>
                      <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>Visible to clients · turn off when fully booked</div>
                    </div>
                    <button onClick={() => setAvailable((v) => !v)} style={{
                      width: 38, height: 22, borderRadius: 999, border: "none", background: available ? P.ink : P.rule,
                      position: "relative", cursor: "pointer", padding: 0,
                    }}>
                      <span style={{ position: "absolute", top: 3, left: available ? 18 : 3, width: 16, height: 16, borderRadius: 999, background: available ? P.accent : "#fff", transition: "left .15s" }}/>
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* right: skills card */}
          <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>My skills</div>
              <div style={{ fontSize: 12.5, color: P.muted, marginTop: 6, lineHeight: 1.5 }}>These appear on your profile and help clients find you. Picked <span style={{ color: P.ink, fontWeight: 500 }}>{skills.length}</span> of any.</div>
            </div>

            {/* selected skills */}
            <div style={{ padding: "14px 14px 12px", border: `1px solid ${P.rule}`, borderRadius: 10, background: P.soft, minHeight: 60 }}>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Your active skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.length === 0 && <div style={{ fontSize: 12, color: P.sub, padding: "4px 0" }}>No skills yet — pick a few from below.</div>}
                {skills.map((s) => <SkillChip key={s} label={s} active removable onClick={() => setSkills((c) => c.filter((x) => x !== s))}/>)}
              </div>
            </div>

            {/* add custom */}
            <div>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Add a custom skill</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. Tile installation, HVAC, Welding…"/>
                <button style={{ padding: "0 16px", borderRadius: 8, border: "none", background: P.accent, color: P.accentInk, fontSize: 12.5, fontFamily: FONT, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>+ Add</button>
              </div>
            </div>

            {/* browse */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>Browse skills</div>
              {SKILL_GROUPS.map((g) => {
                const cat = CATS[g.cat] || { label: g.cat[0].toUpperCase() + g.cat.slice(1), color: P.muted };
                return (
                  <div key={g.cat}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: 3, background: cat.color }}/>
                      {cat.label}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {g.skills.map((s) => <SkillChip key={s} label={s} active={skills.includes(s)} onClick={() => toggleSkill(s)}/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
          <span>profile · 100% complete</span><span>·</span>
          <span>{skills.length} skill{skills.length !== 1 ? "s" : ""}</span><span>·</span>
          <span>verified · {available ? "available" : "offline"}</span>
          <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
        </div>
      </div>
    );
  }


// ─── Default export ─────────────────────────────────────────────────────────
export default Direction7;
