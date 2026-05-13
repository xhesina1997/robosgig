// GlossyBrowseJobs.jsx — Worker · Browse jobs in glossy / Apple-glass style.
// Same data model as BrowseJobs.jsx but redressed in the GlossyHome vocabulary:
// liquid-glass nav, gradient hero number, frosted cards, lime accent.
// Single self-contained JSX module. Default-exports <GlossyBrowseJobs />.

import React, { useState, useMemo } from "react";

const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  ink: "#0A0A0A", paper: "#F4F4F1", muted: "#737373", sub: "#A3A3A3",
  accent: "#84CC16", accentText: "#4D7C0F",
};

// ─── Data ───────────────────────────────────────────────────────────────────
const JOBS = [
  { id: "j2", title: "Silicone Joint Renewal in Shower", desc: "Removal of old silicone sealing and application of new joints in a shower area. Cleaning, prep, fresh waterproof sealant.",     cat: "plumbing",   pay: [60, 120],  urgency: "normal", posted: "26 Apr", distanceKm: 0.1, client: { short: "AG", color: "#E54C84", city: "Wien" } },
  { id: "j3", title: "Assemble IKEA PAX Wardrobe (3m)",  desc: "Two-section PAX wardrobe with sliding doors and interior drawer system. All parts on site. Tools provided.",                    cat: "assembly",   pay: [80, 140],  urgency: "urgent", posted: "27 Apr", distanceKm: 1.2, client: { short: "LM", color: "#0F8A5F", city: "Neubau" } },
  { id: "j4", title: "Fix Leaky Kitchen Faucet",         desc: "Single-lever mixer drips at the base. Likely cartridge replacement. Client has a spare cartridge on hand.",                     cat: "plumbing",   pay: [40, 90],   urgency: "urgent", posted: "27 Apr", distanceKm: 0.8, client: { short: "SK", color: "#C26A2A", city: "Mariahilf" } },
  { id: "j5", title: "Paint Living Room (35 m²)",        desc: "Two-coat interior paint on prepped walls. Furniture moved to centre, covered. White ceiling untouched. Paint supplied.",         cat: "painting",   pay: [280, 450], urgency: "normal", posted: "25 Apr", distanceKm: 2.4, client: { short: "FB", color: "#7A5AE0", city: "Hietzing" } },
  { id: "j6", title: "Replace 3 Bathroom Light Fixtures",desc: "Swap three ceiling fixtures for new IP44 LED units (supplied). Standard junction boxes. Power can be cut at the panel.",         cat: "electrical", pay: [70, 140],  urgency: "low",    posted: "24 Apr", distanceKm: 1.5, client: { short: "MT", color: "#1E7A8C", city: "Leopoldstadt" } },
  { id: "j7", title: "Gallery Wall — Hang 12 Frames",    desc: "Mixed-size frames already laid out on floor. Drywall, no concealed lines. Level + spacer guidance preferred.",                   cat: "mounting",   pay: [45, 80],   urgency: "normal", posted: "28 Apr", distanceKm: 0.6, client: { short: "EV", color: "#B83D5B", city: "Josefstadt" } },
  { id: "j8", title: "Assemble Patio Furniture (Café)",  desc: "Six tables, twelve chairs, two parasols + bases. Boxed flatpack. Outside terrace, level paving. Café opens at 16:00.",            cat: "assembly",   pay: [180, 280], urgency: "urgent", posted: "28 Apr", distanceKm: 3.1, client: { short: "CS", color: "#D4762A", city: "Landstraße" } },
];

const CATS = {
  all:        { label: "All",        color: P.muted },
  plumbing:   { label: "Plumbing",   color: "#3B82F6" },
  assembly:   { label: "Assembly",   color: "#F59E0B" },
  painting:   { label: "Painting",   color: "#EC4899" },
  electrical: { label: "Electrical", color: "#EAB308" },
  mounting:   { label: "Mounting",   color: "#10B981" },
};

const URG = {
  low:    { label: "Low",    bg: "rgba(10,10,10,.05)", fg: "#525252" },
  normal: { label: "Normal", bg: "rgba(10,10,10,.05)", fg: "#525252" },
  urgent: { label: "Urgent", bg: "rgba(220,38,38,.10)", fg: "#DC2626" },
};

const midPay = (r) => Math.round((r[0] + r[1]) / 2);
const fmtDist = (km) => (km < 1 ? `${(km * 1000) | 0} m` : `${km.toFixed(1)} km`);

// ─── Logo ───────────────────────────────────────────────────────────────────
const RobosMark = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="3.5" y="9.5" width="25" height="16.5" rx="5" fill="#0A0A0A"/>
    <rect x="14.5" y="4" width="3" height="5" rx="1.5" fill="#0A0A0A"/>
    <circle cx="16" cy="3.4" r="1.6" fill="#84CC16"/>
    <rect x="9" y="14.5" width="5" height="5" rx="2.5" fill="#84CC16"/>
    <rect x="18" y="14.5" width="5" height="5" rx="2.5" fill="#84CC16"/>
    <rect x="12.5" y="23" width="7" height="1.6" rx=".8" fill="#84CC16" opacity=".9"/>
  </svg>
);

const Lime = () => <span style={{ width: 8, height: 8, borderRadius: 5, background: P.accent, boxShadow: `0 0 10px ${P.accent}` }}/>;

// ─── One-time inject (shared with GlossyHome — same id so dedupes safely) ──
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("glossy-styles-jobs")) return;
  const s = document.createElement("style");
  s.id = "glossy-styles-jobs";
  s.textContent = `
    .glj-body{background:
      radial-gradient(ellipse 70% 50% at 10% 0%, rgba(132,204,22,.10), transparent 60%),
      radial-gradient(ellipse 60% 50% at 100% 30%, rgba(90,86,224,.10), transparent 60%),
      radial-gradient(ellipse 60% 60% at 50% 100%, rgba(236,72,153,.06), transparent 60%),
      #F4F4F1;
      min-height:100vh;padding:48px 32px 80px;font-family:${FONT};color:#0A0A0A;-webkit-font-smoothing:antialiased;}
    .glj-nav{position:sticky;top:24px;z-index:5;max-width:1160px;margin:0 auto 32px;display:flex;align-items:center;justify-content:space-between;padding:10px 14px 10px 18px;background:rgba(255,255,255,.55);backdrop-filter:saturate(160%) blur(24px);-webkit-backdrop-filter:saturate(160%) blur(24px);border:1px solid rgba(255,255,255,.7);border-radius:999px;box-shadow:0 1px 0 rgba(255,255,255,.8) inset,0 -1px 0 rgba(10,10,10,.04) inset,0 10px 30px -10px rgba(10,10,10,.18)}
    .glj-navlink{padding:8px 14px;border-radius:999px;font-size:13px;color:#737373;text-decoration:none;transition:.15s;cursor:pointer}
    .glj-navlink:hover{background:rgba(255,255,255,.6);color:#0A0A0A}
    .glj-navlink.on{background:rgba(10,10,10,.92);color:#fff;font-weight:500;box-shadow:0 4px 12px rgba(10,10,10,.18)}
    .glj-card{position:relative;border-radius:22px;padding:22px;overflow:hidden;isolation:isolate;background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,.4));border:1px solid rgba(255,255,255,.65);backdrop-filter:saturate(160%) blur(16px);-webkit-backdrop-filter:saturate(160%) blur(16px);box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 -1px 0 rgba(10,10,10,.04) inset,0 20px 40px -22px rgba(10,10,10,.22),0 6px 12px -6px rgba(10,10,10,.08);transition:transform .18s,box-shadow .18s}
    .glj-card::before{content:"";position:absolute;inset:0;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,0) 40%);pointer-events:none;mix-blend-mode:overlay;opacity:.7;z-index:0}
    .glj-card>*{position:relative;z-index:1}
    .glj-card:hover{transform:translateY(-3px)}
    .glj-chip{padding:7px 13px;border-radius:999px;background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.7);font-size:12px;color:#0A0A0A;backdrop-filter:blur(8px);display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-family:${FONT};font-weight:500;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
    .glj-chip.on{background:rgba(10,10,10,.92);color:#fff;border-color:transparent}
    .glj-btn{padding:11px 18px;border-radius:12px;border:none;cursor:pointer;font-family:${FONT};font-size:13px;font-weight:600;color:#fff;background:linear-gradient(180deg,#1F1F1F 0%,#0A0A0A 100%);box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 -1px 0 rgba(0,0,0,.4) inset,0 8px 18px -6px rgba(10,10,10,.45);transition:transform .12s;display:inline-flex;align-items:center;gap:8px}
    .glj-btn:hover{transform:translateY(-1px)}
    .glj-btn-ghost{padding:11px 16px;border-radius:12px;cursor:pointer;font-family:${FONT};font-size:13px;font-weight:500;color:#0A0A0A;background:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.75);backdrop-filter:blur(10px);box-shadow:0 1px 0 rgba(255,255,255,.7) inset;display:inline-flex;align-items:center;gap:6px}
    .glj-btn-ghost:hover{background:rgba(255,255,255,.85)}
    .glj-hero-num{font-size:72px;font-weight:600;letter-spacing:-.04em;line-height:.9;background:linear-gradient(180deg,#0A0A0A 0%,#404040 100%);-webkit-background-clip:text;background-clip:text;color:transparent;font-variant-numeric:tabular-nums}
    .glj-hero-num em{font-style:normal;background:linear-gradient(180deg,#A3E635 0%,#4D7C0F 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  `;
  document.head.appendChild(s);
}

// ─── Sub-components ────────────────────────────────────────────────────────
function JobCard({ job, saved, onToggleSave, onApply }) {
  const cat = CATS[job.cat];
  const urg = URG[job.urgency];
  return (
    <div className="glj-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* head row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,.65)", border: "1px solid rgba(255,255,255,.75)", fontSize: 11, color: P.ink, fontFamily: MONO, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 500 }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: cat.color }}/>
          {cat.label}
        </span>
        <button onClick={() => onToggleSave(job.id)} title={saved ? "Saved" : "Save"} style={{ width: 30, height: 30, borderRadius: 10, border: "1px solid rgba(255,255,255,.75)", background: saved ? P.ink : "rgba(255,255,255,.65)", color: saved ? P.accent : P.muted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
        </button>
      </div>

      {/* title */}
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-.015em", lineHeight: 1.25 }}>{job.title}</h3>
        <p style={{ margin: "6px 0 0", fontSize: 12.5, color: P.muted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{job.desc}</p>
      </div>

      {/* client + meta */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: job.client.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)" }}>{job.client.short}</span>
        <div style={{ flex: 1, fontSize: 11.5, color: P.muted, fontFamily: MONO, fontVariantNumeric: "tabular-nums", display: "flex", gap: 8 }}>
          <span style={{ color: P.ink }}>{fmtDist(job.distanceKm)}</span>
          <span>·</span>
          <span>{job.client.city}</span>
          <span>·</span>
          <span>{job.posted}</span>
        </div>
        <span style={{ padding: "3px 8px", borderRadius: 999, background: urg.bg, color: urg.fg, fontSize: 10.5, fontFamily: MONO, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 600 }}>{urg.label}</span>
      </div>

      {/* footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(10,10,10,.06)" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.015em", fontVariantNumeric: "tabular-nums" }}>€{job.pay[0]}–{job.pay[1]}</div>
          <div style={{ fontSize: 10.5, color: P.sub, fontFamily: MONO, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 2 }}>est. €{midPay(job.pay)} avg</div>
        </div>
        <button className="glj-btn" onClick={() => onApply(job.id)}><Lime/>Apply</button>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function GlossyBrowseJobs() {
  React.useEffect(injectStyles, []);

  const [cat, setCat] = useState("all");
  const [urgent, setUrgent] = useState(false);
  const [near, setNear] = useState(false);
  const [saved, setSaved] = useState(new Set());
  const [applied, setApplied] = useState(new Set());

  const filtered = useMemo(() => {
    return JOBS.filter((j) =>
      (cat === "all" || j.cat === cat)
      && (!urgent || j.urgency === "urgent")
      && (!near || j.distanceKm < 1)
    );
  }, [cat, urgent, near]);

  const onToggleSave = (id) => setSaved((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const onApply = (id) => setApplied((s) => new Set(s).add(id));

  return (
    <div className="glj-body">
      {/* Floating glass nav */}
      <nav className="glj-nav">
        <a href="#" style={{ display: "inline-flex", alignItems: "flex-end", gap: 8, color: P.ink, textDecoration: "none", lineHeight: 1 }}>
          <RobosMark size={22}/>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", display: "inline-flex", alignItems: "flex-end" }}>
            RobosGig<span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 3, background: P.accent, marginLeft: 3, marginBottom: 2, boxShadow: "0 0 8px rgba(132,204,22,.7)" }}/>
          </span>
          <span style={{ marginLeft: 6, padding: "2px 8px", borderRadius: 999, background: "rgba(10,10,10,.06)", fontSize: 10.5, color: P.muted, fontFamily: MONO, letterSpacing: ".06em", fontWeight: 500 }}>WORKER</span>
        </a>
        <div style={{ display: "flex", gap: 6 }}>
          {["Browse", "Saved", "Applications", "Earnings", "Profile"].map((l, i) => (
            <a key={l} className={"glj-navlink" + (i === 0 ? " on" : "")}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.7)", fontSize: 11.5, color: P.muted, fontFamily: MONO }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 8px ${P.accent}` }}/>
            Online · Vienna
          </span>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(160deg,#0A0A0A,#404040)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 10px rgba(10,10,10,.3),inset 0 1px 0 rgba(255,255,255,.2)" }}>W</div>
        </div>
      </nav>

      {/* Hero strip */}
      <section style={{ maxWidth: 1160, margin: "0 auto 28px", padding: "16px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,.55)", border: "1px solid rgba(255,255,255,.7)", backdropFilter: "blur(12px)", fontSize: 11, color: P.muted, fontFamily: MONO, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 500 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: P.accent, boxShadow: `0 0 8px ${P.accent}` }}/>
              Job board · Vienna
            </span>
            <div className="glj-hero-num" style={{ marginTop: 14 }}>
              {JOBS.length} jobs<em> open</em>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: P.muted, lineHeight: 1.5, maxWidth: "44ch" }}>
              Updated 2 min ago · matched to your skills, sorted by closest first.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="glj-btn-ghost">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/></svg>
              Map view
            </button>
            <button className="glj-btn"><Lime/>Post availability</button>
          </div>
        </div>
      </section>

      {/* Filter rail */}
      <section style={{ maxWidth: 1160, margin: "0 auto 22px", padding: "0 4px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {Object.keys(CATS).map((k) => {
          const on = cat === k;
          const c = CATS[k];
          const count = k === "all" ? JOBS.length : JOBS.filter((j) => j.cat === k).length;
          return (
            <button key={k} className={"glj-chip" + (on ? " on" : "")} onClick={() => setCat(k)}>
              {k !== "all" && <span style={{ width: 5, height: 5, borderRadius: 3, background: c.color }}/>}
              {c.label}
              <span style={{ fontSize: 10.5, color: on ? "rgba(255,255,255,.6)" : P.sub, fontFamily: MONO, marginLeft: 2, fontVariantNumeric: "tabular-nums" }}>{count}</span>
            </button>
          );
        })}
        <span style={{ width: 1, height: 22, background: "rgba(10,10,10,.1)", margin: "0 6px" }}/>
        <button className={"glj-chip" + (urgent ? " on" : "")} onClick={() => setUrgent((v) => !v)}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: "#DC2626" }}/>
          Urgent only
        </button>
        <button className={"glj-chip" + (near ? " on" : "")} onClick={() => setNear((v) => !v)}>
          &lt; 1 km
        </button>
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: P.muted, fontFamily: MONO }}>
          showing <b style={{ color: P.ink }}>{filtered.length}</b> of {JOBS.length}
        </span>
      </section>

      {/* Grid */}
      <main style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {filtered.length === 0 ? (
          <div className="glj-card" style={{ gridColumn: "span 3", textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No jobs match your filters.</div>
            <p style={{ margin: "8px 0 0", color: P.muted, fontSize: 13 }}>Try clearing the urgency / distance toggles, or switch to All.</p>
          </div>
        ) : filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            saved={saved.has(job.id)}
            onToggleSave={onToggleSave}
            onApply={onApply}
          />
        ))}
      </main>

      {/* Bottom ribbon — Pro upsell */}
      <section style={{ maxWidth: 1160, margin: "28px auto 0", padding: "22px 26px", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,255,255,.5))", border: "1px solid rgba(255,255,255,.7)", backdropFilter: "blur(14px)", boxShadow: "0 1px 0 rgba(255,255,255,.9) inset,0 10px 30px -16px rgba(10,10,10,.18)", display: "flex", alignItems: "center", gap: 20, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(160deg,#A3E635,#4D7C0F)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px -4px rgba(132,204,22,.45)", display: "flex", alignItems: "center", justifyContent: "center", color: P.ink, fontSize: 18 }}>✦</div>
          <div>
            <b style={{ fontSize: 14 }}>Get to the top of the list.</b>
            <span style={{ display: "block", fontSize: 12.5, color: P.muted }}>Pro workers see new jobs 30 min earlier and pay 12% (vs 15%).</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["+ 38%","more bookings"],["−3%","lower fee"],["★ 4.8","avg Pro rating"]].map(([v, k]) => (
            <div key={k} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.015em", fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 10, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>
        <button className="glj-btn"><Lime/>Upgrade to Pro</button>
      </section>
    </div>
  );
}
